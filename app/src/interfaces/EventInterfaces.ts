import type { EventStatus } from "../enums/EventEnums";

export interface CreateEventRequest {
  url: string;
  timestamp: string;
  participants: string[];
}

export interface UpdateEventRequest {
  url: string;
  status: EventStatus;
  timestamp: string;
  participants: string[];
}

