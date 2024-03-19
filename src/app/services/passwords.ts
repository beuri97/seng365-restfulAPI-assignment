import bcrypt from "bcryptjs";


const hash = async (password: string): Promise<string> => {
    const key: number = 10;
    return await bcrypt.hash(password, key);
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    return await bcrypt.compare(password, comp);
}

export {hash, compare}