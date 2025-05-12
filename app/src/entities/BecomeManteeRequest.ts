import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { MentorRequestStatus } from "../enums/UserEnums.js";

@Entity()
export class BecomeMenteeRequest extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => User)
  mentor!: User;

  @Property({ type: "text", nullable: true })
  motivation?: string | null;

  @Enum(() => MentorRequestStatus)
  status: MentorRequestStatus = MentorRequestStatus.PENDING;

  @Property({ nullable: true })
  processedAt?: Date;
}
