import { User } from "../entities/User.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type {
  UserResponse,
  UserUpdateRequest,
} from "../interfaces/UserInterface.js";

export class UserService {
  private readonly userRepository = new UserRepository();

  async updateUser(user: User, data: UserUpdateRequest) {
    user.firstName = data.firstName ?? user.firstName;
    user.lastName = data.lastName ?? user.lastName;
    user.email = data.email ?? user.email;
    user.avatar = data.avatar ?? user.avatar;
    user.bio = data.bio ?? user.bio;
    user.specialization = data.specialization ?? user.specialization;
    user.formOfEducation = data.formOfEducation ?? user.formOfEducation;
    user.groupCode = data.groupCode ?? user.groupCode;
    user.department = data.department ?? user.department;
    user.interests = data.interests ?? user.interests;

    await this.userRepository.save(user);

    return this.toUserProfileResponse(user);
  }

  private toUserProfileResponse(user: User): UserResponse {
    return {
      id: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      specialization: user.specialization,
      formOfEducation: user.formOfEducation ?? null,
      groupCode: user.groupCode,
      department: user.department,
      interests: user.interests ?? [],
    };
  }
}
