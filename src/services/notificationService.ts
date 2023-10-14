/**
 * @file Manages notification related functionality
 * @author George Bull
 */

import { ObjectId } from "mongodb";
import { NotFoundError, handleUpdateResult } from "../errors.js";
import { Notification, newNotification } from "../models/user.js";
import { findOwnerWithRequest } from "../models/owner.js";

interface NotificationInfo {
  name?: string;
  pfp?: string;
}

class NotificationService {
  async pushRecievedDirect(carerId: ObjectId, owner: NotificationInfo) {
    const notification: Notification = {
      notificationType: "recievedDirect",
      subjectName: owner.name ?? "",
      subjectPfp: owner.pfp,
      notifiedOn: new Date(),
    };

    handleUpdateResult(await newNotification(carerId, notification));
  }

  async pushRecievedFeedback(revieweeId: ObjectId, reviewer: NotificationInfo) {
    const notification: Notification = {
      notificationType: "recievedFeedback",
      subjectName: reviewer.name ?? "",
      subjectPfp: reviewer.pfp,
      notifiedOn: new Date(),
    };

    handleUpdateResult(await newNotification(revieweeId, notification));
  }

  async pushCarerAcceptedDirect(offerId: ObjectId, carer: NotificationInfo) {
    const owner = await findOwnerWithRequest(offerId);
    if (!owner) {
      throw new NotFoundError(
        "Owner could not be found to push notification to"
      );
    }

    const notification: Notification = {
      notificationType: "acceptedDirect",
      subjectName: carer.name ?? "",
      subjectPfp: carer.pfp,
      notifiedOn: new Date(),
    };

    handleUpdateResult(await newNotification(owner._id, notification));
  }

  async pushOwnerAcceptedBroad(
    respondentId: ObjectId,
    owner: NotificationInfo
  ) {
    const notification: Notification = {
      notificationType: "acceptedBroad",
      subjectName: owner.name ?? "",
      subjectPfp: owner.pfp,
      notifiedOn: new Date(),
    };

    handleUpdateResult(await newNotification(respondentId, notification));
  }
}

const notificationService = new NotificationService();

export default notificationService;
