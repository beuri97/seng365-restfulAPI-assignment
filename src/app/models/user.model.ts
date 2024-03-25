import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from "mysql2";

// ============================== Function Declaration begins ==============================

/**
 * Insert new user into database.
 * @param firstName user's first name.
 * @param lastName user's last name.
 * @param email user's email address.
 * @param password user's password.
 */
const insert  = async (firstName: string,
                       lastName: string,
                       email: string,
                       password: string):Promise<ResultSetHeader> => {
    Logger.info(`Inserting a new user into database...`);
    const conn = await getPool().getConnection();
    const query =
        "INSERT INTO user(email, first_name, last_name, password) VALUES (?, ?, ?, ?)";
    const [ rows ] = await conn.query(query, [email, firstName, lastName, password]);
    Logger.info("Inserting a new user is success!!!");
    conn.release();
    Logger.debug("DB connection is closed...");
    return rows;
}

// -----------------------------------------------------------------------------------------

const getByEmail = async (email: string):Promise<User[]> => {
    Logger.info(`Getting a user whose email is ${email}.`);
    const query
        = "SELECT first_name as firstName, last_name as lastName, auth_token as authToken, id, email, password FROM user WHERE email = ?";
    const conn = await getPool().getConnection();
    const [ rows ] = await conn.query(query, [ email ]);
    conn.release();
    Logger.debug("DB connection is closed...");
    return rows;
}

// -----------------------------------------------------------------------------------------

const getById = async (id: number):Promise<User[]> => {
    Logger.info(`Getting User by Id ${id}`);
    const query
        = "SELECT first_name as firstName, last_name as lastName, auth_token as authToken, image_filename as imageFilename, id, email, password  FROM user WHERE id = ? ";
    Logger.debug(`Connecting to Database and find user id ${id}`);
    const conn = await getPool().getConnection();
    const [ result ] = await conn.query(query, [ id ]);
    (result.length !== 0) ? Logger.info("User found from database.")
        : Logger.warn("No user found from database.");
    conn.release();
    Logger.debug("DB connection is closed.");
    return result;
}

// -----------------------------------------------------------------------------------------

const getByToken = async (token: string):Promise<number> => {
    Logger.info("Execute getByToken function to get a user by Token");
    const query = "SELECT * FROM user WHERE auth_token = ?";
    Logger.debug("Connecting to Database");
    const conn = await getPool().getConnection();
    const [ rows ] = await conn.query(query, [ token ]);
    (rows.length !== 0) ? Logger.info("User found from database.")
                        : Logger.warn("No user found from database.");
    conn.release();
    Logger.debug("DB connection is closed.");
    return (rows.length !== 0) ? rows[0].id : undefined;
}

// -----------------------------------------------------------------------------------------

const authorisedGranted = async (email: string, token: string)=> {
    Logger.info("Execute authorisedGranted function to grant a user a Auth_token");
    const conn = await getPool().getConnection();
    if(email !== null) {
        const query = "UPDATE user SET auth_token = ? WHERE email = ?";
        Logger.debug("Update user's auth_token");
        await conn.query(query, [ token, email ]);
    } else {
        const query = "UPDATE user SET auth_token = null WHERE auth_token = ?";
        Logger.debug("Remove user's auth_token");
        await conn.query(query, [ token ]);
    }
    Logger.info("Success");
    conn.release();
    Logger.debug("DB connection is closed...");
}

// -----------------------------------------------------------------------------------------

const edit = async (id:number, email: string, firstName: string, lastName: string, password: string): Promise<void> => {
    Logger.info("Execute edit function to update a user information");
    const query
        = "UPDATE user SET email = ?, first_name = ?, last_name = ?, password = ? WHERE id = ?";
    Logger.debug("Connecting to Database");
    const conn = await getPool().getConnection();
    await conn.query(query, [ email, firstName, lastName, password, id ]);
    Logger.info("Update Success");
    conn.release();
    Logger.debug("DB connection is closed...");
}

// ============================== Function Declaration Ends ==============================

export { insert, getByEmail,getByToken, authorisedGranted, getById, edit };

// End of 'user.model.ts'