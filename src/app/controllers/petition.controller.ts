import {Request, Response} from "express";
import Logger from '../../config/logger';
import {getAll, getAllCategories, getPetitionById, getPetitionByTitle, insertPetition} from '../models/petitions.model'
import {getByToken} from '../models/user.model';
import { getTierByPetitionId, insertSupportTiers } from "../models/petitions.supporter_tier.model";
import {verification} from "../resources/validation";
import * as schemas from "../resources/schemas.json";

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
        const categories : number[] = (await getAllCategories()).map((category: Category) => category.categoryId);
        const isValid : any = await verification(schemas.petition_post, req.body);
        if(isValid !== true || !categories.includes(req.body.categoryId)) {
            res.statusMessage = !categories.includes(req.body.categoryId) ? "Category must reference an existing category." : isValid;
            res.status(400).send();
            return;
        }
        // get petition
        const petition = await getPetitionByTitle(req.body.title);
        // flag for filtering input supportTier
        let filtered : boolean = false;
        let tempTier : SupporterTier[] = req.body.supportTiers;
        if(petition !== undefined) {
            if(petition.ownerId !== userId) {
                res.status(403).send("Only the owner of a petition may change it");
                return;
            }
            /*
            check title is exist and array of input supporter tiers is subset of supporter tier array that is already exist in database
            if true then we do not add or create into petition or support_tier table in our database. These are already exist
             */
            if(petition.title === req.body.title && tempTier.every(element => petition.supportTiers.includes(element))) {
                res.status(403).send("Petition title already exists.");
                return;
            }
            // check duplicated support tier and omit them.
            if(tempTier.filter(element => petition.supportTiers.includes(element)).length !== 0) {
                filtered = true;
                tempTier = tempTier.filter(element => !petition.supportTiers.includes(element));
            }
            if(petition.supportTiers.length + tempTier.length > 3) {
                res.statusMessage = "The Petition should have 3 support tiers at most";
                res.status(400).send();
                return;
            }
            // get all support tier titles petition has.
            const supportTierTitle : string[] = (await getTierByPetitionId(petition.petitionId)).map((supportTier : SupporterTier) => supportTier.title);
            for (const tier of petition.supportTiers) {
                if(supportTierTitle.includes(tier.title)) {
                    res.statusMessage = "Supporter tier title must be unique within those for the petition";
                    res.status(400).send();
                    return;
                }
            }
        }
        // if (req.body.supportTiers.length > 3 || req.body.supportTiers.length < 1) {
        //     res.statusMessage = "A Petition must have between 1 and 3 support tiers (inclusive)";
        //     res.status(400).send();
        //     return;
        // }
        let newPetitionId : number = null;
        if(petition === undefined) {
            newPetitionId = (await insertPetition(req.body.title, req.body.description, userId, req.body.categoryId)).insertId;
        }
        const petitionId = (petition !== undefined) ? petition.petitionId : newPetitionId;
        await insertSupportTiers(tempTier, petitionId);
        if (filtered) {
            res.statusMessage = "Created     NOTE:Duplicate support tier is omitted"
        }
        res.status(201).send({"petitionId": petitionId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
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