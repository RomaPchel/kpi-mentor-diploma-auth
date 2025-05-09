import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { validate } from "class-validator";
import { EventService } from "../services/EventService.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import type {
  CreateEventRequest,
  UpdateEventRequest,
} from "../interfaces/EventInterfaces.js";

export class EventController extends Router {
  private readonly eventService: EventService;

  constructor() {
    super({ prefix: "/api/events" });
    this.eventService = new EventService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post("/", AuthMiddleware(), this.createEvent.bind(this));
    this.get("/:id", AuthMiddleware(), this.getEvent.bind(this));
    this.get("/", AuthMiddleware(), this.getAllEvents.bind(this));
    this.put("/:id", AuthMiddleware(), this.updateEvent.bind(this));
  }

  private async createEvent(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const createEventRequest = ctx.request.body as CreateEventRequest;

    const eventResponse = await this.eventService.createEvent(
      createEventRequest,
      user,
    );

    ctx.status = 201;
    ctx.body = eventResponse;
  }

  private async getEvent(ctx: Context): Promise<void> {
    const eventId = ctx.params.id;
    const eventResponse = await this.eventService.getEventById(eventId);

    if (!eventResponse) {
      ctx.throw(404, "Event not found");
    }

    ctx.status = 200;
    ctx.body = eventResponse;
  }

  private async getAllEvents(ctx: Context): Promise<void> {
    const { users, status, owner, minTimestamp, maxTimeStamp, sortBy, sortOrder } =
      ctx.query;

    const filters: Record<string, any> = {};

    if (users !== undefined)
      filters.users = users;
    if (owner !== undefined) filters.owner = owner;
    if (status !== undefined) filters.status = status;
    if (minTimestamp !== undefined) filters.minTimestamp = minTimestamp;
    if (maxTimeStamp !== undefined) filters.maxTimeStamp = maxTimeStamp;

    const sorting: Record<string, any> = {};

    if (sortBy !== undefined) sorting.sortBy = sortBy;
    if (sortOrder !== undefined) sorting.sortOrder = sortOrder;

    const events = await this.eventService.getAllEvents(filters, sorting);
    ctx.status = 200;
    ctx.body = events;
  }

  private async updateEvent(ctx: Context): Promise<void> {
    const eventId = ctx.params.id;
    const updateEventRequest = ctx.request.body as UpdateEventRequest;

    const errors = await validate(updateEventRequest);
    if (errors.length > 0) {
      ctx.status = 400;
      ctx.body = { message: "Validation failed", errors };
      return;
    }

    const updatedEvent = await this.eventService.updateEvent(
      eventId,
      updateEventRequest,
    );

    if (!updatedEvent) {
      ctx.throw(404, "Event not found");
    }

    ctx.status = 200;
    ctx.body = updatedEvent;
  }
}
