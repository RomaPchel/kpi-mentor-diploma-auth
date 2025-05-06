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
import { Review } from "../entities/MentorReview.js";

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

  async getAllMentors() {
    const mentors = await em.findAll(MentorProfile, {
      populate: ["mentor", "reviews.reviewer"],
    });

    return mentors.map((mentorProfile) =>
      this.toMentorProfileResponse(mentorProfile),
    );
  }

  async getOneMentor(uuid: string) {
    const mentor = await em.findOne(
      MentorProfile,
      { mentor: uuid },
      { populate: ["mentor", "reviews"] },
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
