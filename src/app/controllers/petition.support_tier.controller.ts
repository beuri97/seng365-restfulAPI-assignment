import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getByToken} from "../models/user.model";
import {verification} from "../resources/validation";
import * as schemas from '../resources/schemas.json'
import {
    getTierByPetitionId,
    insertSupportTier,
    removeSupportTier,
    updateSupportTier
} from "../models/petitions.support_tier.model";
import {getPetitionById} from "../models/petitions.model";
import {supporterIsExist} from "../models/petitions.supporters.model";

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
            errorMessage = "Cannot add a support tier if 3 already exist";
        else if(supportTiersTitle.includes(req.body.title))
            errorMessage = "Support title not unique within petition";
        // triggered if we have message
        if (errorMessage !== null) {
            res.statusMessage += errorMessage;
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
            const supportTiers :SupportTier[] = petition.supportTiers = await getTierByPetitionId(petitionId);
            supportTierTitles = supportTiers.map(tier => tier.title);
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
        const titleIsExist = supportTierTitles.includes(req.body.title);
        let errorMessage = null;
        if(titleIsExist)
            errorMessage = "Support title not unique within petition";
        else if(await supporterIsExist(petitionId, supportTierId))
            errorMessage = "Cannot edit a support tier if a supporter already exists for it"
        if (errorMessage !== null) {
            res.statusMessage = "Forbidden. " + errorMessage;
            res.status(403).send();
            return;
        }
        supportTier.title = !req.body.title ? supportTier.title : req.body.title;
        supportTier.description = !req.body.description ? supportTier.description : req.body.description;
        supportTier.cost = !req.body.cost ? supportTier.cost : req.body.cost;
        await updateSupportTier(supportTier, petitionId);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const token :string = req.get("X-Authorization");
        const userId :number = await getByToken(token);
        const petitionId :number = parseInt(req.params.id, 10);
        const tierId :number = parseInt(req.params.tierId, 10);
        if(!userId) {
            res.status(401).send();
            return;
        } else if (isNaN(petitionId) || isNaN(tierId)) {
            res.status(400).send();
            return;
        }
        const petition :Petition = await getPetitionById(petitionId);
        const supportTiers :SupportTier[] = petition.supportTiers = await getTierByPetitionId(petitionId);
        if(!petition || !supportTiers.find((tier :SupportTier) => tier.supportTierId === tierId)) {
            res.status(404).send();
            return;
        }
        let errorMessage :string = null;
        if(userId !== petition.ownerId)
            errorMessage = "Only the owner of a petition may delete it";
        else if (await supporterIsExist(petitionId, tierId))
            errorMessage = "Can not delete a support tier if a supporter already exists for it";
        else if (supportTiers.length === 1)
            errorMessage = "Can not remove a support tier if it is the only one for a petition";
        if (errorMessage !== null) {
            res.statusMessage = "Forbidden. " + errorMessage;
            res.status(403).send();
            return;
        }
        await removeSupportTier(tierId);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};