import mongo from "../mongo";
import { ObjectId, WithId } from "mongodb";
import { User, Owner, Pet } from "../models/interfaces";
import { ModifyResult } from "mongoose";

async function getPets(owner: WithId<Owner> | null): Promise<Pet[] | null> {
    if (owner == null) return null;
    return owner.pets;
}

async function addPet(owner: WithId<Owner> | null, petInfo: Pet) {
    if (owner == null) return null;

    const db = await mongo.database();
    return await db.updateOne({ _id: owner._id }, { "$push": { pets: petInfo }});
}

async function deletePet(owner: WithId<Owner>, petId: ObjectId) {
    if (owner == null) return null;

    const db = await mongo.database();
    return await db.findOneAndDelete({ _id: owner._id, pets: { "$elemMatch": { _id: petId } } });
}

const ownerService = {
    getPets,
    addPet,
    deletePet,
}

export default ownerService;