import { em } from "../db/config.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { MentorStudent } from "../entities/StudentMentor.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";

/**
 * Repository for managing operations related to mentees, mentors, and mentee requests.
 */
export class MenteeRepository {
  async getOneRequestByMentorAndUser(mentorUuid: string, userUuid: string) {
    return await em.findOneOrFail(BecomeMenteeRequest, {
      mentor: mentorUuid,
      user: userUuid,
    });
  }

  async getAllRequestsByUserAndStatus(
    userUuid: string,
    status: MentorRequestStatus,
    orderBy: string,
    order: "ASC" | "DESC",
  ) {
    return await em.find(
      BecomeMenteeRequest,
      { mentor: userUuid, status },
      {
        populate: ["user"],
        orderBy: { [orderBy]: order },
      },
    );
  }

  async save(request: BecomeMenteeRequest) {
    await em.persistAndFlush(request);
  }

  async getAllMenteesByUser(userUuid: string) {
    return await em.find(MentorStudent, {mentor: userUuid});
  }
}
