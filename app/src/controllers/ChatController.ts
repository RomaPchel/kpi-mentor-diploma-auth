import Router from "koa-router";
import type { Context } from "koa";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { Chat } from "../entities/chat/Chat.js";
import { UserChat } from "../entities/chat/UserChat.js";
import { ChatMessage } from "../entities/chat/ChatMessage.js";
import { User } from "../entities/User.js";
import { em } from "../db/config.js";
import { ZodError } from "zod";

// Custom error type that allows for status property
interface HttpError extends Error {
  status?: number;
}

export class ChatController extends Router {
  constructor() {
    super({ prefix: "/api/chat" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.get("/", AuthMiddleware(), this.getChats);
    this.get("/:chatId", AuthMiddleware(), this.getChat);
    this.post("/:chatId/read", this.markAsRead);
  }

  private async getChats(ctx: Context) {
    try {
      const user: User = ctx.state.user as User;
      console.log("User requesting chats:", user.uuid);

      // Get all chat connections for the user with messages and related user chats populated
      const userChats = await em.find(
        UserChat,
        { user: user },
        {
          populate: [
            "chat",
            "chat.messages",
            "chat.messages.sender",
            "chat.userChats",
            "chat.userChats.user",
          ],
        },
      );

      console.log(`Found ${userChats.length} chats for user ${user.uuid}`);

      // Map over each user-chat connection
      ctx.body = await Promise.all(
        userChats.map(async (userChat) => {
          // Get the other users in the chat (exclude the current user)
          const otherUserChats = await em.find(
            UserChat,
            {
              chat: userChat.chat,
              user: { $ne: user },
            },
            { populate: ["user"] },
          );
          const otherUser =
            otherUserChats.length > 0 ? otherUserChats[0].user : null;

          // Count unread messages: messages sent by others after the last read time
          const unreadCount = await em.count(ChatMessage, {
            chat: userChat.chat,
            sender: { $ne: user },
            createdAt: { $gt: userChat.lastReadAt || new Date(0) },
          });

          // Get all messages for this chat, mapping each message to a plain object
          const messages = userChat.chat.messages
            .getItems()
            .map((message) => ({
              uuid: message.uuid,
              content: message.content,
              sender: {
                uuid: message.sender.uuid,
                firstName: message.sender.firstName,
                lastName: message.sender.lastName,
                email: message.sender.email,
                role: message.sender.role,
                avatar: message.sender.avatar || "",
              },
              createdAt: message.createdAt,
              updatedAt: message.updatedAt,
            }))
            // Sort messages in chronological order
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          return {
            uuid: userChat.chat.uuid,
            otherUser: otherUser
              ? {
                  uuid: otherUser.uuid,
                  firstName: otherUser.firstName,
                  lastName: otherUser.lastName,
                  email: otherUser.email,
                  role: otherUser.role,
                  avatar: otherUser.avatar || "",
                  status: "offline", // Adjust if you have online status tracking
                }
              : null,
            messages, // Return all messages for this chat
            unreadCount,
          };
        }),
      );
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in getChats:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getChat(ctx: Context) {
    try {
      const user: User = ctx.state.user as User;
      const chatId = ctx.params.chatId;

      console.log(`Get chat request for chatId: ${chatId}`);

      // Find the requested chat
      const chat = await em.findOne(
        Chat,
        { uuid: chatId },
        {
          populate: [
            "userChats",
            "userChats.user",
            "messages",
            "messages.sender",
          ],
        },
      );

      if (!chat) {
        console.log(`Chat not found: ${chatId}`);
        ctx.status = 404;
        ctx.body = { error: "Chat not found" };
        return;
      }

      // Check if the user is a member of this chat
      const userChatMembership = await em.findOne(UserChat, {
        chat: chat,
        user: user,
      });

      if (!userChatMembership) {
        console.log(`User ${user.uuid} is not a member of chat ${chatId}`);
        ctx.status = 403;
        ctx.body = { error: "You are not a member of this chat" };
        return;
      }

      console.log(`Found ${chat.messages.length} messages in chat ${chatId}`);

      // Format the response
      ctx.body = {
        uuid: chat.uuid,
        privateName: chat.privateName,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        users: chat.userChats.getItems().map((userChat) => ({
          uuid: userChat.uuid,
          user: {
            uuid: userChat.user.uuid,
            firstName: userChat.user.firstName,
            lastName: userChat.user.lastName,
            email: userChat.user.email,
            role: userChat.user.role,
            avatar: userChat.user.avatar || "",
          },
          lastReadAt: userChat.lastReadAt,
        })),
        messages: chat.messages
          .getItems()
          .map((message) => ({
            uuid: message.uuid,
            content: message.content,
            sender: {
              uuid: message.sender.uuid,
              firstName: message.sender.firstName,
              lastName: message.sender.lastName,
              email: message.sender.email,
              role: message.sender.role,
              avatar: message.sender.avatar || "",
            },
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          }))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      };
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in getChat:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async markAsRead(ctx: Context) {
    try {
      console.log("HELLO");
      const user: User = ctx.state.user as User;
      const chatId = ctx.params.chatId;

      const chat = await em.findOne(Chat, { uuid: chatId });
      if (!chat) {
        ctx.status = 404;
        ctx.body = { error: "Chat not found" };
        return;
      }
      console.log(chat);

      const userChat = await em.findOne(UserChat, {
        user: user,
        chat: chat,
      });

      if (!userChat) {
        ctx.status = 403;
        ctx.body = { error: "You are not a member of this chat" };
        return;
      }

      userChat.lastReadAt = new Date();
      await em.persistAndFlush(userChat);

      ctx.status = 200;
      ctx.body = { success: true };
    } catch (e: unknown) {
      console.error("Error in markAsRead:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }
}
