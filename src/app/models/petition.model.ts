import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================

const getAll = async (q : string, categoryIds : number[], supportingCost : number,
                      ownerId : number, supporterId : number, sortBy : string) : Promise<Petition[]> => {
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

export {getAll};