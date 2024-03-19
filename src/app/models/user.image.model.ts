import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const retrieveImage = async (id: number): Promise<User[]> => {
    Logger.info("Execute getImage function to get a user image");
    const query = "SELECT image_filename as imageFilename FROM user WHERE id = ?";
    Logger.debug("Connecting to Database");
    const db = await getPool().getConnection();
    const [ result ] = await db.query(query, [ id ]);
    Logger.info("DB Run Success");
    db.release();
    Logger.debug("DB connection is closed...");
    return result;
}

const updateUserImage = async (id: number, file: string): Promise<void> => {
    Logger.info(`Executing updateUserImage function to update user ${id}'s image_filename`);
    const query: string = "UPDATE user SET image_filename = ? WHERE id = ? ";
    Logger.debug("Connecting to Database");
    const db = await getPool().getConnection();
    await db.query(query, [ file, id ]);
    Logger.info("... and Update success!!");
    db.release();
    Logger.debug("DB connection is closed");
}

export { retrieveImage, updateUserImage }