import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { User } from "../entities/User.js";
import { ChatMessage } from "../entities/chat/ChatMessage.js";
import { Chat } from "entities/chat/Chat.js";
import { UserChat } from "../entities/chat/UserChat.js";
import { em } from "../db/config.js";

export default class SocketSingleton {
  private static instance: SocketSingleton;
  private io: Server;
  private userSocketMap: Map<string, string> = new Map();

  private constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      console.log("Current userSocketMap:", this.userSocketMap);

      // If client provided userId in handshake auth, add immediately.
      const handshakeUserId = socket.handshake.auth?.userId;
      if (handshakeUserId) {
        this.userSocketMap.set(handshakeUserId, socket.id);
        console.log(
          `User ${handshakeUserId} added from handshake for socket ${socket.id}`,
        );
      } else {
        // Optionally set a timeout to warn if no authentication is received.
        setTimeout(() => {
          if (![...this.userSocketMap.values()].includes(socket.id)) {
            console.warn(`No authentication received for socket ${socket.id}`);
          }
        }, 5000);
      }

      socket.on("authenticate", (data: { userId: string }) => {
        if (data && data.userId) {
          this.userSocketMap.set(data.userId, socket.id);
          console.log(
            `User ${data.userId} authenticated with socket ${socket.id}`,
          );
        } else {
          console.warn(
            `Authentication event received on socket ${socket.id} without userId`,
          );
        }
      });

      socket.on(
        "message",
        async (data: {
          chatId: string;
          senderId: string;
          recipientId: string;
          content: string;
        }) => {
          try {
            console.log("Message event data:", data);
            const sender = await em.findOne(User, { uuid: data.senderId });
            const recipient = await em.findOne(User, {
              uuid: data.recipientId,
            });
            if (!sender || !recipient) {
              console.error("Sender or recipient not found");
              return;
            }

            const chat = await this.getOrCreatePrivateChat(
              data.chatId,
              sender,
              recipient,
            );

            const chatMessage = new ChatMessage(sender, chat, data.content);
            em.create(ChatMessage, chatMessage);

            console.log("Updated userSocketMap:", this.userSocketMap);
            const recipientSocketId = this.userSocketMap.get(recipient.uuid);
            if (recipientSocketId) {
              this.io.to(recipientSocketId).emit("message", {
                uuid: chatMessage.uuid,
                senderId: sender.uuid,
                recipientId: recipient.uuid,
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
    chatId: string,
    sender: User,
    recipient: User,
  ): Promise<Chat> {
    const privateName = this.generatePrivateChatName(
      sender.uuid,
      recipient.uuid,
    );
    let chat = await em.findOne(Chat, { uuid: chatId });
    if (!chat) {
      chat = new Chat(privateName);
      em.persist(chat);
      const senderUserChat = new UserChat(sender, chat);
      const recipientUserChat = new UserChat(recipient, chat);
      em.persist(senderUserChat);
      em.persist(recipientUserChat);
      await em.flush();
    }
    return chat;
  }

  public static getInstance(server: HTTPServer): SocketSingleton {
    if (!SocketSingleton.instance) {
      SocketSingleton.instance = new SocketSingleton(server);
    }
    return SocketSingleton.instance;
  }
}
