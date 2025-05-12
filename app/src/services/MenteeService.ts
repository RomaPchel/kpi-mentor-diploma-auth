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

    req!.status = MentorRequestStatus.APPROVED;
    req!.processedAt = new Date();
    await this.repo.save(req!);

    const student = await em.findOneOrFail(User, { uuid: req!.user.uuid });

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
    const user = await em.findOne(User, { uuid: uuid });

    await findOrCreateChatBetween(user!, mentor);
  }

  async rejectRequest(uuid: string, userUuid: string) {
    const req = await this.repo.getOneRequestByMentorAndUser(uuid, userUuid);

    req!.status = MentorRequestStatus.REJECTED;
    req!.processedAt = new Date();
    await this.repo.save(req!);
  }

  async getRequestsByUser(userUuid: string) {
    const requests = await this.repo.getAllRequestsByUserAndStatus(
      userUuid,
      MentorRequestStatus.PENDING,
      "createdAt",
      "DESC",
    );

    return requests.map(this.toMenteeRequestResponse);
  }

  private toMenteeRequestResponse(
    request: BecomeMenteeRequest,
  ): BecomeMenteeRequestResponse {
    return {
      uuid: request.uuid,
      motivation: request.motivation ?? "",
      status: request.status,
      createdAt: request.createdAt,
      mentee: {
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

  async getAlreadyRequested(mentorUuid: string, userUuid: string) {
    return await em.findOne(
      BecomeMenteeRequest,
      {
        mentor: mentorUuid,
        user: userUuid,
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
    const mentor = await this.userRepo.getUserById(mentorUuid);

    console.log(mentorUuid, requestingUser.uuid);
    const req = await this.repo.getOneRequestByMentorAndUser(
      requestingUser.uuid,
      mentorUuid,
    );

    if (req) {
      return this.toMenteeRequestResponse(req);
    }

    const request = new BecomeMenteeRequest();
    request.user = requestingUser;
    request.mentor = mentor;
    request.motivation = motivation;
    request.status = MentorRequestStatus.PENDING;

    await this.repo.save(request);

    return this.toMenteeRequestResponse(request);
  }
}
