import { Collection, Entity, ManyToOne, ManyToMany, Property, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { EventStatus } from "../enums/EventEnums.js";
import { User } from "./User.js";

@Entity()
export class Event extends BaseEntity {
  @Property()
  url!: string;

  @ManyToOne(() => User)
  owner!: User;

  @Enum(() => EventStatus)
  status: EventStatus = EventStatus.PLANNED;

  @ManyToMany(() => User)
  participants = new Collection<User>(this);

  @Property({ type: "datetime" }) // Using timestamp with timezone support
  timestamp!: Date;
}
