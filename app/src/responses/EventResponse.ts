import type { EventStatus } from "../enums/EventEnums.js";
import type { Event } from "../entities/Event.js";

export class EventResponse {
  id: string;
  url: string;
  status: EventStatus;
  timestamp: Date;
  owner: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    name: string;
  }>;

  constructor(event: Event) {
    this.id = event.uuid;
    this.url = event.url;
    this.status = event.status;
    this.timestamp = event.timestamp;
    this.owner = {
      id: event.owner.uuid,
      name: event.owner.firstName,
    };
    this.participants = event.participants.map((user) => ({
      id: user.uuid,
      name: user.firstName,
    }));
  }
}
