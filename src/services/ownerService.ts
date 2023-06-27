import { OwnerModel, PetModel } from "../models/models.js";
import Pet from "../models/pet.js";
import User from "../models/user.js";
import Owner from "../models/owner.js";

async function getPets(user: User): Promise<Pet[] | null> {
    if (user == null) return null;
    return await PetModel.find({ owner: user._id });
}

async function addPet(user: User, name: string, petType: string): Promise<Pet | null> {
    // Get Owner from Database
    if (user == null) return null;
    const owner: Owner | null = await OwnerModel.findById(user._id);
    if (owner === null) return null;

    // Create Pet
    const createdPet: Pet | null = await PetModel.create({name: name, petType: petType});
    if (createdPet === null) return null;

    // Get Pet from Database
    const pet: Pet | null = await PetModel.findById(createdPet._id);
    if (pet === null) return null;

    // Add references
    await OwnerModel.updateOne(owner, { $push: { pets: pet } });
    await PetModel.updateOne(pet, { owner: owner });

    return await PetModel.findById(createdPet._id);
}

async function deletePet(user: User, id: string): Promise<boolean> {
    if (user == null) return false;
    await PetModel.findByIdAndDelete(id);
    return true;
}

const ownerService = {
    getPets,
    addPet,
    deletePet,
}

export default ownerService;