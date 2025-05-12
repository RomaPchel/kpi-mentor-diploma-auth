import { Entity, Property, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";
import { MentorProfile } from "./MentorProfile.js";

@Entity()
export class Report extends BaseEntity {
  @ManyToOne(() => User)
  author!: User;

  @ManyToOne(() => MentorProfile)
  mentor!: MentorProfile;

  @Property({ type: "text" })
  message!: string;

  @Property({ type: "boolean", default: false })
  anonymous: boolean = false;

  @Property({ type: "boolean", default: false })
  reviewedByAdmin: boolean = false;
}
