import { Event } from "../entities/Event.js";
import { User } from "../entities/User.js";
import { EventStatus } from "../enums/EventEnums.js";
import { EventResponse } from "../responses/EventResponse.js";
import { em } from "../db/config.js";
import type { CreateEventRequest, UpdateEventRequest } from "../interfaces/EventInterfaces";

export class EventService {
  async createEvent(req: CreateEventRequest, owner: User) {
    try {
      const { url, timestamp, participants } = req;

      const event = new Event();
      event.url = url;
      event.owner = owner;
      event.status = EventStatus.PLANNED;

      const users = await em.find(User, { uuid: { $in: participants || [] } });
      event.participants.set(users);

      event.timestamp = new Date(timestamp);

      await em.persistAndFlush(event);

      return new EventResponse(event);
    } catch (error) {
      throw new Error(
        "An error occurred while creating the event: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  async getEventById(eventId: string) {
    const event = await em.findOne(
      Event,
      { uuid: eventId },
      { populate: ["participants"] }, // Ensure participants are populated
    );
    if (!event) {
      throw new Error("Event not found");
    }
    return new EventResponse(event);
  }

  async getAllEvents() {
    const events = await em.findAll(Event, {
      populate: ["participants"],
    });
    return events.map((event) => new EventResponse(event));
  }

  async updateEvent(eventId: string, updateData: Partial<UpdateEventRequest>) {
    const event = await em.findOne(Event, { uuid: eventId });
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

    await em.persistAndFlush(event);

    return new EventResponse(event);
  }
}
