import { Entity, Collection, OneToMany, Property } from "@mikro-orm/core";
import { ChatMessage } from "./ChatMessage.js";
import { BaseEntity } from "./BaseEntity.js";
import { UserChat } from "./UserChat.js";

@Entity()
export class Chat extends BaseEntity {
  @OneToMany(() => UserChat, (userChat) => userChat.chat)
  userChats = new Collection<UserChat>(this);

  @OneToMany(() => ChatMessage, (message) => message.chat)
  messages = new Collection<ChatMessage>(this);

  @Property({ nullable: true })
  privateName?: string;

  constructor(privateName?: string) {
    super();
    if (privateName) {
      this.privateName = privateName;
    }
  }
}
