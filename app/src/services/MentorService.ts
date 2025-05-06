import { User } from "../entities/User.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorRepository } from "../repositories/MentorRepository.js";
import type {
  MentorProfileResponse,
  MentorRequest,
  MentorRequestResponse,
  RateMentorRequest,
  UpdateMentorRequest,
} from "../interfaces/UserInterface.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { Review } from "../entities/MentorReview.js";

/**
 * A service class that manages mentor-related operations, including creating,
 * updating, and retrieving mentor requests and profiles, as well as rating mentors.
 */
export class MentorService {
  private readonly repo = new MentorRepository();

  async createRequest(user: User, req: MentorRequest) {
    const existingRequest = await this.repo.findBecomeMentorRequestByUser(
      user.uuid,
    );
    if (existingRequest) {
      throw new Error("You already have a pending request.");
    }

    const request = new BecomeMentorRequest();
    request.user = user;
    request.motivation = req.motivation ?? null;
    request.status = MentorRequestStatus.PENDING;

    await this.repo.saveBecomeMentorRequest(request);

    return this.toMentorRequestResponse(request);
  }

  async getOneRequestByUser(user: User) {
    const request = await this.repo.findBecomeMentorRequestByUser(user.uuid);
    return request ? this.toMentorRequestResponse(request) : null;
  }

  async getAllRequests() {
    const requests = await this.repo.findAllBecomeMentorRequests();
    return requests.map(this.toMentorRequestResponse);
  }

  async getOneRequestById(user: User, id: string) {
    const request = await this.repo.findBecomeMentorRequestById(id);
    if (!request) throw new Error("Mentor request not found.");
    if (user.role !== UserRole.ADMIN && request.user.uuid !== user.uuid) {
      throw new Error("Forbidden");
    }
    return this.toMentorRequestResponse(request);
  }

  async updateRequest(id: string, data: UpdateMentorRequest) {
    const request = await this.repo.findBecomeMentorRequestById(id);
    if (!request) throw new Error("Mentor request not found.");

    if (data.status === MentorRequestStatus.APPROVED) {
      const mentorProfile = new MentorProfile();
      mentorProfile.mentor = request.user;
      mentorProfile.rating = -1;
      mentorProfile.totalReviews = 0;
      await this.repo.saveMentorProfile(mentorProfile);
    }

    if (data.status) request.status = data.status;
    if (data.motivation) request.motivation = data.motivation;

    await this.repo.saveBecomeMentorRequest(request);

    return this.toMentorRequestResponse(request);

    if (data.status === MentorRequestStatus.APPROVED) {
      // Check if mentor profile already exists
      const existingProfile = await em.findOne(MentorProfile, {
        mentor: request.user,
      });

      // Create new profile only if one doesn't already exist
      if (!existingProfile) {
        const mentorProfile = new MentorProfile();
        mentorProfile.mentor = request.user;
        mentorProfile.rating = 0;
        mentorProfile.totalReviews = 0;
        await em.persist(mentorProfile);
      }

      // Set user role to MENTOR
      request.user.role = UserRole.MENTOR;
    }
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

    const mentors = await this.repo.findAllMentorProfiles(where);

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
    const mentor = await this.repo.findMentorProfileById(uuid);
    if (!mentor) throw new Error("Mentor not found");
    return this.toMentorProfileResponse(mentor);
  }

  async deleteById(id: string) {
    const request = await this.repo.findBecomeMentorRequestById(id);
    if (!request) throw new Error("Mentor request not found.");
    await this.repo.removeBecomeMentorRequest(request);
  }

  private toMentorRequestResponse(
    request: BecomeMentorRequest,
  ): MentorRequestResponse {
    return {
      id: request.uuid,
      motivation: request.motivation ?? "",
      status: request.status,
      createdAt: request.createdAt,
      user: {
        avatar: request.user.avatar,
        uuid: request.user.uuid,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
      },
    };
  }

  private toMentorProfileResponse(
    profile: MentorProfile,
  ): MentorProfileResponse {
    const reviews = profile.reviews.getItems();

    const reviewCount = reviews.length;

    const average = (key: "friendliness" | "knowledge" | "communication") =>
      reviewCount
        ? reviews.reduce((sum, r) => sum + r[key], 0) / reviewCount
        : 0;

    return {
      uuid: profile.uuid,
      mentorUuid: profile.mentor.uuid,
      avatar: profile.mentor.avatar,
      email: profile.mentor.email,
      interests: profile.mentor.interests,
      name: `${profile.mentor.firstName} ${profile.mentor.lastName}`,
      specialization: profile.mentor.specializationTitle,
      bio: profile.mentor.bio,
      department: profile.mentor.department,
      rating: profile.rating,
      totalReviews: profile.totalReviews,

      // New aggregate fields
      avgFriendliness: average("friendliness"),
      avgKnowledge: average("knowledge"),
      avgCommunication: average("communication"),

      reviews: reviews.map((review) => ({
        friendliness: review.friendliness,
        knowledge: review.knowledge,
        communication: review.communication,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          firstName: review.reviewer.firstName,
          lastName: review.reviewer.lastName,
          uuid: review.reviewer.uuid,
        },
      })),
    };
  }

  async rateMentor(
    uuid: string,
    reviewer: User,
    rateRequest: RateMentorRequest,
  ) {
    try {
      const mentor = await em.findOne(
        MentorProfile,
        { mentor: uuid },
        { populate: ["mentor"] },
      );

      if (!mentor) {
        throw new Error("Mentor not found");
      }

      // Check for existing review
      let review = await em.findOne(Review, {
        mentor,
        reviewer,
      });

      if (review) {
        review.friendliness = rateRequest.friendliness;
        review.knowledge = rateRequest.knowledge;
        review.communication = rateRequest.communication;
        review.comment = rateRequest.comment ?? null;
      } else {
        review = em.create(Review, {
          mentor,
          reviewer,
          friendliness: rateRequest.friendliness,
          knowledge: rateRequest.knowledge,
          communication: rateRequest.communication,
          comment: rateRequest.comment ?? null,
        });
      }

      await em.persistAndFlush(review);

      // Recalculate rating
      const reviews = await em.find(Review, { mentor });
      const total = reviews.length;

      const avg = (key: keyof Review) =>
        reviews.reduce((sum, r) => sum + (r[key] as number), 0) / total;

      mentor.rating =
        Math.round(
          ((avg("friendliness") + avg("knowledge") + avg("communication")) /
            3) *
            10,
        ) / 10;
      mentor.totalReviews = total;

      await em.persistAndFlush(mentor);
    } catch (e) {
      console.error(e);
      throw new Error("Failed to rate mentor");
    }
  }
}
