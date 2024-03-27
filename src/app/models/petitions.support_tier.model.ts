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

// -----------------------------------------------------------------------------------------

const insertSupportTiers = async (tiers : SupportTier[], petitionId : number) : Promise<void> => {
    Logger.info("Adding support tiers into database");
    const query : string = "INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ? )";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug(`Found ${tiers.length} support tier(s). Adding all support tier(s) into database`);
    for(const tier of tiers)
        await db.query(query, [ petitionId, tier.title, tier.description, tier.cost ]);
    Logger.debug("Success!");
    db.release();
    Logger.debug("DB connection closed");
}

// -----------------------------------------------------------------------------------------

const insertSupportTier = async (tier: SupportTier, petitionId :number) :Promise<void> => {
    Logger.info("Adding support tiers into database");
    const query :string = "INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ? )";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug(`Adding support tier into database`);
    await db.query(query, [ petitionId, tier.title, tier.description, tier.cost ]);
    Logger.debug("Success!");
    db.release();
    Logger.debug("Database connection is closed");
}

const updateSupportTier = async (supportTier: SupportTier, supportTierId : number) :Promise<void> => {
    Logger.info("Updating support tiers into database");
    const query :string = "UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE id = ? ";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug(`Updating supporter where id is ${supportTierId}`);
    await db.query(query, [supportTier.title, supportTier.description, supportTier.cost, supportTierId]);
    Logger.debug("Done");
    db.release();
    Logger.debug("Database connection is closed");
}

// -----------------------------------------------------------------------------------------

const removeSupportTier = async (tierId :number):Promise<void> => {
    Logger.info(`Removing a support tier where id is ${tierId}`);
    const query :string = "DELETE FROM support_tier WHERE id = ? ";
    Logger.debug("Connecting Database");
    const db = await getPool().getConnection();
    Logger.debug("Removing...");
    await db.query(query, [ tierId ]);
    Logger.debug("Done");
    db.release();
    Logger.debug("Database connection is closed");
}

// ============================== Function Declaration Ends ==============================

export { getTierByPetitionId, insertSupportTiers, insertSupportTier, updateSupportTier, removeSupportTier };