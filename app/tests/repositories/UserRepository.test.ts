import { UserRepository } from "../../src/repositories/UserRepository";
import { User } from "../../src/entities/User";
import { em } from "../../src/db/config";

jest.mock("../../src/db/config", () => {
  return {
    em: {
      persistAndFlush: jest.fn(),
      findOneOrFail: jest.fn(),
    },
  };
});

describe("UserRepository", () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
    jest.clearAllMocks();
  });

  it("should save a user", async () => {
    const user = new User();
    await repo.save(user);
    expect(em.persistAndFlush).toHaveBeenCalledWith(user);
  });

  it("should find user by id", async () => {
    const user = new User();
    (em.findOneOrFail as jest.Mock).mockResolvedValue(user);

    const result = await repo.getUserById("1234");
    expect(em.findOneOrFail).toHaveBeenCalledWith(User, { uuid: "1234" });
    expect(result).toBe(user);
  });
});
