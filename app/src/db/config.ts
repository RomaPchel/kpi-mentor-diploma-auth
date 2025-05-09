import { MikroORM } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { EntityManager } from "@mikro-orm/postgresql";
import { User } from "../entities/User.js";
import { MentorStudent } from "../entities/StudentMentor.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { BecomeMenteeRequest } from "../entities/BecomeManteeRequest.js";
import { Event } from "../entities/Event.js";
import { Chat } from "../entities/chat/Chat.js";
import { ChatMessage } from "../entities/chat/ChatMessage.js";
import { UserChat } from "../entities/chat/UserChat.js";
import { Review } from "../entities/MentorReview.js";
import { Feedback } from "../entities/Feedback.js";

export const orm = await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  entities: [
    User,
    MentorStudent,
    MentorProfile,
    BecomeMentorRequest,
    BecomeMenteeRequest,
    Event,
    Chat,
    ChatMessage,
    UserChat,
    Review,
    Feedback,
  ],
  dbName: "diploma",
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.DATABASE_PASSWORD as string,
});

export const em = orm.em.fork() as EntityManager;
