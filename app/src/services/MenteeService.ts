import { User } from "../entities/User.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../controllers/ChatController.js";
import { MenteeRepository } from "../repositories/MenteeRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type {
  CreateMenteeRequest,
  MenteeRequestResponse,
} from "../interfaces/MenteeInterfaces.js";
import { MentorRepository } from "../repositories/MentorRepository.js";
import { MentorStudent } from "../entities/StudentMentor.js";
import { HttpError } from "../errors/HttpError.js";

export class MenteeService {
  private readonly repo: MenteeRepository;
  private readonly userRepo: UserRepository;
  private readonly mentorRepo: MentorRepository;

  constructor() {
    this.repo = new MenteeRepository();
    this.userRepo = new UserRepository();
    this.mentorRepo = new MentorRepository();
  }

  async getAllMenteesByUser(userUuid: string) {
    return await this.repo.getAllMenteesByUser(userUuid);
  }

  async approveRequest(id: string, user: User) {
    const req = await this.repo.getOneRequestByMentorAndUser(id, user.uuid);

    req.status = MentorRequestStatus.APPROVED;
    req.processedAt = new Date();
    await this.repo.save(req);

    const foundUser = await this.userRepo.getUserById(user.uuid);
    await findOrCreateChatBetween(foundUser as User, user);
    const relation = new MentorStudent();
    relation.student = foundUser;
    relation.mentor = user;
    await this.mentorRepo.saveMentorStudent(relation);

    await findOrCreateChatBetween(foundUser, user);
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

  async getRequestByMentorAndUser(mentorUuid: string, userUuid: string) {
    return await this.repo.getOneRequestByMentorAndUser(mentorUuid, userUuid);
  }

  async createRequest(requestingUser: User, request: CreateMenteeRequest) {
    const mentor = await this.userRepo.getUserById(request.mentorId);

    const req = await this.repo.getOneRequestByMentorAndUser(
      request.mentorId,
      requestingUser.uuid,
    );

    if (req) {
      throw new HttpError("REQUEST_ALREADY_EXISTS", 400);
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
