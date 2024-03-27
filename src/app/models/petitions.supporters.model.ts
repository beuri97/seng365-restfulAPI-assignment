import Logger from "../../config/logger";
import {getPool} from "../../config/db";
// ============================== Function Declaration begins ==============================

const getSupportersByPetitionId = async (petitionId :number) : Promise<Supporter[]> => {
    Logger.info(`Getting all supporters supports petitionId ${petitionId}`);
    const query :string = "SELECT supporter.id as supportId, support_tier_id as supportTierId, message, user_id as supporterId, first_name as supporterFirstName, last_name as supporterLastName, timestamp " +
                            "FROM supporter ,user " +
                            "WHERE user.id = user_id AND petition_id = ? " +
                            "ORDER BY timestamp DESC";
    Logger.debug("Open Database connection");
    const db = await getPool().getConnection();
    Logger.debug("Retrieving Database");
    const [ rows ] = await db.query(query, [ petitionId ]);
    Logger.debug("Done");
    db.release();
    Logger.debug("Connection is closed");
    return rows;
}

// -----------------------------------------------------------------------------------------

const supporterIsExist = async (petitionId :number, tierId :number) :Promise<boolean> => {
    Logger.info("Check supporter is exist");
    const query :string = "SELECT * FROM supporter WHERE petition_id = ? AND support_tier_id = ? ";
    Logger.debug("Open Database Connection.");
    const db = await getPool().getConnection();
    Logger.debug("Retrieving Database");
    const [ rows ] = await db.query(query, [ petitionId, tierId ]);
    Logger.debug("Done");
    db.release();
    Logger.debug("DB connection is closed");
    return rows.length !== 0;
}

// -----------------------------------------------------------------------------------------

const insertSupporter = async (petitionId :number, tierId :number, userId :number, message :string) :Promise<void> => {
    const query :string = "INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp) VALUES (?, ?, ?, ?, NOW())";
    const db = await getPool().getConnection();
    await db.query(query, [ petitionId, tierId, userId, message ]);
    db.release();
}

// ============================== Function Declaration Ends ==============================

export { getSupportersByPetitionId, supporterIsExist, insertSupporter };