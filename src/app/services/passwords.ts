import bcrypt from "bcryptjs";

// ============================== Function Declaration begins ==============================

const hash = async (password: string): Promise<string> => {
    const key: number = 10;
    return await bcrypt.hash(password, key);
}

const compare = async (password: string, hashed: string): Promise<boolean> => {
    return bcrypt.compareSync(password, hashed);
}

// ============================== Function Declaration Ends ==============================

export {hash, compare}