import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getById} from "../models/user.model";
import {retrieveImage, updateUserImage} from "../models/user.image.model";
import * as path from "path";
import * as fs from "fs";
import {fileIsExist} from "../resources/validation";

const rootPath = "storage/default/";

// ============================== Function Declaration begins ==============================

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId: number = parseInt(req.params.id, 10);
        const user: User[] = await retrieveImage(userId);
        if(user.length === 0) {
            Logger.warn("sending status 404.");
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const image = user[0].imageFilename;
        Logger.debug(process.cwd());
        if(!image || !fileIsExist(process.cwd()+'/'+rootPath+image)) {
            Logger.warn("sending status 404.");
            res.statusMessage = "Not Found. User has no image";
            res.status(404).send();
            return
        }
        const extension = path.extname(image).toLowerCase();
        switch (extension) {
            case ".png":
                res.set("Content-Type", "image/png");
                break;
            case ".jpg":
            case ".jpeg":
                res.set("Content-Type", "image/jpeg");
                break;
            case ".gif":
                res.set("Content-Type", "image/gif");
                break;
        }
        res.status(200).sendFile(image, {root: rootPath});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ---------------------------------------------------------------------------------------

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        // get User detail and token
        const userId:number = parseInt(req.params.id, 10);
        const authToken = req.get("X-Authorization");
        if (!authToken) {
            res.status(401).send();
            return;
        }
        const user:User = (await getById(userId))[0];
        if(user === undefined) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }else if(authToken !== user.authToken) {
            Logger.warn("User tried to change other user's image. Sending status 403.");
            res.statusMessage = "Forbidden. " + "Can not change another user's profile photo";
            res.status(403).send();
            return;
        }
        // image file validation
        const imageFile = req.body;
        let imageExtension:string;
        switch(req.get("Content-Type")) {
            case "image/jpeg":
                imageExtension = ".jpg";
                break;
            case "image/png":
                imageExtension = ".png";
                break;
            case "image/gif":
                imageExtension = ".gif";
                break;
            default:
                imageExtension = undefined;
                break;
        }
        if(isNaN(userId) || imageFile.length === 0 || !imageExtension) {
            const message: string = isNaN(userId) ? "User Id must be a number"
                : "Invalid image supplied (possibly incorrect file type)";
            Logger.warn(`${message}. Sending status 400.`);
            res.statusMessage = "Bad Request. " + message;
            res.status(400).send();
            return;
        }
        const userCurrentImage = user.imageFilename;
        (userCurrentImage === null) ? res.status(201) : res.status(200);
        const newUserImageName: string = `user_${userId}` + imageExtension;
        await updateUserImage(userId, newUserImageName);
        fs.writeFileSync(rootPath+newUserImageName, imageFile);
        res.send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ---------------------------------------------------------------------------------------

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId : number = parseInt(req.params.id, 10);
        const isNumber = !isNaN(userId);
        const user : User = (isNumber) ? (await getById(userId))[0] : undefined;
        const token : string = req.get("X-Authorization");
        if(!user) {
            res.statusMessage = "Not Found. No such user with ID given";
            res.status(404).send();
            return;
        } else if(!token) {
            res.status(401).send();
            return;
        } else if(token !== user.authToken) {
            res.status(403).send("- Cannot delete anther user's profile photo");
            return;
        }
        const userImage : string = user.imageFilename;
        if(!userImage) {
            res.statusMessage = "Bad Request. User does not have image.";
            res.status(400).send();
            return;
        }
        await updateUserImage(userId, null);
        await fs.promises.unlink(rootPath + userImage);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ============================== Function Declaration Ends ==============================

export {getImage, setImage, deleteImage}