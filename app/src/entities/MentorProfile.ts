import { Entity, Property, OneToOne, OneToMany } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { Collection } from "@mikro-orm/core";
import { Review } from "./MentorReview.js";

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

  async updateRating(): Promise<void> {
    if (this.reviews.length === 0) {
      this.rating = 0;
      this.totalReviews = 0;
      return;
    }

    let totalScore = 0;
    const weights = { friendliness: 0.4, knowledge: 0.4, communication: 0.2 };

    for (const review of this.reviews) {
      const weightedScore =
        review.friendliness * weights.friendliness +
        review.knowledge * weights.knowledge +
        review.communication * weights.communication;
      totalScore += weightedScore;
    }

    this.totalReviews = this.reviews.length;
    this.rating = parseFloat((totalScore / this.totalReviews).toFixed(2));
  }
}
