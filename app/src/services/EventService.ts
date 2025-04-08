import { Event } from "../entities/Event.js";
import { User } from "../entities/User.js";
import { EventStatus } from "../enums/EventEnums.js";
import { em } from "../db/config.js";
import type {
  CreateEventRequest,
  EventResponse,
  UpdateEventRequest,
} from "../interfaces/EventInterfaces.js";

export class EventService {
  async createEvent(req: CreateEventRequest, owner: User) {
    const { url, timestamp, participants } = req;

    const event = new Event();
    event.url = url;
    event.owner = owner;
    event.status = EventStatus.PLANNED;

    const users = await em.find(User, { uuid: { $in: participants || [] } });
    event.participants.set(users);

    event.timestamp = new Date(timestamp);

    await em.persistAndFlush(event);

    return this.toEventResponse(event);
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
    return this.toEventResponse(event);
  }

  async getAllEvents() {
    const events = await em.findAll(Event, {
      populate: ["participants"],
    });
    return events.map((event) => {
      return this.toEventResponse(event);
    });
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

   return this.toEventResponse(event);
  }

  private toEventResponse(event: Event): EventResponse {
    return {
      id: event.uuid,
      url: event.url,
      status: event.status,
      timestamp: event.timestamp,
      owner: {
        id: event.owner.uuid,
        name: `${event.owner.firstName} ${event.owner.lastName}`,
      },
      participants: event.participants.getItems().map((user) => ({
        id: user.uuid,
        name: `${user.firstName} ${user.lastName}`,
      })),
    };
  }
}
