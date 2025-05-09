import { em } from "../db/config.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { User } from "../entities/User.js";
import { Review } from "../entities/MentorReview.js";

/**
 * ReviewRepository is responsible for handling database operations
 * related to reviews. It provides methods to query reviews based
 * on mentors and users.
 */
export class ReviewRepository {
  async findReviewByMentorAndUser(mentor: MentorProfile, user: User) {
    return em.findOne(Review, {
      mentor,
      reviewer: user,
    });
  }

  async findAllReviewsByMentor(mentor: MentorProfile) {
    return em.find(Review, {
      mentor,
    });
  }

  async saveReview(review: Review) {
    await em.persistAndFlush(review);
  }
}
