import { Entity, Property, OneToOne, OneToMany } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { Collection } from "@mikro-orm/core";
import { Review } from "./MentorReview.js";
import { em } from "../db/config.js";
import { UserChat } from "./chat/UserChat.js";
import { ChatMessage } from "./chat/ChatMessage.js";

@Entity()
export class MentorProfile extends BaseEntity {
  @OneToOne(() => User, { owner: true })
  mentor!: User;

  @Property({ type: "decimal", precision: 3, scale: 2, default: 0.0 })
  rating: number = 0.0;

  @Property({ default: 0 })
  totalReviews: number = 0;

  @OneToMany(() => Review, (review) => review.mentor)
  reviews = new Collection<Review>(this);

  @Property({ default: 1 })
  level: number = 1;

  async updateRating(): Promise<void> {
    const reviews = this.reviews.getItems();

    if (reviews.length === 0) {
      this.rating = 0;
      this.totalReviews = 0;
      this.level = 1;
      return;
    }

    const now = new Date();
    const decayMonths = 6;

    // --- Time-decayed review weighting ---
    const reviewWeights = reviews.map((review) => {
      const ageInMonths =
        (now.getTime() - review.createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      const decayWeight = Math.exp(-ageInMonths / decayMonths);
      const avgScore =
        (review.friendliness + review.knowledge + review.communication) / 3;
      return { decayWeight, avgScore };
    });

    const totalWeight = reviewWeights.reduce(
      (sum, r) => sum + r.decayWeight,
      0,
    );
    const weightedReviewAvg =
      reviewWeights.reduce((sum, r) => sum + r.avgScore * r.decayWeight, 0) /
      (totalWeight || 1);

    // --- Bayesian Smoothing ---
    const priorMean = 5.5; // Increased from 4.0
    const priorWeight = 3;
    const bayesianAverage =
      (priorMean * priorWeight + weightedReviewAvg * reviews.length) /
      (priorWeight + reviews.length);

    // --- Engagement score ---
    const chats = await em.find(UserChat, { user: this.uuid });
    const maxSessions = 50;
    const engagementScore = Math.min(
      Math.log(1 + chats.length) / Math.log(1 + maxSessions),
      1,
    );

    // --- Consistency score ---
    const allScores = reviews.map(
      (r) => (r.friendliness + r.knowledge + r.communication) / 3,
    );
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const stdDev = Math.sqrt(
      allScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        allScores.length,
    );
    const consistencyScore = 1 - Math.min(stdDev / 2, 1); // tighter scale

    // --- Activity score ---
    const mentorMessages = await em.find(ChatMessage, {
      sender: this.mentor,
    });
    const profileCompleted =
      this.mentor.avatar &&
      this.mentor.interests &&
      this.mentor.department &&
      this.mentor.bio;
    const activityScore =
      [
        profileCompleted ? 1 : 0,
        mentorMessages.length > 0 ? 1 : 0,
        chats.length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0) / 3;

    // --- Tenure bonus ---
    const created = this.createdAt ?? new Date();
    const monthsSinceCreated =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const tenureBase = Math.min(monthsSinceCreated / 24, 1);
    const tenureBonus = Math.max(tenureBase, 0.1); // minimum 0.1 for brand new mentors

    // --- Final rating (weights) ---
    const finalRating =
      0.55 * bayesianAverage +
      0.15 * engagementScore +
      0.1 * activityScore +
      0.1 * consistencyScore +
      0.1 * tenureBonus;

    this.rating = parseFloat(finalRating.toFixed(2));
    this.totalReviews = reviews.length;
    this.updateLevel();
  }

  updateLevel(): void {
    if (this.totalReviews >= 25 && this.rating >= 4.5) {
      this.level = 4;
    } else if (this.totalReviews >= 10 && this.rating >= 4.0) {
      this.level = 3;
    } else if (this.totalReviews >= 3 && this.rating >= 3.5) {
      this.level = 2;
    } else {
      this.level = 1;
    }
  }

  getLevelTitle(): string {
    switch (this.level) {
      case 4:
        return "Кращий ментор ";
      case 3:
        return "Досвічений ментор";
      case 2:
        return "Довірений ментор";
      case 1:
      default:
        return "Новий ментор";
    }
  }
}
