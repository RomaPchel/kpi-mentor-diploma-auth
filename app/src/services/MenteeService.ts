import { User } from "../entities/User.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../controllers/ChatController.js";
import { MenteeRepository } from "../repositories/MenteeRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type { BecomeMenteeRequestResponse } from "../interfaces/UserInterface";
import { em } from "db/config.js";
import { MentorStudent } from "entities/StudentMentor.js";

export class MenteeService {
  private readonly repo: MenteeRepository;
  private readonly userRepo: UserRepository;

  constructor() {
    this.repo = new MenteeRepository();
    this.userRepo = new UserRepository();
  }

  async getAllMenteesByUser(userUuid: string) {
    return await this.repo.getAllMenteesByUser(userUuid);
  }

    async getMentorsForStudent(student: User) {
        const menteeRelations = await em.find(MentorStudent, {
            student: student,
        });

        return (
            menteeRelations.map((rel) => {
                const mentor = rel.mentor;
                return {
                    uuid: mentor.uuid,
                    name: `${mentor.firstName} ${mentor.lastName}`,
                    avatar: mentor.avatar,
                    department: mentor.department,
                    interests: mentor.interests,
                };
            }) ?? []
        );
    }


    async approveRequest(uuid: string, mentor: User) {
    const req = await this.repo.getOneRequestByMentorAndUser(uuid, mentor.uuid);

    req.status = MentorRequestStatus.APPROVED;
    req.processedAt = new Date();
    await this.repo.save(req);

      const student = await em.findOneOrFail(User, { uuid: req.user.uuid });

      const existingRelation = await em.findOne(MentorStudent, {
          student,
          mentor,
      });

      if (!existingRelation) {
          const relation = em.create(MentorStudent, {
              student,
              mentor,
          });
          em.persist(relation);
      }

    const foundUser = await this.userRepo.getUserById(mentor.uuid);
    await findOrCreateChatBetween(foundUser as User, mentor);
  }

  async rejectRequest(uuid: string, userUuid: string) {
    const req = await this.repo.getOneRequestByMentorAndUser(uuid, userUuid);

    req.status = MentorRequestStatus.REJECTED;
    req.processedAt = new Date();
    await this.repo.save(req);
  }

  async getRequestsByUser(userUuid: string) {
    const requests = await this.repo.getAllRequestsByUserAndStatus(
      userUuid,
      MentorRequestStatus.PENDING,
      "createdAt",
      "DESC",
    );

    return {
      requests: requests.map(this.toMenteeRequestResponse),
    };
  }

  private toMenteeRequestResponse(
    request: BecomeMenteeRequest,
  ): BecomeMenteeRequestResponse {
    return {
      id: request.uuid,
      motivation: request.motivation ?? "",
      status: request.status,
      createdAt: request.createdAt,
      user: {
        uuid: request.user.uuid,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        avatar: request.user.avatar || "",
      },
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
    userUuid: string,
    motivation: string,
  ) {
    const mentor = await this.userRepo.getUserById(userUuid);

    const req = await this.repo.getOneRequestByMentorAndUser(
      userUuid,
      requestingUser.uuid,
    );

    if (req) {
      throw new Error(
        "You have already requested to become a mentee for this mentor.",
      );
    }

    const request = new BecomeMenteeRequest();
    request.user = requestingUser;
    request.mentor = mentor;
    request.motivation = motivation;
    request.status = MentorRequestStatus.PENDING;

    return this.toMenteeRequestResponse(request);
  }
}
