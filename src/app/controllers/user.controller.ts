import {Request, Response} from "express";
import Logger from '../../config/logger';
import { rootUrl } from "../routes/base.routes";
import * as schemas from '../resources/schemas.json';
import {generateToken, verification} from "../resources/validation";
import * as users from '../models/user.model';
import {hash, compare} from "../services/passwords";
import {authorisedGranted, getByEmail, getByToken, getById, edit} from "../models/user.model";

// ============================== Function Declaration begins ==============================

const register = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`POST ${rootUrl}/users/register     Register a new User`);
        const valid = await verification(schemas.user_register, req.body);
        // Check if all user's input is valid.
        if(valid !== true) {
            Logger.error(`Invalid Information found! Response Status 400`);
            res.statusMessage = `Bad Request. Invalid Information`;
            res.status(400).send();
            return;
        }
        // check if new user's email is already in use.
        if(((await users.getByEmail(req.body.email)).length !== 0)){
            Logger.warn("Email already in used. send status 403.")
            res.status(403).send("Email already in use");
            return;
        }
        const hashedPassword: string = await hash(req.body.password);
        Logger.info("Send User info to model");
        const result = await users.insert(req.body.firstName, req.body.lastName,
                                                                req.body.email, hashedPassword);
        res.status(201).send({"userId": result.insertId});
        Logger.info("Register success!!");
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ------------------------------------------------------------------------------

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST ${rootUrl}/user/login`);
    Logger.info("User is logging in");
    try{
        // Verify user's input values
        const valid: any = await verification(schemas.user_login, req.body);
        if (valid !== true) {
            Logger.warn(`User (${req.body.email})'s validation is failed`);
            res.statusMessage = "Bad Request. Invalid information.";
            res.status(400).send();
            return;
        }
        // Check user email is exist and return if it exists.
        const searchedUser = await getByEmail(req.body.email);
        if(searchedUser.length === 0) {
            res.statusMessage = "UnAuthorized. Incorrect email/password";
            res.status(401).send();
            return;
        }
        // check user password is matched
        const passwordMatched = await compare(req.body.password, searchedUser[0].password);
        if (!passwordMatched) {
            res.statusMessage = "UnAuthorized. Incorrect email/password";
            res.status(401).send();
            return;
        }
        const id = searchedUser[0].userId;
        // create token
        const authToken = await generateToken();
        // give auth_token to user
        await authorisedGranted(req.body.email, authToken);
        res.status(200).send({"userId": id, "token": authToken});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ------------------------------------------------------------------------------

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        Logger.http(`POST ${rootUrl}/users/logout`);
        Logger.info("User is logging out.")
        const token = req.get("X-Authorization");
        const isExist = await getByToken(token);
        if(!isExist) {
            res.statusMessage = "Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        Logger.debug("Log out process begins.");
        // take auth_token from user
        await authorisedGranted(null, token);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ------------------------------------------------------------------------------

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`GET ${rootUrl}/users/:id`);
        const id = parseInt(req.params.id, 10);
        // check req.params.id is NaN
        if(isNaN(id)) {
            Logger.warn("Request parameter is not a number. Send status 400.");
            res.statusMessage = "Bad Request. Id must be a number";
            res.status(400).send();
            return;
        }
        // Find user by id
        const result: User[] = await getById(id);
        if (result.length === 0) {
            Logger.warn("No user Found. Send status 404.");
            res.statusMessage = "No user with specified ID";
            res.status(404).send();
            return;
        }
        const token: string = req.get("X-Authorization");
        const user: User = result[0];
        const userToken: string = user.authToken;
        // send user detail with status 200
        res.status(200).send((token === userToken)
                                        ? {"email": user.email, "firstName": user.firstName, "lastName": user.lastName}
                                        : {"firstName": user.firstName, "lastName": user.lastName});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ------------------------------------------------------------------------------

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`PATCH ${rootUrl}/users/:id`);
        const id = parseInt(req.params.id, 10);
        const token = req.get("X-Authorization");
        // If id is not NaN get User by id or assign null
        // If no user found undefined will be returned
        const user = (!isNaN(id)) ? (await getById(id))[0] : undefined;
        // check all validates.

        if(await verification(schemas.user_edit, req.body) !== true || isNaN(id) ||
            (!req.body.currentPassword && req.body.password !== undefined)) {
            Logger.warn("Invalid information detected. Send status 400.");
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send();
            return;
        }
        if (user === undefined) {
            Logger.warn("User Not Found. Send status 404");
            res.status(404).send();
            return;
        }
        if(token === "" || token !== user.authToken) {
            Logger.warn("Authorize failure. Send status 401");
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        const checkCurrentPassword = (req.body.currentPassword && req.body.password) ? await compare(req.body.currentPassword, user.password): true;
        if (!checkCurrentPassword) {
            res.statusMessage = "Invalid currentPassword";
            res.status(401).send();
            return;
        }
        const anotherUser = await getByEmail(req.body.email);
        // collecting error message
        let message: string = null;
        if(token !== user.authToken)
            message = "Can not edit another user's information";
        else if(anotherUser.length !== 0 && user.userId !== anotherUser[0].userId)
            message = "Email is already in use";
        else if(req.body.password === req.body.currentPassword && (req.body.password !== undefined && req.body.currentPassword !== undefined))
            message = "Identical current and new passwords";
        // send status
        if (message !== null) {
            Logger.warn("Forbidden case is found. Send status 403 with a message.");
            res.statusMessage = "Forbidden. " + message;
            res.status(403).send();
            return;
        } else {
            const email = (req.body.email === undefined || req.body.email === "") ? user.email : req.body.email;
            const firstName = (req.body.firstName === "" || req.body.firstName === undefined) ? user.firstName : req.body.firstName;
            const lastName = (req.body.lastName === "" || req.body.lastName === undefined) ? user.lastName : req.body.lastName;
            const hashed = (req.body.password !== undefined && checkCurrentPassword) ? await hash(req.body.password) : user.password;
            await edit(id, email, firstName, lastName, hashed);
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ============================== Function Declaration Ends ==============================

export {register, login, logout, view, update}
