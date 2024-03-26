import bcrypt from "bcryptjs";


const hash = async (password: string): Promise<string> => {
    const key: number = 10;
    return await bcrypt.hash(password, key);
}

const compare = async (password: string, hashed: string): Promise<boolean> => {
    return await bcrypt.compareSync(password, hashed);
}

export {hash, compare}