import { UserService } from "../../src/services/UserService";
import { UserRepository } from "../../src/repositories/UserRepository";
import { User } from "../../src/entities/User";
import type { UserProfileUpdateRequest } from "../../src/interfaces/UserInterface";
import { FormsOfEducation } from "../../src/enums/UserEnums";

jest.mock("../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      save: jest.fn(),
    })),
  };
});

describe("UserService", () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    service = new UserService();
    mockRepo = (service as any).userRepository;
    jest.clearAllMocks();
  });

  it("should update user and save it", async () => {
    const user = new User();
    user.firstName = "OldFirst";
    user.lastName = "OldLast";

    const updateData: UserProfileUpdateRequest = {
      firstName: "NewFirst",
      lastName: "NewLast",
      email: "new@example.com",
      avatar: "avatar-url",
      bio: "New bio",
      specializationCode: 121,
      specializationTitle: "Software Engineering",
      formOfEducation: FormsOfEducation.FULL_TIME,
      groupCode: "G1",
      department: "IT",
      interests: ["coding", "reading"],
    };

    const result = await service.updateUser(user, updateData);

    expect(mockRepo.save).toHaveBeenCalledWith(user);

    expect(result).toEqual({
      id: user.uuid,
      firstName: "NewFirst",
      lastName: "NewLast",
      email: "new@example.com",
      avatar: "avatar-url",
      bio: "New bio",
      specializationCode: 121,
      specializationTitle: "Software Engineering",
      formOfEducation: FormsOfEducation.FULL_TIME,
      groupCode: "G1",
      department: "IT",
      interests: ["coding", "reading"],
    });

    expect(user.firstName).toBe("NewFirst");
    expect(user.lastName).toBe("NewLast");
  });

  it("should keep old fields if update data is undefined", async () => {
    const user = new User();
    user.firstName = "OldFirst";
    user.lastName = "OldLast";

    const updateData: UserProfileUpdateRequest = {};

    const result = await service.updateUser(user, updateData);

    expect(mockRepo.save).toHaveBeenCalledWith(user);
    expect(result.firstName).toBe("OldFirst");
    expect(result.lastName).toBe("OldLast");
  });
});
