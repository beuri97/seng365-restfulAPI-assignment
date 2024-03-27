import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getById, getByToken} from "../models/user.model";
import {verification} from "../resources/validation";
import * as schemas from '../resources/schemas.json'
import {getTierByPetitionId, insertSupportTier} from "../models/petitions.support_tier.model";
import {getPetitionById} from "../models/petitions.model";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get("X-Authorization");
        const userId = (token !== undefined) ? await getByToken(token) : undefined;
        const petitionId = parseInt(req.params.id, 10);
        if (!userId) {
            res.status(401).send();
            return;
        } else if (await verification(schemas.support_tier_post, req.body) !== true || isNaN(petitionId)) {
            res.status(400).send();
            return;
        }
        const petition :Petition = await getPetitionById(petitionId);
        if (!petition) {
            res.status(404).send();
            return;
        }
        if (userId !== petition.ownerId) {
            res.statusMessage = "Forbidden. Only the owner of a petition may modify it"
            res.status(403).send();
            return;
        }
        const supportTiersTitle :string[] = (await getTierByPetitionId(petitionId)).map((tier: SupportTier) => tier.title);
        let errorMessage :string = null;
        if(supportTiersTitle.length === 3)
            errorMessage += "Cannot add a support tier if 3 already exist";
        else if(supportTiersTitle.includes(req.body.title))
            errorMessage += "Support title not unique within petition";
        // triggered if we have message
        if (errorMessage !== null) {
            res.statusMessage = "Forbidden. " + errorMessage;
            res.status(403).send();
            return;
        }
        await insertSupportTier(req.body, petitionId);
        res.status(201).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const token :string = req.get("X-Authorization");
        const userId :number = await getByToken(token);
        if(!userId) {
            res.status(401).send();
            return;
        }
        const petitionId :number = parseInt(req.params.id, 10);
        const supportTierId :number = parseInt(req.params.tierId, 10);
        if ((await verification(schemas.support_tier_patch, req.body)) !== true || isNaN(petitionId) || isNaN(supportTierId)) {
            res.status(400).send();
            return;
        }
        const petition :Petition = await getPetitionById(petitionId);
        let supportTier :SupportTier;
        let supportTierTitles : string[];
        if (petition !== undefined){
            supportTierTitles = petition.supportTiers.map(tier => tier.title);
            supportTier = petition.supportTiers.find((tier: SupportTier) => tier.supportTierId === supportTierId);
        }
        if (!petition || !supportTier) {
            res.status(404).send();
            return;
        } else if(userId !== petition.ownerId) {
            res.statusMessage = "Forbidden. Only the owner of a petition may modify it";
            res.status(403).send();
            return;
        }
        // TODO - Create function 'supporterIsExist' to check supporter support using the tier
        // const titleIsExist = petition.supportTiers.includes(req.body.title)
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
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

export {addSupportTier, editSupportTier, deleteSupportTier};