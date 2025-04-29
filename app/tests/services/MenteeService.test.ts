import { MenteeService } from "../../src/services/MenteeService.js";
import { MenteeRepository } from "../../src/repositories/MenteeRepository.js";
import { UserRepository } from "../../src/repositories/UserRepository.js";
import { User } from "../../src/entities/User.js";
import { MentorRequestStatus } from "../../src/enums/UserEnums.js";
import { BecomeMenteeRequest } from "../../src/entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../../src/controllers/ChatController.js";

jest.mock("../../src/repositories/MenteeRepository", () => {
  return {
    MenteeRepository: jest.fn().mockImplementation(() => ({
      getAllMenteesByUser: jest.fn(),
      getOneRequestByMentorAndUser: jest.fn(),
      getAllRequestsByUserAndStatus: jest.fn(),
      save: jest.fn(),
    })),
  };
});

jest.mock("../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      getUserById: jest.fn(),
    })),
  };
});

jest.mock("../../src/controllers/ChatController", () => ({
  findOrCreateChatBetween: jest.fn(),
}));

describe("MenteeService", () => {
  let service: MenteeService;
  let mockMenteeRepo: jest.Mocked<MenteeRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    service = new MenteeService();
    mockMenteeRepo = (service as any).repo;
    mockUserRepo = (service as any).userRepo;
    jest.clearAllMocks();
  });

  it("should return all mentees for a given user", async () => {
    const userUuid = "user-uuid";
    const mentees = [{ uuid: "mentee-1" }, { uuid: "mentee-2" }];
    (mockMenteeRepo.getAllMenteesByUser as jest.Mock).mockResolvedValue(
      mentees,
    );

    const result = await service.getAllMenteesByUser(userUuid);

    expect(mockMenteeRepo.getAllMenteesByUser).toHaveBeenCalledWith(userUuid);
    expect(result).toEqual(mentees);
  });

  it("should approve a mentee request and create a chat", async () => {
    const uuid = "request-uuid";
    const user = new User();
    user.uuid = "mentor-uuid";

    const request = new BecomeMenteeRequest();
    request.uuid = uuid;
    request.status = MentorRequestStatus.PENDING;
    mockMenteeRepo.getOneRequestByMentorAndUser.mockResolvedValue(request);
    mockUserRepo.getUserById.mockResolvedValue(user);
    mockMenteeRepo.save.mockResolvedValue(undefined);

    await service.approveRequest(uuid, user);

    expect(mockMenteeRepo.getOneRequestByMentorAndUser).toHaveBeenCalledWith(
      uuid,
      user.uuid,
    );
    expect(mockMenteeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MentorRequestStatus.APPROVED,
        processedAt: expect.any(Date),
      }),
    );
    expect(findOrCreateChatBetween).toHaveBeenCalledWith(user, user); // Check chat creation
  });

  it("should create a new mentee request", async () => {
    const requestingUser = new User();
    requestingUser.uuid = "requesting-user-id";
    requestingUser.firstName = "John";
    requestingUser.lastName = "Doe";

    const mentorUser = new User();
    mentorUser.uuid = "mentor-user-id";
    mentorUser.firstName = "Jane";
    mentorUser.lastName = "Smith";

    mockUserRepo.getUserById.mockResolvedValue(mentorUser);
    // @ts-ignore
    (mockMenteeRepo.getOneRequestByMentorAndUser as jest.Mock).mockResolvedValue<null | BecomeMenteeRequest>(null);

    const result = await service.becomeMentee(
      requestingUser,
      mentorUser.uuid,
      "Motivation message",
    );

    expect(mockUserRepo.getUserById).toHaveBeenCalledWith(mentorUser.uuid);
    expect(result).toEqual({
      id: expect.any(String),
      motivation: "Motivation message",
      status: MentorRequestStatus.PENDING,
      createdAt: expect.any(Date),
      user: {
        uuid: "requesting-user-id",
        name: "John Doe",
        email: undefined,
        avatar: "",
      },
    });
  });

  it("should throw an error if the user has already requested to become a mentee", async () => {
    const requestingUser = new User();
    requestingUser.uuid = "requesting-user-id";
    requestingUser.firstName = "John";
    requestingUser.lastName = "Doe";

    const mentorUser = new User();
    mentorUser.uuid = "mentor-user-id";
    mentorUser.firstName = "Jane";
    mentorUser.lastName = "Smith";

    const existingRequest = new BecomeMenteeRequest();
    existingRequest.uuid = "existing-request-id";
    existingRequest.status = MentorRequestStatus.PENDING;

    mockUserRepo.getUserById.mockResolvedValue(mentorUser);
    mockMenteeRepo.getOneRequestByMentorAndUser.mockResolvedValue(
      existingRequest,
    );

    await expect(
      service.becomeMentee(
        requestingUser,
        mentorUser.uuid,
        "Motivation message",
      ),
    ).rejects.toThrow(
      "You have already requested to become a mentee for this mentor.",
    );
  });
});
