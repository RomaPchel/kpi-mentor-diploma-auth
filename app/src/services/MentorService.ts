import { User } from "../entities/User.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { em } from "../db/config.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import type {
  BecomeMentorRequestResponse,
  CreateMentorRequest,
  MentorProfileResponse,
  RateMentorRequest,
  UpdateMentorRequest,
} from "../interfaces/UserInterface.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";

/**
 * A service class that manages mentor-related operations, including creating,
 * updating, and retrieving mentor requests and profiles, as well as rating mentors.
 */
export class MentorService {
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

  async getAllMentors(
    filters: {
      name?: string;
      minRating?: number;
      maxRating?: number;
      minReviews?: number;
      maxReviews?: number;
    },
    sorting: {
      sortBy?: "name" | "rating" | "totalReviews";
      sortOrder?: "asc" | "desc";
    },
  ) {
    const where: any = {};

    if (filters?.name) {
      where.mentor = {
        ...(where.mentor || {}),
        $or: [
          { firstName: { $ilike: `%${filters.name}%` } },
          { lastName: { $ilike: `%${filters.name}%` } },
        ],
      };
    }

    if (filters?.minRating !== undefined) {
      where.rating = { ...(where.rating || {}), $gte: filters.minRating };
    }
    if (filters?.maxRating !== undefined) {
      where.rating = { ...(where.rating || {}), $lte: filters.maxRating };
    }
    if (filters?.minReviews !== undefined) {
      where.totalReviews = {
        ...(where.totalReviews || {}),
        $gte: filters.minReviews,
      };
    }
    if (filters?.maxReviews !== undefined) {
      where.totalReviews = {
        ...(where.totalReviews || {}),
        $lte: filters.maxReviews,
      };
    }

    const mentors = await em.find(MentorProfile, where, {
      populate: ["mentor"],
    });

    let result = mentors.map((mentorProfile) =>
      this.toMentorProfileResponse(mentorProfile),
    );

    const sortBy = sorting.sortBy ?? "name";
    const sortOrder = sorting.sortOrder === "desc" ? -1 : 1;

    result = result.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "name") {
        aValue = a.name.toLowerCase() ?? "";
        bValue = b.name.toLowerCase() ?? "";
      } else if (sortBy === "rating") {
        aValue = a.rating ?? 0;
        bValue = b.rating ?? 0;
      } else if (sortBy === "totalReviews") {
        aValue = a.totalReviews ?? 0;
        bValue = b.totalReviews ?? 0;
      } else {
        aValue = a.specialization ?? "";
        bValue = b.specialization ?? "";
      }

      if (aValue! < bValue!) return -1 * sortOrder;
      if (aValue! > bValue!) return 1 * sortOrder;
      return 0;
    });

    return result;
  }

  async getOneMentor(uuid: string) {
    const mentor = await em.findOne(
      MentorProfile,
      { uuid: uuid },
      { populate: ["mentor"] },
    );

    console.log(mentor);
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

  async rateMentor(uuid: string, rateRequest: RateMentorRequest) {
    const mentor = await em.findOne(
      MentorProfile,
      { uuid: uuid },
      { populate: ["mentor"] },
    );
    if (mentor === null) {
      throw new Error("Mentor not found");
    }
    if (mentor.rating < 0) {
      mentor.rating = rateRequest.rating;
      mentor.totalReviews++;
      await em.persistAndFlush(mentor);
    } else {
      const sum = mentor.rating * mentor.totalReviews + rateRequest.rating;
      mentor.rating = sum / (mentor.totalReviews + 1);
      mentor.totalReviews++;
      await em.persistAndFlush(mentor);
    }
  }
}
