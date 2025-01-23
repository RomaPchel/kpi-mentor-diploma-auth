import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";

@Entity()
export class MentorStudent extends BaseEntity {
  @ManyToOne(() => User)
  mentor!: User;

  @ManyToOne(() => User)
  student!: User;

  @Property({ nullable: true })
  relationshipDetails?: string;
}
