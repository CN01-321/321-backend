import { ObjectId } from "mongodb";

class PetService {
    getPet(petId: string) {
        if (!ObjectId.isValid(petId)) {
            throw new Error
        }
    }
}