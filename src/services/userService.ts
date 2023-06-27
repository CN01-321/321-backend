import { UserModel } from "../models/models.js"
import User from "../models/user.js";

async function getById(id: string): Promise<User | null> {
    return await UserModel.findById(id);
}

const userService = {
    getById,
}

export default userService;