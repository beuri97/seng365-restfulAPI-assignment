import {Request, Response} from "express";
import Logger from '../../config/logger';
import { getAll, getPetitionById, getAllCategories } from '../models/petitions.model'
import { getTierByPetitionId } from "../models/petitions.supporter_tier.model";

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
        const supportTier : SupporterTier[] = await getTierByPetitionId(petitionId);
        petition.supportTiers = supportTier.length !== 0 ? supportTier : "No Supporter Found";
        res.status(200).send(petition);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const isValid : boolean =
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