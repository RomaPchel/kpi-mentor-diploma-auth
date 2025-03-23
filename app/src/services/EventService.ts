import { Collection, EntityRepository } from "@mikro-orm/core";
import { Event } from "../entities/Event.js";
import { User } from "../entities/User.js";
import { EventStatus } from "../enums/EventEnums.js";
import type { CreateEventRequest } from "../requests/CreateEventRequest.js";
import { EventResponse } from "../responses/EventResponse.js";
import { em } from "../db/config.js";
import type { UpdateEventRequest } from "../requests/UpdateEventRequest.js";

class EventService {
  private readonly eventRepo: EntityRepository<Event>;

  constructor() {
    this.eventRepo = em.getRepository(Event);
  }

  async createEvent(req: CreateEventRequest, owner: User) {
    try {
      const { url, timestamp, participants } = req;

      const event = new Event();
      event.url = url;
      event.owner = owner;
      event.status = EventStatus.PLANNED;

      const participantUsers = new Collection<User>(event);
      const users = await em.find(User, { uuid: { $in: participants || [] } });
      participantUsers.set(users);
      event.participants = participantUsers;

      event.timestamp = new Date(timestamp);

      await em.upsert(event);

      return new EventResponse(event);
    } catch (error) {
      throw new Error(
        "An error occurred while creating the event: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  async getEventById(eventId: string) {
    const event = await this.eventRepo.findOne(
      { uuid: eventId },
      { populate: ["participants"] }, // Ensure participants are populated
    );
    if (!event) {
      throw new Error("Event not found");
    }
    return new EventResponse(event);
  }

  async getAllEvents() {
    const events = await this.eventRepo.findAll({
      populate: ["participants"],
    });
    return events.map((event) => new EventResponse(event));
  }

  async updateEvent(eventId: string, updateData: Partial<UpdateEventRequest>) {
    const event = await this.eventRepo.findOne({ uuid: eventId });
    if (!event) {
      throw new Error("Event not found");
    }

    if (updateData.url) event.url = updateData.url;
    if (updateData.status) event.status = updateData.status;
    if (updateData.timestamp) event.timestamp = new Date(updateData.timestamp);

    if (updateData.participants) {
      const participantUsers = await em.find(User, {
        uuid: { $in: updateData.participants },
      });
      event.participants.set(participantUsers);
    }

    await this.eventRepo.upsert(event);

    return new EventResponse(event);
  }
}

export default new EventService();
