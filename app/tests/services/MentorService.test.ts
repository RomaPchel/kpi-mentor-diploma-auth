import { MentorService } from "../../src/services/MentorService.js";
import { MentorRepository } from "../../src/repositories/MentorRepository.js";
import { User } from "../../src/entities/User.js";
import { BecomeMentorRequest } from "../../src/entities/BecomeMentorRequest.js";
import { MentorProfile } from "../../src/entities/MentorProfile.js";
import {
  FormsOfEducation,
  MentorRequestStatus,
  UserRole,
} from "../../src/enums/UserEnums.js";
import { Collection } from "@mikro-orm/core";
import { UserChat } from "../../src/entities/chat/UserChat.js";
import { Event } from "../../src/entities/Event.js";

jest.mock("../../src/repositories/MentorRepository", () => {
  return {
    MentorRepository: jest.fn().mockImplementation(() => ({
      findBecomeMentorRequestByUser: jest.fn(),
      saveBecomeMentorRequest: jest.fn(),
      findBecomeMentorRequestById: jest.fn(),
      findAllBecomeMentorRequests: jest.fn(),
      findMentorProfileById: jest.fn(),
      findAllMentorProfiles: jest.fn(),
      saveMentorProfile: jest.fn(),
    })),
  };
});

describe("MentorService", () => {
  let service: MentorService;
  let mockRepo: jest.Mocked<MentorRepository>;

  beforeEach(() => {
    service = new MentorService();
    mockRepo = (service as any).repo;
    jest.clearAllMocks();
  });

  it("should create a new become mentor request", async () => {
    const user = new User();
    user.uuid = "user-uuid";
    user.email = "gmail";
    const requestDto = { motivation: "I want to help" };

    mockRepo.findBecomeMentorRequestByUser.mockResolvedValue(null);

    const result = await service.createBecomeMentorRequest(user, requestDto);

    expect(mockRepo.findBecomeMentorRequestByUser).toHaveBeenCalledWith(
      user.uuid,
    );
    expect(mockRepo.saveBecomeMentorRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        motivation: "I want to help",
        status: MentorRequestStatus.PENDING,
      }),
    );
    expect(result).toMatchObject({
      id: expect.any(String),
      motivation: "I want to help",
      status: MentorRequestStatus.PENDING,
      createdAt: expect.any(Date),
      user: {
        uuid: user.uuid,
        name: expect.any(String),
        email: user.email,
      },
    });
  });

  it("should not allow creating duplicate mentor requests", async () => {
    const user = new User();
    user.uuid = "user-uuid";
    const existingRequest = new BecomeMentorRequest();
    existingRequest.uuid = "existing-request";

    mockRepo.findBecomeMentorRequestByUser.mockResolvedValue(existingRequest);

    await expect(
      service.createBecomeMentorRequest(user, { motivation: "Again" }),
    ).rejects.toThrow("You already have a pending request.");
  });

  it("should update a mentor request and create a mentor profile when approved", async () => {
    const request = new BecomeMentorRequest();
    const user = new User();
    user.uuid = "user-uuid";
    request.user = user;
    request.status = MentorRequestStatus.PENDING;
    request.uuid = "request-id";

    mockRepo.findBecomeMentorRequestById.mockResolvedValue(request);

    const result = await service.updateRequest("request-id", {
      status: MentorRequestStatus.APPROVED,
      motivation: "Updated",
    });

    expect(mockRepo.saveMentorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        mentor: user,
        rating: -1,
        totalReviews: 0,
      }),
    );

    expect(mockRepo.saveBecomeMentorRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MentorRequestStatus.APPROVED,
        motivation: "Updated",
      }),
    );

    expect(result.status).toBe(MentorRequestStatus.APPROVED);
    expect(result.motivation).toBe("Updated");
  });

  it("should throw if mentor request to update is not found", async () => {
    mockRepo.findBecomeMentorRequestById.mockResolvedValue(null);
    await expect(
      service.updateRequest("bad-id", {
        status: MentorRequestStatus.APPROVED,
        motivation: "Updated",
      }),
    ).rejects.toThrow("Mentor request not found.");
  });

  it("should return all become mentor requests", async () => {
    const user = new User();
    user.uuid = "user-uuid";
    user.firstName = "Jane";
    user.avatar = "";
    user.email = "jane@example.com";

    const request1 = new BecomeMentorRequest();
    request1.uuid = "request-1";
    request1.user = user;

    const request2 = new BecomeMentorRequest();
    request2.uuid = "request-2";
    request2.user = user;

    mockRepo.findAllBecomeMentorRequests.mockResolvedValue([
      request1,
      request2,
    ]);

    const result = await service.getAllRequests();
    expect(result.length).toBe(2);
  });

  it("should return one request by ID for admin", async () => {
    const user = new User();
    user.uuid = "admin-uuid";
    user.role = UserRole.ADMIN;

    const request = new BecomeMentorRequest();
    request.uuid = "request-id";
    request.user = new User();
    request.user.uuid = "other-user";

    mockRepo.findBecomeMentorRequestById.mockResolvedValue(request);

    const result = await service.getOneRequestById(user, "request-id");
    expect(result.id).toBe("request-id");
  });

  it("should forbid access to request by ID for non-admin if not owner", async () => {
    const user = new User();
    user.uuid = "user-a";
    user.role = UserRole.MENTOR;

    const request = new BecomeMentorRequest();
    request.uuid = "request-id";
    request.user = new User();
    request.user.uuid = "user-b";

    mockRepo.findBecomeMentorRequestById.mockResolvedValue(request);

    await expect(service.getOneRequestById(user, "request-id")).rejects.toThrow(
      "Forbidden",
    );
  });

  it("should get all mentors with sorting and filtering", async () => {
    const profile1 = new MentorProfile();
    profile1.mentor = {
      async hashPassword(): Promise<void> {},
      avatar: "",
      bio: "",
      course: 0,
      createdAt: new Date(),
      department: "",
      email: "",
      events: new Collection<Event>(profile1),
      formOfEducation: FormsOfEducation.FULL_TIME,
      groupCode: "",
      interests: [],
      password: "",
      role: UserRole.STUDENT,
      specializationCode: 0,
      specializationTitle: "",
      updatedAt: new Date(),
      userChats: new Collection<UserChat>(profile1),
      firstName: "Alice",
      lastName: "A",
      uuid: "1",
    };
    profile1.rating = 4.5;
    profile1.totalReviews = 10;

    const profile2 = new MentorProfile();
    profile2.mentor = {
      async hashPassword(): Promise<void> {},
      avatar: "",
      bio: "",
      course: 0,
      createdAt: new Date(),
      department: "",
      email: "",
      events: new Collection<Event>(profile2),
      formOfEducation: FormsOfEducation.FULL_TIME,
      groupCode: "",
      interests: [],
      password: "",
      role: UserRole.STUDENT,
      specializationCode: 0,
      specializationTitle: "",
      updatedAt: new Date(),
      userChats: new Collection<UserChat>(profile2),
      firstName: "Alice",
      lastName: "A",
      uuid: "2",
    };
    profile2.rating = 3.0;
    profile2.totalReviews = 5;

    mockRepo.findAllMentorProfiles.mockResolvedValue([profile1, profile2]);

    const result = await service.getAllMentors(
      { minRating: 3 },
      { sortBy: "rating", sortOrder: "desc" },
    );

    expect(result.length).toBe(2);
    expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
  });
});
