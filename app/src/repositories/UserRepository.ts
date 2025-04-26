import { User } from "../entities/User.js";
import { em } from "../db/config.js";

/**
 * The UserRepository class provides methods for managing User entities
 * including persisting, retrieving, and updating the user data in the database.
 */
export class UserRepository {
  async save(user: User) {
    await em.persistAndFlush(user);
  }

  async getUserById(userId: string) {
    return await em.findOneOrFail(User, { uuid: userId });
  }

  async getAllUsersByIds(userIds: string[]) {
    return await em.find(User, { uuid: { $in: userIds } });
  }
}
