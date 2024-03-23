import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================

const getAll = async (q : string, categoryIds : number[], supportingCost : number,
                      ownerId : number, supporterId : number, sortBy : string) : Promise<Petition[]> => {
    Logger.info("Executing getAll function to get petitions.");
    Logger.info("Generating query. This is really long");
    let query = "SELECT petition.id as petitionId, petition.title, petition.description, petition.category_id as categoryId, " +
                        "petition.owner_id as ownerId, user.first_name as ownerFirstName, user.last_name as ownerLastName, " +
                        "total as numberOfSupporters, petition.creation_date as creationDate, min(support_tier.cost) as supportingCost " +
                        "FROM petition " +
                        "LEFT JOIN supporter on supporter.petition_id = petition.id " +
                        "LEFT JOIN (SELECT supporter.petition_id, count(supporter.petition_id) as total FROM supporter GROUP BY supporter.petition_id) " +
                        "as count_supporter on count_supporter.petition_id = petition.id " +
                        "LEFT JOIN support_tier on support_tier.petition_id = petition.id  " +
                        "LEFT JOIN user on user.id = petition.owner_id ";
    let whereClause : string = "";
    let havingClause : string = "";
    switch (categoryIds) {
        case null:
            break;
        default:
            const ids = "(" + categoryIds.join(", ") + ") ";
            whereClause += ((whereClause === "") ? "WHERE petition.category_id IN " : "AND petition.category_id IN ") + ids;
            break;
    }
    switch (supportingCost) {
        case null:
            break;
        default:
            whereClause += (whereClause === "") ? `WHERE support_tier.cost <= ${supportingCost} `
                                                :`AND support_tier.cost <= ${supportingCost} `;
            break;
    }
    switch (ownerId) {
        case null:
            break;
        default:
            whereClause += (whereClause === "") ? `WHERE petition.owner_id = ${ownerId} ` : `AND petition.owner_id = ${ownerId} `;
            break;
    }
    switch (supporterId) {
        case null:
            break;
        default:
            whereClause += (whereClause === "") ? `WHERE supporter.user_id = ${supporterId} ` : `AND supporter.user_id = ${supporterId} `;
    }
    switch (q) {
        case null:
            break;
        default:
            havingClause += `HAVING petition.title LIKE \'%${q}%\' OR petition.description LIKE \'%${q}%\' `;
            break;
    }
    let orderByClause = "ORDER BY ";
    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            orderByClause += "petition.title ASC";
            break;
        case "ALPHABETICAL_DESC":
            orderByClause += "petition.title DESC";
            break;
        case "COST_ASC":
            orderByClause += "supportingCost ASC";
            break;
        case "COST_DESC":
            orderByClause += "supportingCost DESC";
            break;
        case "CREATED_ASC":
            orderByClause += "creationDate ASC";
            break;
        case "CREATED_DESC":
            orderByClause += "creationDate DESC";
            break;
    }
    orderByClause += ", petitionId";
    query += (whereClause + "GROUP BY petition.id " + havingClause + orderByClause);
    Logger.info("Generating query is finished.");
    Logger.debug("Open Database");
    const db = await getPool().getConnection();
    const [ result ] = await db.query(query);
    Logger.debug(`Search is finished. ${result.length} found(s).`);
    db.release();
    Logger.debug("DB connection is closed");
    return result;
}

// -----------------------------------------------------------------------------------------

const getPetitionById = async (petitionId : number) : Promise<Petition> => {
    Logger.info("Executing getPetitionById function to get petition by id");
    const query : string  = "SELECT petition.id as petitionId, petition.title, petition.category_id as categoryId, " +
                            "petition.owner_id as ownerId, user.first_name as ownerFirstName, user.last_name as ownerLastName, " +
                            "total as numberOfSupporters, petition.creation_date as creationDate, petition.description, " +
                            "sum(support_tier.cost) as moneyRaised " +
                            "FROM petition " +
                            "LEFT JOIN (SELECT supporter.petition_id, count(supporter.petition_id) as total FROM supporter GROUP BY supporter.petition_id) " +
                            "as count_supporter on count_supporter.petition_id = petition.id " +
                            "LEFT JOIN support_tier on support_tier.petition_id = petition.id  " +
                            "LEFT JOIN user on user.id = petition.owner_id " +
                            "WHERE petition.id = ? GROUP BY petition.id";
    Logger.debug("Connecting to Database");
    const db = await getPool().getConnection();
    Logger.debug("Getting result");
    const [ row ] = await db.query(query, [ petitionId ]);
    Logger.debug("And Success!");
    db.release();
    Logger.debug("Database Connection is closed");
    return row[0];
}

const getAllCategories = async() :Promise<Category[]> => {
    Logger.info("Getting all categories");
    const query : string = "SELECT id as categoryId, name FROM category ORDER BY categoryId";
    Logger.debug("Connection to Database and get all tuples from category");
    const db = await getPool().getConnection();
    const [ rows ] = await db.query(query);
    Logger.debug("SUCCESS!!!");
    db.release();
    Logger.debug("Database connection is closed");
    return rows;
}

export { getAll, getPetitionById, getAllCategories };