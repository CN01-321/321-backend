import { ObjectId, WithId } from "mongodb";
import { BadRequestError, handleUpdateResult } from "../errors.js";
import {
  Request,
  acceptRequestRespondent,
  createNewRequest,
  findNearbyRequests,
  getOwnerRequests,
  getRequestPets,
  getRequestWithId,
  getRespondents,
} from "../models/request.js";
import { Owner } from "../models/owner.js";
import { DateRange } from "../models/carer.js";
import { ObjectSchema, array, date, object, string } from "yup";

class RequestService {
  async getRequest(requestId: string) {
    if (!ObjectId.isValid(requestId)) {
      throw new BadRequestError("Request id is invalid");
    }

    return await getRequestWithId(new ObjectId(requestId));
  }

  async getRequestsForOwner(owner: WithId<Owner>) {
    return await getOwnerRequests(owner);
  }

  async newRequest(owner: WithId<Owner>, newRequestForm: NewRequestForm) {
    await validateNewRequestForm(newRequestForm);

    const request: Request = {
      _id: new ObjectId(),
      carer: newRequestForm.carer ? new ObjectId(newRequestForm.carer) : null,
      status: "pending",
      pets: newRequestForm.pets.map((p) => new ObjectId(p)),
      respondents: [],
      requestedOn: new Date(),
      dateRange: {
        startDate: new Date(newRequestForm.dateRange.startDate),
        endDate: new Date(newRequestForm.dateRange.endDate),
      },
      additionalInfo: newRequestForm.additionalInfo,
    };

    return handleUpdateResult(await createNewRequest(owner, request));
  }

  async getRequestRespondents(owner: WithId<Owner>, requestId: string) {
    if (!ObjectId.isValid(requestId)) {
      throw new BadRequestError("Request id is invalid");
    }

    return await getRespondents(owner, new ObjectId(requestId));
  }

  async acceptRespondent(
    owner: WithId<Owner>,
    requestId: string,
    respondentId: string
  ) {
    if (!ObjectId.isValid(requestId)) {
      throw new BadRequestError("Request id is invalid");
    }

    if (!ObjectId.isValid(respondentId)) {
      throw new BadRequestError("Respondent id is invalid");
    }

    return handleUpdateResult(
      await acceptRequestRespondent(
        owner,
        new ObjectId(requestId),
        new ObjectId(respondentId)
      )
    );
  }

  async getNearbyRequests(owner: WithId<Owner>) {
    return findNearbyRequests(owner);
  }

  async getPetsFromRequest(requestId: string) {
    if (!ObjectId.isValid(requestId)) {
      throw new BadRequestError("Request id is invalid");
    }

    return getRequestPets(new ObjectId(requestId));
  }
}

const requestService = new RequestService();

export default requestService;

export interface NewRequestForm {
  carer: string | null;
  pets: string[];
  additionalInfo?: string;
  dateRange: DateRange;
}

function validateNewRequestForm(form: NewRequestForm) {
  const startDate = new Date(Date.now() - 5 * 1000);

  const schema: ObjectSchema<NewRequestForm> = object({
    carer: string()
      .required()
      .nullable()
      .test((c) => (c ? ObjectId.isValid(c) : true)),
    pets: array()
      .of(string().required().test(ObjectId.isValid))
      .min(1)
      .required(),
    additionalInfo: string().optional(),
    dateRange: object({
      startDate: date()
        .min(startDate, `${form.dateRange.startDate} is less than ${startDate}`)
        .required(),
      endDate: date().min(new Date(form.dateRange.startDate)).required(),
    }).required(),
  });

  return schema.validate(form);
}
