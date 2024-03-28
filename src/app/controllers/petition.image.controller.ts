import {Request, Response} from "express";
import Logger from "../../config/logger";
import path from "path";
import {retrievePetitionImage, updatePetitionImage} from "../models/petition.image.model";
import {getByToken} from "../models/user.model";
import fs from "fs";
import {getPetitionById, getPetitionImage} from "../models/petitions.model";
import {fileIsExist} from "../resources/validation";

const rootPath = "storage/default/";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId: number = parseInt(req.params.id, 10);
        const petition : Petition[] = await retrievePetitionImage(petitionId);
        if(petition.length === 0) {
            Logger.warn("sending status 404.");
            res.statusMessage = "Not Found. No petition found with id";
            res.status(404).send();
            return;
        }
        const image = petition[0].imageFileName;
        if(image === null || !fileIsExist(process.cwd() + '/' + rootPath+image)) {
            Logger.warn("sending status 404.");
            res.statusMessage = "Not Found. Petition has no image";
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

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        // get User detail and token
        const petitionId:number = parseInt(req.params.id, 10);
        const token :string = req.get("X-Authorization");
        const userId :number = await getByToken(token);
        if (!userId) {
            res.status(401).send();
            return;
        }
        const petition :Petition = await getPetitionById(petitionId);
        if(petition === undefined) {
            res.statusMessage = "Not found. No petition found with id";
            res.status(404).send();
            return;
        }else if(userId !== petition.ownerId) {
            Logger.warn("User tried to change other user's petition image. Sending status 403.");
            res.statusMessage = "Forbidden. Only the owner of a petition can change the petition image";
            res.status(403).send();
            return;
        }
        // image file validation
        const imageFile = req.body;
        let imageExtension :string;
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
            const message: string = isNaN(userId) ? "petition Id must be a number"
                : "Invalid image supplied (possibly incorrect file type)";
            Logger.warn(`${message}. Sending status 400.`);
            res.statusMessage = "Bad Request. " + message;
            res.status(400).send();
            return;
        }
        const petitionCurrentImage = petition.imageFileName = await getPetitionImage(petitionId);
        (!petitionCurrentImage) ? res.status(201) : res.status(200);
        const newPetitionImageName: string = `petition_${petitionId}` + imageExtension;
        await updatePetitionImage(petitionId, newPetitionImageName);
        fs.writeFileSync(rootPath+newPetitionImageName, imageFile);
        res.send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};