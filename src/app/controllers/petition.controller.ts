import {Request, Response} from "express";
import Logger from '../../config/logger';
import {getAll, getAllCategories, getPetitionById, getPetitionByTitle, insertPetition, removePetition, updatePetition} from '../models/petitions.model'
import {getByToken} from '../models/user.model';
import { getTierByPetitionId, insertSupportTiers } from "../models/petitions.supporter_tier.model";
import {verification} from "../resources/validation";
import * as schemas from "../resources/schemas.json";
import {getSupportersByPetitionId} from "../models/petitions.supporters.model";

// ============================== Function Declaration begins ==============================

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        // get startIndex
        const from : number = req.query.startIndex === undefined ? 0 : parseInt(req.query.startIndex.toString(), 10);
        // get count
        const count : number = req.query.count === undefined ? null : parseInt(req.query.count.toString(), 10);
        // get q
        const searchQuery  = req.query.q === undefined ? null : req.query.q.toString();
        // get categoryIds
        const categoryIds : number[] = req.query.categoryIds === undefined ? null
                                                    : (req.query.categoryIds as string[])
                                                        .map(item => parseInt(item, 10));
        // get supportingCost
        const supportingCost = req.query.supportingCost === undefined ? null
                                                    : parseInt(req.query.supportingCost.toString(), 10);
        // get ownerId
        const ownerId = req.query.ownerId === undefined ? null : parseInt(req.query.ownerId.toString(), 10);
        // get supporterId
        const supporterId = req.query.supporterId === undefined ? null : parseInt(req.query.supporterId.toString(), 10);
        // define valid sortBy value
        const sortList = ["ALPHABETICAL_ASC", "ALPHABETICAL_DESC", "COST_ASC", "COST_DESC", "CREATED_ASC", "CREATED_DESC"];
        // get sortBy value and check the value is valid
        const sortBy = req.query.sortBy === undefined ? "CREATED_ASC"
                                : sortList.includes(req.query.sortBy.toString()) ? req.query.sortBy.toString()
                                : undefined;
        // send Bad Request if any invalid query values found
        if((from !== null && isNaN(from)) || (count !== null && isNaN(count)) || (ownerId !== null && isNaN(ownerId)) || (supporterId !== null && isNaN(supporterId))
            || (supportingCost !== null && isNaN(supportingCost)) || !sortBy || (categoryIds !== null && categoryIds.includes(NaN))
            || searchQuery === "") {
            res.status(400).send();
            return;
        }
        const result = await getAll(searchQuery, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        const endIndex = from + count;
        res.status(200).send(
                            {"petitions": result.slice(from, (count === null) ? result.length : endIndex),
                                "count": result.length});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// -----------------------------------------------------------------------------------------

const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId : number = parseInt(req.params.id, 10);
        if(isNaN(petitionId)) {
            res.status(400).send();
            return;
        }
        const petition : Petition = await getPetitionById(petitionId);
        if (!petition) {
            res.statusMessage = "No petition with id";
            res.status(404).send();
            return;
        }
        petition.supportTiers = await getTierByPetitionId(petitionId);
        res.status(200).send(petition);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// -----------------------------------------------------------------------------------------

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get("X-Authorization");
        // get user_id to check validation
        const userId = ( token !== undefined) ? await getByToken(token) : undefined;
        if(!userId) {
            res.status(401).send();
            return;
        }
        // get all categoryId as number
        const categories : number[] = ((await getAllCategories()).map((category: Category) => category.categoryId));
        const isValid : any = await verification(schemas.petition_post, req.body);
        const inputSupportTier : SupporterTier[] = req.body.supportTiers;
        const inputTierTitle : string[] = (!inputSupportTier || inputSupportTier.length === 0) ?
                                            [] : (req.body.supportTiers).map((tier : SupporterTier) => tier.title);
        const categoryNotExist = !categories.includes(req.body.categoryId);
        const tierTitleIsDuplicated = inputTierTitle.length !== new Set(inputTierTitle).size;
        if(isValid !== true || categoryNotExist || tierTitleIsDuplicated) {
            res.statusMessage = "Bad Request\t";
            res.statusMessage += categoryNotExist ? "Category must reference an existing category."
                                                : tierTitleIsDuplicated ? "Support tier title must be unique within those for the petition"
                                                : isValid;
            res.status(400).send();
            return;
        }
        // get petition
        const petition = await getPetitionByTitle(req.body.title);
        if(petition !== undefined) {
            res.status(403).send("Petition title already exists.");
            return;
        }
        const petitionId = (await insertPetition(req.body.title, req.body.description, userId, req.body.categoryId)).insertId;
        await insertSupportTiers(req.body.supportTiers, petitionId);
        res.status(201).send({"petitionId" : petitionId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// -----------------------------------------------------------------------------------------

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get("X-Authorization");
        const userId = (token !== undefined) ? await getByToken(token) : undefined;
        if (!userId) {
            res.status(401).send();
            return;
        }
        const isValid = await verification(schemas.petition_patch, req.body);
        const categories : number[] = (await getAllCategories()).map((category: Category) => category.categoryId);
        const petitionId = parseInt(req.params.id, 10);
        const categoryIdNotValid = req.body.categoryId !== undefined ? !categories.includes(parseInt(req.body.categoryId, 10)) : false;
        if(isValid !== true || categoryIdNotValid || isNaN(petitionId)) {
            res.statusMessage = "Bad Request. Invalid Information";
            res.status(400).send();
            return;
        }
        const petition = await getPetitionById(petitionId);
        if (!petition) {
            res.statusMessage = "Not Found. No petition found with id";
            res.status(404).send();
            return;
        }
        const titleIsExist = await getPetitionByTitle(req.body.title);
        if (userId !== petition.ownerId || (titleIsExist && petition.petitionId !== petitionId)) {
            res.statusMessage = "Forbidden. ";
            if (userId !== petition.ownerId) res.statusMessage += " Only the owner of a petition may change it";
            else if (titleIsExist) res.statusMessage += "Petition title already exists";
            res.status(403).send();
            return;
        }
        const input = req.body;
        const title = input.title !== undefined ? input.title : petition.title;
        const description = input.description !== undefined ? input.description : petition.description;
        const categoryId = input.categoryId !== undefined ? input.categoryId : petition.categoryId;
        await updatePetition(petitionId, title, description, categoryId);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get("X-Authorization");
        const userId = (token !== undefined) ? await getByToken(token) : undefined;
        if(!userId) {
            res.status(401).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        const petition = !isNaN(petitionId) ? await getPetitionById(petitionId) : undefined;
        if(!petition) {
            res.statusMessage = "Not Found. No petition found with id";
            res.status(404).send();
            return;
        }
        const supporter = await getSupportersByPetitionId(petitionId);
        if (userId !== petition.ownerId || supporter.length !== 0) {
            let message = "";
            if (userId !== petition.ownerId) message += "- Only the owner of a petition may delete it";
            // Hide information about support tier to user who is not the petition's owner
            else if (supporter.length !== 0) message += "- Can not delete a petition with one or more supporters";
            res.status(403).send(message);
            return;
        }
        await removePetition(petitionId);
        res.status(200).send();
        } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// -----------------------------------------------------------------------------------------

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const result : Category[] = await getAllCategories();
        res.status(200).send(result);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

// ============================== Function Declaration Ends ==============================

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};