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

    // --- WeightedReviewScore with time decay ---
    const reviewWeights = reviews.map((review) => {
      const ageInMonths =
        (now.getTime() - review.createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      const weight = Math.exp(-ageInMonths / decayMonths);
      const avgScore =
        (review.friendliness + review.knowledge + review.communication) / 3;
      return { weight, avgScore };
    });

    const totalWeight = reviewWeights.reduce((sum, r) => sum + r.weight, 0);
    const weightedScore =
      reviewWeights.reduce((sum, r) => sum + r.avgScore * r.weight, 0) /
      (totalWeight || 1);

    const chats = await em.find(UserChat, {
      user: this.uuid,
    });
    // --- EngagementScore ---
    const maxExpectedSessions = 50;
    const engagementScore = Math.min(
      Math.log(1 + chats.length) / Math.log(1 + maxExpectedSessions),
      1,
    );

    // --- ConsistencyScore (standard deviation) ---
    const allScores = reviews.map(
      (r) => (r.friendliness + r.knowledge + r.communication) / 3,
    );
    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const stdDev = Math.sqrt(
      allScores.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
        allScores.length,
    );
    const consistencyScore = 1 - Math.min(stdDev / 5, 1);

    const profileCompleted =
      this.mentor.avatar &&
      this.mentor.interests &&
      this.mentor.department &&
      this.mentor.bio;

    const mentorMessages = await em.find(ChatMessage, {
      sender: this.mentor,
    });

    // --- ActivityScore ---
    const activityScore =
      [
        profileCompleted ? 1 : 0,
        mentorMessages.length > 0 ? 1 : 0,
        chats.length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0) / 3;

    // --- TenureBonus ---
    const created = this.createdAt ?? new Date(); // fallback
    const months =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const tenureBonus = Math.min(months / 24, 1); // cap after 2 years

    // --- Final Rating ---
    const finalRating =
      0.4 * weightedScore +
      0.2 * engagementScore +
      0.2 * consistencyScore +
      0.1 * activityScore +
      0.1 * tenureBonus;

    this.totalReviews = reviews.length;
    this.rating = parseFloat(finalRating.toFixed(2));
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
