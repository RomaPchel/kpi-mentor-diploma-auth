import { MentorRepository } from "../../src/repositories/MentorRepository";
import { MentorProfile } from "../../src/entities/MentorProfile";
import { BecomeMentorRequest } from "../../src/entities/BecomeMentorRequest";
import { em } from "../../src/db/config";
import { MentorRequestStatus, UserRole } from "../../src/enums/UserEnums";
import { User } from "../../src/entities/User";

jest.mock("../../src/db/config", () => {
  return {
    em: {
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      find: jest.fn(),
      removeAndFlush: jest.fn(),
    },
  };
});

describe("MentorRepository", () => {
  let repo: MentorRepository;
  let mockUser: User;
  let mockMentorProfile: MentorProfile;
  let mockRequest: BecomeMentorRequest;

  beforeEach(() => {
    repo = new MentorRepository();
    jest.clearAllMocks();

    mockUser = new User();
    mockUser.uuid = "user-uuid";
    mockUser.firstName = "John";
    mockUser.lastName = "Doe";
    mockUser.email = "john.doe@example.com";
    mockUser.role = UserRole.MENTOR;

    mockMentorProfile = new MentorProfile();
    mockMentorProfile.uuid = "mentor-profile-uuid";
    mockMentorProfile.mentor = mockUser;
    mockMentorProfile.rating = 4.5;
    mockMentorProfile.totalReviews = 10;

    mockRequest = new BecomeMentorRequest();
    mockRequest.uuid = "request-uuid";
    mockRequest.user = mockUser;
    mockRequest.motivation = "Motivated to help.";
    mockRequest.status = MentorRequestStatus.PENDING;
  });

  it("should create a become mentor request", async () => {
    await repo.saveRequest(mockRequest);
    expect(em.persistAndFlush).toHaveBeenCalledWith(mockRequest);
  });

  it("should fetch own mentor request by user", async () => {
    (em.findOne as jest.Mock).mockResolvedValue(mockRequest);

    const result = await repo.findRequestByUser(mockUser.uuid);

    expect(em.findOne).toHaveBeenCalledWith(BecomeMentorRequest, {
      user: mockUser.uuid,
    });

    expect(result).toBe(mockRequest);
  });

  it("should fetch a mentor request by ID", async () => {
    (em.findOne as jest.Mock).mockResolvedValue(mockRequest);

    const result = await repo.findRequestById(mockRequest.uuid);
    expect(em.findOne).toHaveBeenCalledWith(
      BecomeMentorRequest,
      { uuid: mockRequest.uuid },
      { populate: ["user"] },
    );
    expect(result).toBe(mockRequest);
  });

  it("should fetch all become mentor requests", async () => {
    const request1 = new BecomeMentorRequest();
    request1.user = mockUser;
    request1.motivation = "Learning JavaScript.";
    request1.status = MentorRequestStatus.PENDING;

    const request2 = new BecomeMentorRequest();
    request2.user = mockUser;
    request2.motivation = "Learning Python.";
    request2.status = MentorRequestStatus.PENDING;

    (em.find as jest.Mock).mockResolvedValue([request1, request2]);

    const result = await repo.findAllRequests();

    expect(em.find).toHaveBeenCalledWith(BecomeMentorRequest, {}, { populate: ["user"] });

    expect(result).toEqual([request1, request2]);
  });

  it("should delete a mentor request by ID", async () => {
    (em.findOne as jest.Mock).mockResolvedValue(mockRequest);

    await repo.removeRequest(mockRequest);

    expect(em.removeAndFlush).toHaveBeenCalledWith(mockRequest);
  });

  it("should create a become mentor profile", async () => {
    await repo.saveMentorProfile(mockMentorProfile);
    expect(em.persistAndFlush).toHaveBeenCalledWith(mockMentorProfile);
  });

  it("should return all mentor profiles based on the provided filter", async () => {
    const mockMentorProfile1 = new MentorProfile();
    mockMentorProfile1.uuid = "mentor-profile-uuid-1";
    mockMentorProfile1.mentor = mockUser;
    mockMentorProfile1.rating = 4.5;
    mockMentorProfile1.totalReviews = 10;

    const mockMentorProfile2 = new MentorProfile();
    mockMentorProfile2.uuid = "mentor-profile-uuid-2";
    mockMentorProfile2.mentor = mockUser;
    mockMentorProfile2.rating = 4.0;
    mockMentorProfile2.totalReviews = 5;

    (em.find as jest.Mock).mockResolvedValue([mockMentorProfile1, mockMentorProfile2]);

    const whereCondition = { rating: { $gte: 4.0 } }; // Example filter

    const result = await repo.findAllMentorProfiles(whereCondition);

    expect(em.find).toHaveBeenCalledWith(MentorProfile, whereCondition, { populate: ["mentor"] });

    expect(result).toEqual([mockMentorProfile1, mockMentorProfile2]);
  });


  it("should return mentor profile response", async () => {
    (em.findOne as jest.Mock).mockResolvedValue(mockMentorProfile);

    const result = await repo.findMentorProfileById(mockMentorProfile.uuid);

    expect(em.findOne).toHaveBeenCalledWith(
      MentorProfile,
      { uuid: mockMentorProfile.uuid },
      { populate: ["mentor"] }
    );

    expect(result).toEqual(mockMentorProfile);
  });
});
