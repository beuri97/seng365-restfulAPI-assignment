import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getSupportersByPetitionId, insertSupporter} from "../models/petitions.supporters.model";
import {getPetitionById, isUserPetition} from "../models/petitions.model";
import {getByToken} from "../models/user.model";
import * as schemas from '../resources/schemas.json';
import {verification} from "../resources/validation";
import {getTierByPetitionId} from "../models/petitions.support_tier.model";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId :number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send();
            return;
        }
        const petition = await getPetitionById(petitionId);
        if (!petition) {
            res.status(404).send();
            return;
        }
        const supporters :Supporter[] = await getSupportersByPetitionId(petitionId);
        res.status(200).send(supporters);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get("X-Authorization");
        const userId = await getByToken(token);
        const petitionId = parseInt(req.params.id, 10);
        if (!userId) {
            res.status(401).send();
            return;
        } else if (await verification(schemas.support_post, req.body) !== true || isNaN(petitionId)) {
            res.status(400).send();
            return;
        }
        const supporters :Supporter[] = await getSupportersByPetitionId(petitionId);
        const supportTiers :SupportTier[] = await getTierByPetitionId(petitionId);

        let errorMessage :string = null;
        if(!supporters) {
            errorMessage = "No petition found with id";
        } else if (!supportTiers.find((tier :SupportTier) => tier.supportTierId === req.body.supportTierId)) {
            errorMessage = "Support tier does not exist";
        }
        if (errorMessage !== null) {
            res.statusMessage = "Not Found. " + errorMessage;
            res.status(404).send();
            return;
        }
        if (await isUserPetition(petitionId, userId))
            errorMessage = "Cannot support your own petition";
        else if (supporters.find(tier => tier.supportId === req.body.supportTierId && tier.supporterId === userId)) {
            errorMessage = "Already supported at this tier";
        }
        if (errorMessage !== null) {
            res.statusMessage = "Forbidden. " + errorMessage;
            res.status(403).send();
            return;
        }
        await insertSupporter(petitionId,req.body.supportTierId, userId, req.body.message);
        res.status(201).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}