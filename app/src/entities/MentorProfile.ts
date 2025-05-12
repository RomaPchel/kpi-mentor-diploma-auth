import { Entity, Property, OneToOne, OneToMany } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { Collection } from "@mikro-orm/core";
import { Review } from "./MentorReview.js";
import { em } from "../db/config.js";
import { UserChat } from "./chat/UserChat.js";
import { ChatMessage } from "./chat/ChatMessage.js";
import { Badge } from "../enums/UserEnums.js";

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

    if (reviews.length === 0) {
      this.rating = 0;
      this.totalReviews = 0;
      this.level = 1;
      return;
    }

    const now = new Date();
    const decayMonths = 6;

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

    const priorMean = 5.5;
    const priorWeight = 3;
    const bayesianAverage =
      (priorMean * priorWeight + weightedReviewAvg * reviews.length) /
      (priorWeight + reviews.length);

    const chats = await em.find(UserChat, { user: this.uuid });
    const maxSessions = 50;
    const engagementScore = Math.min(
      Math.log(1 + chats.length) / Math.log(1 + maxSessions),
      1,
    );

    const allScores = reviews.map(
      (r) => (r.friendliness + r.knowledge + r.communication) / 3,
    );
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const stdDev = Math.sqrt(
      allScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        allScores.length,
    );
    const consistencyScore = 1 - Math.min(stdDev / 2, 1); // tighter scale

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

    const created = this.createdAt ?? new Date();
    const monthsSinceCreated =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const tenureBase = Math.min(monthsSinceCreated / 24, 1);
    const tenureBonus = Math.max(tenureBase, 0.1);

    const normalizedAvg = weightedReviewAvg / 6;
    const wilsonLowerBound = this.wilsonScore(
      normalizedAvg * reviews.length,
      reviews.length,
    );
    const wilsonAdjustedRating = wilsonLowerBound * 6;
    const finalRating =
      0.45 * wilsonAdjustedRating +
      0.35 * bayesianAverage +
      0.1 * engagementScore +
      0.05 * consistencyScore +
      0.05 * activityScore +
      0.01 * tenureBonus;

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
}
