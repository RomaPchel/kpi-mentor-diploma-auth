import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "../BaseEntity.js";
import { Chat } from "./Chat.js";
import { User } from "../User.js";

@Entity()
export class ChatMessage extends BaseEntity {
  @Property()
  content: string;

  @ManyToOne(() => Chat)
  chat: Chat;

  @ManyToOne(() => User)
  sender: User;

  constructor(sender: User, chat: Chat, content: string) {
    super();
    this.sender = sender;
    this.chat = chat;
    this.content = content;
  }
}
