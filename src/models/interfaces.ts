import { ObjectId } from "mongodb";

type UserType = "owner" | "carer";

type PetType = "dog" | "cat" | "bird" | "rabbit";

type PetSize = "small" | "medium" | "large";

export interface User {
    name?: string
    email: string
    password: string
    address?: string
    phone?: string
    bio?: string
    locationLat?: number
    locationLng?: number
    pfp?: string
    userType: UserType
    notifications: Array<Notification>
    recievedFeedback: Array<Feedback>
}

export interface Owner extends User {
    pets: Array<Pet>
    broadRequests: Array<Request>
    directRequests: Array<Request>
}

export interface Carer extends User {
    skillsAndExp?: string
    preferredTravelDistance?: number
    hourlyRate?: number
    offers: Array<Offer>
    unavailabilities: Array<DateRange>
    preferredPets: Array<PreferredPet>
    licences: Array<Licence>
}

export interface Notification {
    name: string
    desc: string
}

export interface Feedback {
    author: ObjectId 
    rating?: number
    text?: string
    image?: string
    comments: Array<Comment>
}

export interface Comment {
    author: ObjectId
    text?: string
    comments: Array<Comment>
}

export interface Pet {
    name: string
    petType: PetType
    petSize: PetSize
    vaccinated: boolean
    friendly: boolean
    neutered: boolean
    pfp?: string
    feedback: Array<Feedback>
}

export interface Request {
    carer?: ObjectId
    complete: boolean
    pets: Array<ObjectId>
    requestedOn: Date
    dateRange: DateRange
}

export interface Offer {
    request: ObjectId
}

export interface DateRange {
    startDate: Date
    duration: number
}

export interface PreferredPet{
    petType: PetType
    petSize: PetSize
}

export interface Licence{
    name: string
    number: string
}