import { Event } from "../entities/Event.js";
import { em } from "../db/config.js";

/**
 * The EventRepository class provides methods for managing Event entities
 * including persisting, retrieving, and updating the event data in the database.
 */
export class EventRepository {
  async save(event: Event) {
    await em.persistAndFlush(event);
  }

  async findById(eventId: string) {
    return await em.findOne(Event, { uuid: eventId }, { populate: ["participants"] });
  }

  async findAll(where: any) {
    return await em.find(Event, where, { populate: ["participants"] });
  }
}
