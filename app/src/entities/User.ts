import {
  Entity,
  Property,
  Enum,
  BeforeCreate,
  Collection,
  OneToMany,
  ManyToMany,
} from "@mikro-orm/core";
import { FormsOfEducation, UserRole } from "../enums/UserEnums.js";
import bcrypt from "bcrypt";
import { BaseEntity } from "./BaseEntity.js";
import { UserChat } from "./chat/UserChat.js";
import { Event } from "./Event.js";

@Entity()
export class User extends BaseEntity {
  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  password!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.STUDENT;

  @OneToMany(() => UserChat, (userChat) => userChat.user)
  userChats = new Collection<UserChat>(this);

  @Property({ nullable: true, type: "text" })
  avatar!: string;

  @Property({ type: "text", nullable: true })
  bio!: string;

  @Property({ nullable: true })
  specialization!: string;

  @Enum(() => FormsOfEducation)
  formOfEducation!: FormsOfEducation;

  @Property({ nullable: true })
  groupCode!: string;

  @Property({ nullable: true })
  department!: string;

  @Property({ nullable: true })
  course!: number;

  @Property({ nullable: true })
  interests!: string[];

  @ManyToMany(() => Event, (event) => event.participants) // Основне посилання
  events = new Collection<Event>(this);

  @BeforeCreate()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
