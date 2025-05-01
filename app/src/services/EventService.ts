import { Event } from "../entities/Event.js";
import { User } from "../entities/User.js";
import { EventStatus } from "../enums/EventEnums.js";
import type {
  CreateEventRequest,
  EventResponse,
  UpdateEventRequest,
} from "../interfaces/EventInterfaces.js";
import { EventRepository } from "../repositories/EventRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";

export class EventService {
  private readonly repo: EventRepository;
  private readonly userRepository = new UserRepository();

  constructor() {
    this.repo = new EventRepository();
    this.userRepository = new UserRepository();
  }

  async createEvent(req: CreateEventRequest, owner: User) {
    const { url, timestamp, participants } = req;

    const event = new Event();
    event.url = url;
    event.owner = owner;
    event.status = EventStatus.PLANNED;

    const users = await this.userRepository.getAllUsersByIds(participants);
    if (users.length == 0) {
      throw new Error("USERS_NOT_FOUND")
    }
    event.participants.set(users);
    event.timestamp = new Date(Number(timestamp));

    await this.repo.save(event);

    return this.toEventResponse(event);
  }

  async getEventById(eventId: string) {
    const event = await this.repo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    return this.toEventResponse(event);
  }

  async getAllEvents(
    filters: {
      userIds?: string[];
      status?: EventStatus;
      minTimestamp?: string;
      maxTimeStamp?: string;
    },
    sorting: {
      sortBy?: "status";
      sortOrder?: "asc" | "desc";
    },
  ) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.minTimestamp) {
      where.timestamp = {
        ...(where.timestamp || {}),
        $gte: new Date(filters.minTimestamp),
      };
    }

    if (filters?.maxTimeStamp) {
      where.timestamp = {
        ...(where.timestamp || {}),
        $lte: new Date(filters.maxTimeStamp),
      };
    }

    if (filters?.userIds?.length) {
      where.$or = [
        { owner: { uuid: { $in: filters.userIds } } },
        { participants: { uuid: { $in: filters.userIds } } },
      ];
    }

    const events = await this.repo.findAll(where);

    let result = events.map((event) => this.toEventResponse(event));

    const sortBy = sorting.sortBy ?? "timestamp";
    const sortOrder = sorting.sortOrder === "desc" ? -1 : 1;

    result = result.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "status") {
        aValue = a.status.toLowerCase() ?? "";
        bValue = b.status.toLowerCase() ?? "";
      }

      if (aValue! < bValue!) return -1 * sortOrder;
      if (aValue! > bValue!) return 1 * sortOrder;
      return 0;
    });

    return result;
  }

  async updateEvent(eventId: string, updateData: Partial<UpdateEventRequest>) {
    const event = await this.repo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (updateData.url) event.url = updateData.url;
    if (updateData.status) event.status = updateData.status;
    if (updateData.timestamp) event.timestamp = new Date(Number(updateData.timestamp));

    if (updateData.participants) {
      const participantUsers = await this.userRepository.getAllUsersByIds(
        updateData.participants,
      );
      event.participants.set(participantUsers);
    }

    await this.repo.save(event);

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
