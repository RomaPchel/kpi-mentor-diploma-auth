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

export interface EventResponse {
  id: string;
  url: string;
  status: EventStatus;
  timestamp: Date;
  createdAt: Date;
  owner: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    name: string;
  }>;
}
