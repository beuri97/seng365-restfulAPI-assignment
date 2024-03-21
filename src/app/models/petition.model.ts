import Logger from "../../config/logger";
import {getPool} from "../../config/db";

// ============================== Function Declaration begins ==============================

const getAllPetition = async (startIndex : number, count : number, q : string,
                              categoryIds : number[], supportingCost : number,
                              ownerId : number, supporterId : number, sortBy : string) => {
    let query = "SELECT petition.id as petitionId, petition.title, petition.description, " +
                        "petition.category_id as categoryIds, petition.owner_id as ownerId, user.first_name as ownerFirstName, " +
                        "user.last_name as ownerLastName, total as numberOfSupporters, petition.creation_date as creationDate, " +
                        "min(support_tier.cost) as supportingCost " +
                        "FROM petition " +
                        "LEFT JOIN supporter on petition.owner_id = supporter.user_id AND supporter.petition_id = petition.id " +
                        "LEFT JOIN (SELECT supporter.petition_id, count(supporter.petition_id) as total FROM supporter GROUP BY supporter.petition_id) " +
                        "as count_supporter on count_supporter.petition_id = petition.id " +
                        "LEFT JOIN support_tier on support_tier.petition_id = petition.id  " +
                        "LEFT JOIN user on user.id = petition.owner_id ";
    let whereClause : string = null;
    switch (q) {
        case null:
            break;
        default:
            whereClause += `WHERE petition.title = ${q} OR petition.description = ${q} `;
            break;
    }
    switch (categoryIds) {
        case null:
            break;
        default:
            const ids = "(" + categoryIds.join(", ") + ") ";
            whereClause += ((whereClause === null) ? "WHERE categoryIds IN " : "AND categoryIds IN ") + ids;
            break;
    }
    switch (supportingCost) {
        case null:
            break;
        default:
            whereClause += (whereClause === null) ? `WHERE support_tier.cost <= ${supportingCost} ` : `AND support_tier.cost <= ${supportingCost} `;
            break;
    }
    switch (ownerId) {
        case null:
            break;
        default:
            whereClause += (whereClause === null) ? `WHERE ownerId = ${ownerId} ` : `AND ownerId = ${ownerId} `;
            break;
    }
    switch (supporterId) {
        case null:
            break;
        default:
            whereClause += (whereClause === null) ? `WHERE supporterId = ${supporterId} ` : `AND supporterId = ${supporterId} `;
    }
    query += "GROUP BY petition.id ";
    // let orderByClause = "ORDER BY ";
    // switch (sortBy) {
    //     case "ALPHABETICAL_ASC":
    // }
}




export { getAllPetition }