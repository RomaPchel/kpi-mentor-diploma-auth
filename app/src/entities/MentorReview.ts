import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";
import { MentorProfile } from "./MentorProfile.js";

@Entity()
export class Review extends BaseEntity {
  @ManyToOne(() => User)
  reviewer!: User;

  @ManyToOne(() => MentorProfile)
  mentor!: MentorProfile;

  @Property({ type: "int" })
  friendliness!: number;

  @Property({ type: "int" })
  knowledge!: number;

  @Property({ type: "int" })
  communication!: number;

  @Property({ type: "text", nullable: true })
  comment?: string;
}
