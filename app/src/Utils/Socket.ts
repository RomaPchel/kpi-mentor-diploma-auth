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
  // Updated map: userId => Set of socket ids
  private userSocketMap: Map<string, Set<string>> = new Map();

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
        this.addSocketForUser(handshakeUserId, socket.id);
        console.log(
          `User ${handshakeUserId} added from handshake for socket ${socket.id}`,
        );
      } else {
        // Optionally set a timeout to warn if no authentication is received.
        setTimeout(() => {
          if (
            ![...this.userSocketMap.values()].some((set) => set.has(socket.id))
          ) {
            console.warn(`No authentication received for socket ${socket.id}`);
          }
        }, 5000);
      }

      socket.on("authenticate", (data: { userId: string }) => {
        if (data && data.userId) {
          this.addSocketForUser(data.userId, socket.id);
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
        "chat:message",
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

            console.log(sender, chat, data.content);
            const chatMessage = new ChatMessage(sender, chat, data.content);
            const message = em.create(ChatMessage, chatMessage);
            await em.persistAndFlush(message);

            console.log("Updated userSocketMap:", this.userSocketMap);
            // Get the set of socket IDs for the recipient
            const recipientSocketSet = this.userSocketMap.get(recipient.uuid);
            if (recipientSocketSet && recipientSocketSet.size > 0) {
              // Emit to each socket the recipient has open
              for (const recipientSocketId of recipientSocketSet) {
                console.log("sending message");
                this.io.to(recipientSocketId).emit("chat:message", {
                  uuid: chatMessage.uuid,
                  sender: { uuid: sender.uuid },
                  recipientId: recipient.uuid,
                  content: chatMessage.content,
                  createdAt: chatMessage.createdAt,
                  chatId: chat.uuid,
                });
              }
            } else {
              console.log(`Recipient ${recipient.uuid} is not connected.`);
            }
          } catch (error) {
            console.error("Error handling chat message:", error);
          }
        },
      );

      socket.on("disconnect", () => {
        // Iterate over the map to remove this socket from any user's set.
        for (const [userId, socketSet] of this.userSocketMap.entries()) {
          if (socketSet.has(socket.id)) {
            socketSet.delete(socket.id);
            if (socketSet.size === 0) {
              this.userSocketMap.delete(userId);
              console.log(`User ${userId} disconnected completely.`);
            } else {
              console.log(`Socket ${socket.id} removed from user ${userId}`);
            }
            break;
          }
        }
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private addSocketForUser(userId: string, socketId: string): void {
    if (this.userSocketMap.has(userId)) {
      this.userSocketMap.get(userId)?.add(socketId);
    } else {
      this.userSocketMap.set(userId, new Set([socketId]));
    }
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
