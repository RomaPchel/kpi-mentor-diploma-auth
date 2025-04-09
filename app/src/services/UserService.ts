import { User } from "../entities/User.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { em } from "../db/config.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import type {
  BecomeMentorRequestResponse,
  CreateMentorRequest,
  MentorProfileResponse,
  UpdateMentorRequest,
  UserProfileResponse,
  UserProfileUpdateRequest,
} from "../interfaces/UserInterface.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { findOrCreateChatBetween } from "../controllers/ChatController.js";

export class UserService {
  async updateUserProfile(user: User, data: UserProfileUpdateRequest) {
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

    await em.persistAndFlush(user);

    return this.toUserProfileResponse(user);
  }

  async createBecomeMentorRequest(user: User, req: CreateMentorRequest) {
    const existingRequest = await em.findOne(BecomeMentorRequest, {
      user: user.uuid,
    });
    if (existingRequest) {
      throw new Error("You already have a pending request.");
    }

    const request = new BecomeMentorRequest();
    request.user = user;
    request.motivation = req.motivation ?? null;
    request.status = MentorRequestStatus.PENDING;

    await em.persistAndFlush(request);

    return this.toMentorRequestResponse(request);
  }

  async getOwnBecomeMentorRequest(user: User) {
    const request = await em.findOne(
      BecomeMentorRequest,
      { user: user.uuid },
      { populate: ["user"] },
    );
    return request ? this.toMentorRequestResponse(request) : null;
  }

  async getAllBecomeMentorRequests() {
    const requests = await em.find(
      BecomeMentorRequest,
      {},
      { populate: ["user"] },
    );
    return requests.map(this.toMentorRequestResponse);
  }

  async getBecomeMentorRequestById(user: User, id: string) {
    const request = await em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
    if (!request) throw new Error("Mentor request not found.");
    if (user.role !== UserRole.ADMIN && request.user.uuid !== user.uuid) {
      throw new Error("Forbidden");
    }
    return this.toMentorRequestResponse(request);
  }

  async updateBecomeMentorRequest(id: string, data: UpdateMentorRequest) {
    const request = await em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
    if (!request) throw new Error("Mentor request not found.");

    if (data.status === MentorRequestStatus.APPROVED) {
      const mentorProfile = new MentorProfile();
      mentorProfile.mentor = request.user;
      mentorProfile.rating = -1;
      mentorProfile.totalReviews = 0;
      await em.persistAndFlush(mentorProfile);
    }

    if (data.status) request.status = data.status;
    if (data.motivation) request.motivation = data.motivation;

    await em.persistAndFlush(request);

    return this.toMentorRequestResponse(request);
  }

  async getAllMentors() {
    const mentors = await em.find(MentorProfile, {}, { populate: ["mentor"] });

    return mentors.map((mentorProfile) =>
      this.toMentorProfileResponse(mentorProfile),
    );
  }

  async getYourMenteeRequest(mentorUuid: string, userUuid: string) {
    return await em.findOne(BecomeMenteeRequest, {
      mentor: mentorUuid,
      user: userUuid,
    });
  }

  async approveMenteeRequest(uuid: string, mentor: User) {
    const req = await em.findOneOrFail(BecomeMenteeRequest, {
      uuid,
      mentor,
    });

    req.status = MentorRequestStatus.APPROVED;
    req.processedAt = new Date();
    await em.persistAndFlush(req);

    const user = await em.findOne(User, { uuid: req.user.uuid });
    await findOrCreateChatBetween(user as User, mentor);
  }

  async rejectMenteeRequest(uuid: string, mentor: string) {
    const req = await em.findOneOrFail(BecomeMenteeRequest, {
      uuid,
      mentor,
    });

    req.status = MentorRequestStatus.REJECTED;
    req.processedAt = new Date();
    await em.persistAndFlush(req);
  }

  async getMentorMenteeRequests(mentorUuid: string) {
    const requests = await em.find(
      BecomeMenteeRequest,
      { mentor: mentorUuid, status: MentorRequestStatus.PENDING },
      {
        populate: ["user"],
        orderBy: { createdAt: "DESC" },
      },
    );

    return {
      requests: requests.map((req) => ({
        uuid: req.uuid,
        motivation: req.motivation,
        status: req.status,
        createdAt: req.createdAt,
        mentee: {
          uuid: req.user.uuid,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          avatar: req.user.avatar || "",
        },
      })),
    };
  }

  async becomeMentee(
    requestingUser: User,
    mentorUuid: string,
    motivation: string,
  ) {
    const mentor = await em.findOneOrFail(User, { uuid: mentorUuid });

    const existing = await em.findOne(BecomeMenteeRequest, {
      user: requestingUser,
      mentor: mentor,
    });

    if (existing) {
      throw new Error(
        "You have already requested to become a mentee for this mentor.",
      );
    }

    const request = new BecomeMenteeRequest();
    request.user = requestingUser;
    request.mentor = mentor;
    request.motivation = motivation;
    request.status = MentorRequestStatus.PENDING;

    await em.persistAndFlush(request);

    return {
      success: true,
      message: "Mentee request submitted successfully.",
    };
  }

  async getOneMentor(uuid: string) {
    const mentor = await em.findOne(
      MentorProfile,
      { uuid: uuid },
      { populate: ["mentor"] },
    );

    return this.toMentorProfileResponse(mentor as MentorProfile);
  }

  async deleteById(id: string) {
    const request = await em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
    if (!request) {
      throw Error("Mentor request not found.");
    }
    await em.removeAndFlush(request);
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

  private toMentorRequestResponse(
    request: BecomeMentorRequest,
  ): BecomeMentorRequestResponse {
    return {
      id: request.uuid,
      motivation: request.motivation ?? "",
      status: request.status,
      createdAt: request.createdAt,
      user: {
        uuid: request.user.uuid,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
      },
    };
  }

  private toMentorProfileResponse(
    profile: MentorProfile,
  ): MentorProfileResponse {
    return {
      uuid: profile.uuid,
      mentorUuid: profile.mentor.uuid,
      avatar: profile.mentor.avatar,
      email: profile.mentor.email,
      interests: profile.mentor.interests,
      name: `${profile.mentor.firstName} ${profile.mentor.lastName}`,
      specialization: profile.mentor.specializationTitle,
      bio: profile.mentor.bio,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
    };
  }
}
