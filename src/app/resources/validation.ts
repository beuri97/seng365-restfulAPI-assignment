import Ajv from "ajv";
import addFormats from "ajv-formats";
import {v4 as uuidV4} from "uuid";
import fs from "fs";

const validation = new Ajv({removeAdditional: 'all', strict: false});
validation.addFormat("integer", /^\d+$/);
addFormats(validation);
const verification = async (schema: object, data: any): Promise<any> => {
    try{
        const validator = validation.compile(schema);
        const valid: boolean = validator(data);
        if (!valid) return validation.errorsText(validator.errors);
        return true;
    } catch (e) {
        return e.message;
    }
}

const generateToken = async ():Promise<string> => {
    return uuidV4();
}

const fileIsExist = (filePath: string) :boolean => {
    try {
        fs.statSync(filePath);
        return true;
    } catch (err) {
        if(err.code === 'ENOENT') {
            return false;
        } else {
            throw err;
        }
    }
}

export { verification, generateToken, fileIsExist };


