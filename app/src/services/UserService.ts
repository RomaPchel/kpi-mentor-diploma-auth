import { User } from "../entities/User.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type {
  UserProfileResponse,
  UserProfileUpdateRequest,
} from "../interfaces/UserInterface.js";

export class UserService {
  private readonly userRepository = new UserRepository();

  async updateUser(user: User, data: UserProfileUpdateRequest) {
    user.firstName = data.firstName ?? user.firstName;
    user.lastName = data.lastName ?? user.lastName;
    user.email = data.email ?? user.email;
    user.avatar = data.avatar ?? user.avatar;
    user.bio = data.bio ?? user.bio;
    user.specializationCode =
      data.specializationCode ?? user.specializationCode;
    user.specializationTitle =
      data.specializationTitle ?? user.specializationTitle;
    user.formOfEducation = data.formOfEducation ?? user.formOfEducation;
    user.groupCode = data.groupCode ?? user.groupCode;
    user.department = data.department ?? user.department;
    user.interests = data.interests ?? user.interests;

    await this.userRepository.save(user);

    return this.toUserProfileResponse(user);
  }

  private toUserProfileResponse(user: User): UserProfileResponse {
    return {
      id: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      specializationCode: user.specializationCode,
      specializationTitle: user.specializationTitle,
      formOfEducation: user.formOfEducation,
      groupCode: user.groupCode,
      department: user.department,
      interests: user.interests ?? [],
    };
  }
}
