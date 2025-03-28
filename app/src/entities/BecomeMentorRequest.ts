import { Entity, Property, OneToOne, Enum } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";

@Entity()
export class BecomeMentorRequest extends BaseEntity {
  @OneToOne(() => User, { owner: true })
  user!: User;

  @Property({ type: "text", nullable: true })
  motivation?: string;

  @Enum(() => MentorRequestStatus)
  status: MentorRequestStatus = MentorRequestStatus.PENDING;

  @Property({ nullable: true })
  processedAt?: Date;
}
