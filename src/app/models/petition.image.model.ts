import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================

const retrievePetitionImage = async (petitionId: number): Promise<Petition[]> => {
    Logger.info("getting petition image");
    const query = "SELECT image_filename as imageFileName FROM petition WHERE id = ?";
    Logger.debug("Connecting to Database");
    const db = await getPool().getConnection();
    const [ result ] = await db.query(query, [ petitionId ]);
    Logger.info("DB Run Success");
    db.release();
    Logger.debug("DB connection is closed...");
    return result;
}

// -----------------------------------------------------------------------------------------

const updatePetitionImage = async (petitionId: number, file: string): Promise<void> => {
    Logger.info(`Updating petition ${petitionId}'s image_filename`);
    const query: string = "UPDATE petition SET image_filename = ? WHERE id = ? ";
    Logger.debug("Connecting to Database");
    const db = await getPool().getConnection();
    await db.query(query, [ file, petitionId ]);
    Logger.info("... and Update success!!");
    db.release();
    Logger.debug("DB connection is closed");
}

// ============================== Function Declaration Ends ==============================

export { retrievePetitionImage, updatePetitionImage };