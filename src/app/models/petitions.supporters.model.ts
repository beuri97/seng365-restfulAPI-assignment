import Logger from "../../config/logger";
import {getPool} from "../../config/db";
// ============================== Function Declaration begins ==============================

const getSupportersByPetitionId = async (petitionId : number) : Promise<Supporter[]> => {
    Logger.info(`Getting all supporters supports petitionId ${petitionId}`);
    const query = "SELECT id as supporterId FROM supporter WHERE petition_id = ? ";
    Logger.debug("Open Database connection");
    const db = await getPool().getConnection();
    Logger.info("Retrieving Database");
    const [ rows ] = await db.query(query, [ petitionId ]);
    Logger.debug("Done");
    db.release();
    Logger.debug("Connection is closed");
    return rows;
}

// ============================== Function Declaration Ends ==============================

export { getSupportersByPetitionId };