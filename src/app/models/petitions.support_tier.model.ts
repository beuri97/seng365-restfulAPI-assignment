import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================

const getTierByPetitionId = async (petitionId : number) : Promise<SupportTier[]> => {
    Logger.info("Getting Support_tier using petitionId");
    const query = "SELECT title, description, cost, id as supportTierId FROM support_tier WHERE support_tier.petition_id = ? GROUP BY supportTierId";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug("Getting tuples from relation");
    const [ rows ] = await db.query(query, [ petitionId ]);
    Logger.debug("And Success!!!");
    db.release();
    Logger.debug("db Connection closed");
    return rows;
}

const insertSupportTiers = async (tiers : SupportTier[], petitionId : number) : Promise<void> => {
    Logger.info("Adding support tiers into database");
    const query : string = "INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ? )";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug(`Found ${tiers.length} support tier(s). Adding all support tier(s) into database`);
    for(const tier of tiers) {
        await db.query(query, [ petitionId, tier.title, tier.description, tier.cost ]);
    }
    Logger.debug("Success!");
    db.release();
    Logger.debug("DB connection closed");
}

const insertSupportTier = async (tier: SupportTier, petitionId :number) :Promise<void> => {
    Logger.info("Adding support tiers into database");
    const query : string = "INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ? )";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug(`Adding support tier into database`);
    await db.query(query, [ petitionId, tier.title, tier.description, tier.cost ]);
    Logger.debug("Success!");
    db.release();
    Logger.debug("DB connection closed");
}

// ============================== Function Declaration Ends ==============================

export { getTierByPetitionId, insertSupportTiers, insertSupportTier };