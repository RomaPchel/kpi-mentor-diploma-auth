import { User } from "../entities/User.js";
import { em } from "../db/config.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../controllers/ChatController.js";
import { MentorStudent } from "../entities/StudentMentor.js";

export class MenteeService {
  async getYourMenteeRequest(mentorUuid: string, userUuid: string) {
    return await em.find(BecomeMenteeRequest, {
      mentor: mentorUuid,
      user: userUuid,
    });
  }

  async getYourMentees(userUuid: string) {
    return await em.find(MentorStudent, {
      mentor: userUuid,
    });
  }

  async approveMenteeRequest(uuid: string, mentor: User) {
    const req = await em.findOneOrFail(BecomeMenteeRequest, {
      uuid,
      mentor,
    });

    req.status = MentorRequestStatus.APPROVED;
    req.processedAt = new Date();
    await em.persistAndFlush(req);

    const user = await em.findOne(User, { uuid: req.user.uuid });
    await findOrCreateChatBetween(user as User, mentor);
  }

  async rejectMenteeRequest(uuid: string, mentor: string) {
    const req = await em.findOneOrFail(BecomeMenteeRequest, {
      uuid,
      mentor,
    });

    req.status = MentorRequestStatus.REJECTED;
    req.processedAt = new Date();
    await em.persistAndFlush(req);
  }

  async getMentorMenteeRequests(mentorUuid: string) {
    const requests = await em.find(
      BecomeMenteeRequest,
      { mentor: mentorUuid, status: MentorRequestStatus.PENDING },
      {
        populate: ["user"],
        orderBy: { createdAt: "DESC" },
      },
    );

    return {
      requests: requests.map((req) => ({
        uuid: req.uuid,
        motivation: req.motivation,
        status: req.status,
        createdAt: req.createdAt,
        mentee: {
          uuid: req.user.uuid,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          avatar: req.user.avatar || "",
        },
      })),
    };
  }

  async getMentorMenteeRequest(mentorUuid: string, userUuid: string) {
    return await em.findOne(
      BecomeMenteeRequest,
      {
        mentor: mentorUuid,
        user: userUuid,
        status: MentorRequestStatus.PENDING,
      },
      {
        orderBy: { createdAt: "DESC" },
      },
    );
  }

  async becomeMentee(
    requestingUser: User,
    mentorUuid: string,
    motivation: string,
  ) {
    console.log(mentorUuid);
    const mentor = await em.findOneOrFail(User, { uuid: mentorUuid });

    const existing = await em.findOne(BecomeMenteeRequest, {
      user: requestingUser,
      mentor: mentor,
    });

    if (existing) {
      throw new Error(
        "You have already requested to become a mentee for this mentor.",
      );
    }

    const request = new BecomeMenteeRequest();
    request.user = requestingUser;
    request.mentor = mentor;
    request.motivation = motivation;
    request.status = MentorRequestStatus.PENDING;

    await em.persistAndFlush(request);

    return {
      success: true,
      message: "Mentee request submitted successfully.",
    };
  }
}
