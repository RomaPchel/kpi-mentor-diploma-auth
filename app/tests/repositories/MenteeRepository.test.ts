import { MenteeRepository } from "../../src/repositories/MenteeRepository";
import { BecomeMenteeRequest } from "../../src/entities/BecomeManteeRequest";
import { MentorStudent } from "../../src/entities/StudentMentor";
import { em } from "../../src/db/config";
import { MentorRequestStatus } from "../../src/enums/UserEnums";

jest.mock("../../src/db/config", () => ({
  em: {
    find: jest.fn(),
    findOneOrFail: jest.fn(),
    persistAndFlush: jest.fn(),
  },
}));

describe("MenteeRepository", () => {
  let repo: MenteeRepository;

  beforeEach(() => {
    repo = new MenteeRepository();
    jest.clearAllMocks();
  });

  it("should find one mentee request by mentor and user", async () => {
    const mockRequest = new BecomeMenteeRequest();
    (em.findOneOrFail as jest.Mock).mockResolvedValue(mockRequest);

    const result = await repo.getOneRequestByMentorAndUser("mentor-uuid", "user-uuid");

    expect(em.findOneOrFail).toHaveBeenCalledWith(BecomeMenteeRequest, {
      mentor: "mentor-uuid",
      user: "user-uuid",
    });
    expect(result).toEqual(mockRequest);
  });

  it("should find all mentee requests by user and status", async () => {
    const mockRequests = [new BecomeMenteeRequest(), new BecomeMenteeRequest()];
    (em.find as jest.Mock).mockResolvedValue(mockRequests);

    const result = await repo.getAllRequestsByUserAndStatus("user-uuid", MentorRequestStatus.PENDING, "createdAt", "DESC");

    expect(em.find).toHaveBeenCalledWith(
      BecomeMenteeRequest,
      { mentor: "user-uuid", status: MentorRequestStatus.PENDING },
      {
        populate: ["user"],
        orderBy: { createdAt: "DESC" },
      }
    );
    expect(result).toEqual(mockRequests);
  });

  it("should save a mentee request", async () => {
    const mockRequest = new BecomeMenteeRequest();

    await repo.save(mockRequest);

    expect(em.persistAndFlush).toHaveBeenCalledWith(mockRequest);
  });

  it("should find all mentees for a user", async () => {
    const mockMentees = [new MentorStudent(), new MentorStudent()];
    (em.find as jest.Mock).mockResolvedValue(mockMentees);

    const result = await repo.getAllMenteesByUser("mentor-uuid");

    expect(em.find).toHaveBeenCalledWith(MentorStudent, { mentor: "mentor-uuid" });
    expect(result).toEqual(mockMentees);
  });
});
