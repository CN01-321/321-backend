import { ObjectId, WithId } from "mongodb";
import { Carer, DateRange } from "./carer.js";
import { Owner } from "./owner.js";
import { getCollection } from "../mongo.js";

export interface Request {
  _id?: ObjectId;
  carer?: ObjectId;
  isCompleted: boolean;
  pets: Array<ObjectId>;
  requestedOn: Date;
  dateRange: DateRange;
}

async function addRequestToCarer(requestId: ObjectId, carerId: ObjectId) {
  const carerCollection = await getCollection<Carer>();
  await carerCollection.updateOne(
    { _id: carerId },
    { $push: { offers: requestId } }
  );
}

async function addRequestToNearby(owner: WithId<Owner>, request: Request) {
  // TODO search for nearby carers (haversine?) and push the request to them
}

export async function createNewRequest(owner: WithId<Owner>, request: Request) {
  request._id = new ObjectId();

  const ownerCollection = await getCollection<Owner>();
  await ownerCollection.updateOne(
    { _id: owner._id },
    { $push: { requests: request } }
  );

  request.carer
    ? await addRequestToCarer(request._id, request.carer)
    : await addRequestToNearby(owner, request);

  return request;
}

// TODO request removal?
