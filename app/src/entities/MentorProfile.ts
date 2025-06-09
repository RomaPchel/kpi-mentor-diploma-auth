import { Entity, Property, OneToOne, OneToMany } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { Collection } from "@mikro-orm/core";
import { Review } from "./MentorReview.js";
import { em } from "../db/config.js";
import { UserChat } from "./chat/UserChat.js";
import { ChatMessage } from "./chat/ChatMessage.js";
import { Badge } from "../enums/UserEnums.js";
type ReviewContext = {
  allReviewsByUser: Review[];
  allReviewsForMentor: Review[];
};
@Entity()
export class MentorProfile extends BaseEntity {
  @OneToOne(() => User, { owner: true })
  mentor!: User;

  @Property({ type: "decimal", precision: 3, scale: 2, default: 0.0 })
  rating: number = 0.0;

  @Property({ default: 0 })
  totalReviews: number = 0;

  @Property()
  isHighlighted: boolean = false;

  @Property({ type: "jsonb", nullable: true })
  badges: string[] = [];

  @OneToMany(() => Review, (review) => review.mentor)
  reviews = new Collection<Review>(this);

  @Property({ default: 1 })
  level: number = 1;

  updateBadges(): void {
    const badges: Badge[] = [];

    if (this.rating >= 4.8 && this.totalReviews >= 30) {
      badges.push(Badge.StarMentor);
    }

    if (this.totalReviews >= 50) {
      badges.push(Badge.ExperiencedMentor);
    }

    if (this.level === 4) {
      badges.push(Badge.CommunityLeader);
    }

    if (this.reviews.getItems().length >= 5) {
      const recent = this.reviews.getItems().slice(-5);
      const avgRecent =
        recent.reduce(
          (sum, r) =>
            sum + (r.friendliness + r.knowledge + r.communication) / 3,
          0,
        ) / 5;

      if (avgRecent >= 4.5) {
        badges.push(Badge.TrustedMentor);
      }
    }

    if (this.mentor.bio?.length > 150) {
      badges.push(Badge.CompleteProfile);
    }

    if (this.mentor.avatar) {
      badges.push(Badge.WithPhoto);
    }

    this.badges = badges;
  }

  async updateRating(): Promise<void> {
    const reviews = this.reviews.getItems();

    if (!reviews.length) {
      this.rating = 0;
      this.totalReviews = 0;
      this.level = 1;
      return;
    }

    const now = new Date();
    const decayMonths = 6;

    // --- Time-decayed average of reviews
    const reviewStats = reviews.map((review) => {
      const ageInMonths =
        (now.getTime() - review.createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      const decayWeight = Math.exp(-ageInMonths / decayMonths);
      const avgScore =
        (review.friendliness + review.knowledge + review.communication) / 3;
      return { decayWeight, avgScore };
    });

    const totalWeight = reviewStats.reduce((sum, r) => sum + r.decayWeight, 0);
    const weightedAvg =
      reviewStats.reduce((sum, r) => sum + r.avgScore * r.decayWeight, 0) /
      (totalWeight || 1);

    // --- Bayesian Average
    const priorMean = 5.5;
    const priorWeight = 3;
    const bayesianAverage =
      (priorMean * priorWeight + weightedAvg * reviews.length) /
      (priorWeight + reviews.length);

    // --- Engagement Score (log-normalized)
    const chats = await em.find(UserChat, { user: this.uuid });
    const engagementScore = Math.min(
      Math.log1p(chats.length) / Math.log1p(50),
      1,
    );

    // --- Consistency Score (standard deviation)
    const allScores = reviewStats.map((r) => r.avgScore);
    const mean = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
    const variance =
      allScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      allScores.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = 1 - Math.min(stdDev / 2, 1);

    // --- Activity Score (binary indicators)
    const mentorMessages = await em.find(ChatMessage, { sender: this.mentor });
    const profileCompleted = Boolean(
      this.mentor.avatar &&
        this.mentor.interests &&
        this.mentor.department &&
        this.mentor.bio,
    );
    const activityScore =
      [profileCompleted, mentorMessages.length > 0, chats.length > 0].filter(
        Boolean,
      ).length / 3;

    // --- Tenure Score
    const created = this.createdAt ?? new Date();
    const monthsSinceCreated =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const tenureBonus = Math.max(Math.min(monthsSinceCreated / 24, 1), 0.1);

    // --- Wilson Lower Bound (confidence-adjusted lower bound)
    const normalizedAvg = weightedAvg / 6;
    const wilsonLowerBound = this.wilsonScore(
      normalizedAvg * reviews.length,
      reviews.length,
    );
    const wilsonAdjusted = wilsonLowerBound * 6;

    // --- Final Composite Rating
    const finalRating =
      0.45 * wilsonAdjusted +
      0.35 * bayesianAverage +
      0.1 * engagementScore * 6 +
      0.05 * consistencyScore * 6 +
      0.05 * activityScore * 6 +
      0.01 * tenureBonus * 6;

    this.rating = parseFloat(finalRating.toFixed(2));
    this.totalReviews = reviews.length;

    this.updateLevel();
    this.updateBadges();
  }

  wilsonScore(pos: number, n: number, z: number = 1.96): number {
    if (n === 0) return 0;
    const phat = pos / n;
    const denominator = 1 + (z * z) / n;
    const numerator =
      phat +
      (z * z) / (2 * n) -
      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
    return numerator / denominator;
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

  isReviewSuspicious(review: Review, context: ReviewContext) {
    const now = new Date();

    // 1. Всі оцінки максимальні або мінімальні — підозріло
    const scores = [
      review.friendliness,
      review.knowledge,
      review.communication,
    ];
    const allMax = scores.every((score) => score === 6);
    const allMin = scores.every((score) => score === 1);
    if (allMax || allMin) return true;

    // 2. Відгук залишено менше ніж через 1 годину після створення
    const reviewAgeMins =
      (now.getTime() - review.createdAt.getTime()) / (1000 * 60);
    if (reviewAgeMins < 60) return true;

    // 3. Один користувач залишив кілька відгуків одному ментору
    const duplicates = context.allReviewsByUser.filter(
      (r) => r.mentor === review.mentor,
    );
    if (duplicates.length > 1) return true;

    // 4. Всі оцінки від користувача одному ментору в той самий день
    const sameDayReviews = context.allReviewsByUser.filter((r) => {
      const d1 = r.createdAt.toDateString();
      const d2 = review.createdAt.toDateString();
      return r.mentor === review.mentor && d1 === d2;
    });
    return sameDayReviews.length > 1;
  }
}
