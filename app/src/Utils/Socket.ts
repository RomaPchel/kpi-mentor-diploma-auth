import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { EntityManager } from "@mikro-orm/core";
import { User } from "../entities/User.js";
import { ChatMessage } from "../entities/chat/ChatMessage.js";
import { Chat } from "entities/chat/Chat.js";
import { UserChat } from "../entities/chat/UserChat.js";

export default class SocketSingleton {
  private static instance: SocketSingleton;
  private io: Server;
  private em: EntityManager;
  private userSocketMap: Map<string, string> = new Map();

  private constructor(server: HTTPServer, em: EntityManager) {
    this.io = new Server(server);
    this.em = em;

    this.io.on("connection", (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on("authenticate", (data: { userId: string }) => {
        this.userSocketMap.set(data.userId, socket.id);
        console.log(
          `User ${data.userId} authenticated with socket ${socket.id}`,
        );
      });

      socket.on(
        "chatMessage",
        async (data: {
          senderId: string;
          recipientId: string;
          content: string;
        }) => {
          try {
            const sender = await this.em.findOne(User, { uuid: data.senderId });
            const recipient = await this.em.findOne(User, {
              uuid: data.recipientId,
            });
            if (!sender || !recipient) {
              console.error("Sender or recipient not found");
              return;
            }

            const chat = await this.getOrCreatePrivateChat(sender, recipient);

            const chatMessage = new ChatMessage(sender, chat, data.content);
            await this.em.persistAndFlush(chatMessage);

            const recipientSocketId = this.userSocketMap.get(recipient.uuid);
            if (recipientSocketId) {
              this.io.to(recipientSocketId).emit("chatMessage", {
                id: chatMessage.uuid,
                senderId: sender.uuid,
                content: chatMessage.content,
                createdAt: chatMessage.createdAt,
                chatId: chat.uuid,
              });
            } else {
              console.log(`Recipient ${recipient.uuid} is not connected.`);
            }
          } catch (error) {
            console.error("Error handling chat message:", error);
          }
        },
      );

      socket.on("disconnect", () => {
        for (const [userId, sockId] of this.userSocketMap.entries()) {
          if (sockId === socket.id) {
            this.userSocketMap.delete(userId);
            console.log(`User ${userId} disconnected.`);
            break;
          }
        }
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private generatePrivateChatName(
    senderId: string,
    recipientId: string,
  ): string {
    const sorted = [senderId, recipientId].sort();
    return `private:${sorted.join(":")}`;
  }

  private async getOrCreatePrivateChat(
    sender: User,
    recipient: User,
  ): Promise<Chat> {
    const privateName = this.generatePrivateChatName(
      sender.uuid,
      recipient.uuid,
    );

    let chat = await this.em.findOne(Chat, { privateName });
    if (!chat) {
      chat = new Chat(privateName);
      this.em.persist(chat);

      const senderUserChat = new UserChat(sender, chat);
      const recipientUserChat = new UserChat(recipient, chat);

      this.em.persist(senderUserChat);
      this.em.persist(recipientUserChat);

      await this.em.flush();
    }
    return chat;
  }

  public static getInstance(
    server: HTTPServer,
    em: EntityManager,
  ): SocketSingleton {
    if (!SocketSingleton.instance) {
      SocketSingleton.instance = new SocketSingleton(server, em);
    }
    return SocketSingleton.instance;
  }
}
