import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================


const getTierByPetitionId = async (petitionId : number) : Promise<SupporterTier[]> => {
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

// ============================== Function Declaration Ends ==============================

export { getTierByPetitionId };