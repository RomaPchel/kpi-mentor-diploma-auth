import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { User } from "./User";
import { Chat } from "./Chat";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class UserChat extends BaseEntity {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Chat)
  chat: Chat;

  @Property({ nullable: true })
  lastReadAt?: Date;

  constructor(user: User, chat: Chat) {
    super();
    this.user = user;
    this.chat = chat;
  }
}
