import { ObjectId, WithId } from "mongodb";
import { DateRange } from "./carer.js";
import { Owner } from "./owner.js";
import { carerCollection, ownerCollection } from "../mongo.js";

export interface Request {
  _id?: ObjectId;
  carer: ObjectId | null;
  isCompleted: boolean;
  pets: Array<ObjectId>;
  requestedOn: Date;
  dateRange: DateRange;
}

export async function getRequestWithId(requestId: ObjectId) {
  const res = await ownerCollection.aggregate([
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
  ]);
  const request = await res.next();
  return request?.requests as Request;
}

export async function getOwnerRequests(owner: WithId<Owner>) {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$requests" },
    { $replaceWith: "$requests" },
    // add some of the carers info onto the request by joining their information
    // if the carer id is present in the request
    {
      $lookup: {
        from: "users",
        let: { carer: "$carer" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", { $toObjectId: "$$carer" }] },
            },
          },
          { $project: { _id: 0, carerName: "name" } },
        ],
        as: "carerInfo",
      },
    },
    // flatten the carerInfo field so that their info is with the rest of the request
    { $unwind: { path: "$carerInfo", preserveNullAndEmptyArrays: true } },
    { $addFields: { carerName: "$carerInfo.carerName" } },
    { $project: { carerInfo: 0 } },
  ]);

  return res.toArray();
}

async function addRequestToCarer(requestId: ObjectId, carerId: ObjectId) {
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
  await ownerCollection.updateOne(
    { _id: owner._id },
    { $push: { requests: request } }
  );

  request.carer
    ? await addRequestToCarer(request._id, request.carer)
    : await addRequestToNearby(owner, request);

  return request;
}

export async function updateRequest(owner: WithId<Owner>, request: Request) {
  await ownerCollection.updateOne(
    { _id: owner._id, "requests._id": request._id },
    { $set: { "requests.$": request } }
  );

  return await getRequestWithId(request._id!);
}

// TODO request removal?
