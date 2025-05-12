import { User } from "../entities/User.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { em } from "../db/config.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorRepository } from "../repositories/MentorRepository.js";
import type {
  BecomeMentorRequestResponse,
  CreateMentorRequest,
  MentorProfileResponse,
  RateMentorRequest,
  UpdateMentorRequest,
} from "../interfaces/UserInterface.js";
import { Review } from "../entities/MentorReview.js";
import { MentorStudent } from "../entities/StudentMentor.js";
import { UserChat } from "../entities/chat/UserChat.js";
import { Report } from "../entities/Report.js";
import { Feedback } from "../entities/Feedback.js";

export class MentorService {
  private readonly repo = new MentorRepository();

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

  async getOneRequestByUser(user: User) {
    const request = await this.repo.findRequestByUser(user.uuid);
    return request ? this.toMentorRequestResponse(request) : null;
  }

  async getAllRequests() {
    const requests = await em.find(
      BecomeMentorRequest,
      { status: MentorRequestStatus.PENDING },
      { populate: ["user"] },
    );
    return requests.map(this.toMentorRequestResponse);
  }

  async getOneRequestById(user: User, id: string) {
    const request = await this.repo.findRequestById(id);
    if (!request) throw new Error("Mentor request not found.");
    if (user.role !== UserRole.ADMIN && request.user.uuid !== user.uuid) {
      throw new Error("Forbidden");
    }
    return this.toMentorRequestResponse(request);
  }

  async createFeedback(user: User, message: string) {
    const alreadyReported = await em.findOne(Feedback, {
      user,
    });

    if (alreadyReported) {
      console.log("You have already submitted a report for this mentor.");
      return alreadyReported;
    }

    const feedback = em.create(Feedback, {
      user,
      message,
      reviewedByAdmin: false,
    });

    await em.persistAndFlush(feedback);
    return feedback;
  }

  async createReport(
    user: User,
    mentorUuid: string,
    message: string,
    anonymous: boolean,
  ) {
    const mentor = await em.findOneOrFail(MentorProfile, {
      mentor: mentorUuid,
    });

    const alreadyReported = await em.findOne(Report, {
      mentor,
      author: user,
    });

    if (alreadyReported) {
      console.log("You have already submitted a report for this mentor.");
      return alreadyReported;
    }

    const feedback = em.create(Report, {
      author: user,
      mentor,
      message,
      anonymous,
      reviewedByAdmin: false,
    });

    await em.persistAndFlush(feedback);
    return feedback;
  }

  async updateRequest(id: string, data: UpdateMentorRequest) {
    const request = await em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
    if (!request) throw new Error("Mentor request not found.");

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

      request.user.role = UserRole.MENTOR;
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

    return await Promise.all(
      mentors.map((mentorProfile) =>
        this.toMentorProfileResponse(mentorProfile),
      ),
    );
  }

  async getOneMentor(uuid: string) {
    const mentor = await em.findOne(
      MentorProfile,
      { mentor: uuid },
      { populate: ["mentor", "reviews"] },
    );

    return await this.toMentorProfileResponse(mentor as MentorProfile);
  }

  async getAllReports() {
    return await em.find(
      Report,
      { reviewedByAdmin: false },
      { populate: ["mentor.mentor", "author"] },
    );
  }

  async getAllFeedbacks() {
    return await em.find(
      Feedback,
      { reviewedByAdmin: false },
      { populate: ["user"] },
    );
  }

  async deleteById(id: string) {
    const request = await this.repo.findRequestById(id);
    if (!request) throw new Error("Mentor request not found.");
    await this.repo.removeRequest(request);
  }

  private toMentorRequestResponse(
    request: BecomeMentorRequest,
  ): BecomeMentorRequestResponse {
    return {
      uuid: request.uuid,
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

  private async toMentorProfileResponse(
    profile: MentorProfile,
  ): Promise<MentorProfileResponse> {
    const reviews = profile.reviews.getItems();

    const reviewCount = reviews.length;

    const average = (key: "friendliness" | "knowledge" | "communication") =>
      reviewCount
        ? reviews.reduce((sum, r) => sum + r[key], 0) / reviewCount
        : 0;

    const mentorStudents = await em.find(MentorStudent, {
      mentor: profile.mentor,
    });

    const chats = await em.find(UserChat, {
      user: profile.mentor,
    });

    return {
      uuid: profile.uuid,
      mentorUuid: profile.mentor.uuid,
      avatar: profile.mentor.avatar,
      email: profile.mentor.email,
      interests: profile.mentor.interests,
      name: `${profile.mentor.firstName} ${profile.mentor.lastName}`,
      specialization: profile.mentor.specialization,
      bio: profile.mentor.bio,
      department: profile.mentor.department,
      rating: profile.rating,
      isHighlighted: profile.isHighlighted,
      totalReviews: profile.totalReviews,
      badges: profile.badges,
      avgFriendliness: average("friendliness"),
      avgKnowledge: average("knowledge"),
      avgCommunication: average("communication"),

      //@ts-ignore
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
      stats: {
        totalMentees: mentorStudents.length,
        totalSessions: chats.length,
        levelTitle: profile.getLevelTitle(),
        level: profile.level,
      },
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
        { populate: ["mentor", "reviews"] },
      );

      if (!mentor) {
        throw new Error("Mentor not found");
      }

      let review = await em.findOne(Review, {
        mentor,
        reviewer,
      });

      if (review) {
        review.friendliness = rateRequest.friendliness;
        review.knowledge = rateRequest.knowledge;
        review.communication = rateRequest.communication;
        // @ts-ignore
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

      await mentor.updateRating();

      await em.persistAndFlush(mentor);
    } catch (e) {
      console.error(e);
      throw new Error("Failed to rate mentor");
    }
  }
}
