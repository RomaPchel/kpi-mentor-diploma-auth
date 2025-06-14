import { Entity, Property, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";

@Entity()
export class Feedback extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @Property({ type: "text" })
  message!: string;

  @Property({ type: "boolean", default: false })
  reviewedByAdmin: boolean = false;
}
