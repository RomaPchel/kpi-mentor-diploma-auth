import { UserRepository } from "../../src/repositories/UserRepository.js";
import { User } from "../../src/entities/User.js";

jest.mock("../../src/db/config.js", () => {
  return {
    em: {
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
  };
});

import { em } from "../../src/db/config.js";

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
});
