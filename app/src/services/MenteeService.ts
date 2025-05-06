import { User } from "../entities/User.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../controllers/ChatController.js";
import { MenteeRepository } from "../repositories/MenteeRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type { MenteeRequest, MenteeRequestResponse } from "../interfaces/UserInterface";

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

  async approveRequest(uuid: string, user: User) {
    const req = await this.repo.getOneRequestByMentorAndUser(uuid, user.uuid);

    req.status = MentorRequestStatus.APPROVED;
    req.processedAt = new Date();
    await this.repo.save(req);
    await em.persist(req);

    const student = await em.findOneOrFail(User, { uuid: req.user.uuid });

    const foundUser = await this.userRepo.getUserById(user.uuid);
    await findOrCreateChatBetween(foundUser as User, user);
    const relation = em.create(MentorStudent, {
      student,
      mentor: mentor,
    });
    em.persist(relation);

    await findOrCreateChatBetween(student, mentor);

    await em.flush();
  }

  async rejectRequest(uuid: string, userUuid: string) {
    const req = await this.repo.getOneRequestByMentorAndUser(uuid, userUuid);

    req.status = MentorRequestStatus.REJECTED;
    req.processedAt = new Date();
    await this.repo.save(req);
  }

  async getAllRequestsByUser(userUuid: string) {
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
  ): MenteeRequestResponse {
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

  async createRequest(
    requestingUser: User,
    request: MenteeRequest,
  ) {
    const mentor = await this.userRepo.getUserById(request.mentorId);

    const req = await this.repo.getOneRequestByMentorAndUser(
      request.mentorId,
      requestingUser.uuid,
    );

    if (req) {
      throw new Error(
        "You have already requested to become a mentee for this mentor.",
      );
    }

    const requestEntity = new BecomeMenteeRequest();
    requestEntity.user = requestingUser;
    requestEntity.mentor = mentor;
    requestEntity.motivation = request.motivation;
    requestEntity.status = MentorRequestStatus.PENDING;

    await this.repo.save(requestEntity);

    return this.toMenteeRequestResponse(requestEntity);
  }
}
