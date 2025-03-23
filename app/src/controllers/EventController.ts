import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { validate } from "class-validator";
import EventService from "../services/EventService.js";
import type { CreateEventRequest } from "../requests/CreateEventRequest.js";
import { ZodError } from "zod";
import type { UpdateEventRequest } from "../requests/UpdateEventRequest.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";

interface HttpError extends Error {
  status?: number;
}

export class EventController extends Router {
  constructor() {
    super({ prefix: "/api/events" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post("/create", AuthMiddleware(), this.createEvent);
    this.get("/:id", AuthMiddleware(), this.getEvent);
    this.get("/", AuthMiddleware(), this.getAllEvents);
    this.put("/:id", AuthMiddleware(), this.updateEvent);
  }

  private async createEvent(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const createEventRequest = ctx.request.body as CreateEventRequest;

      const errors = await validate(createEventRequest);
      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = { message: "Validation failed", errors };
        return;
      }

      const eventResponse = await EventService.createEvent(
        createEventRequest,
        user,
      );

      ctx.status = 201;
      ctx.body = eventResponse;
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status ?? 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getEvent(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }
      const eventId = ctx.params.id;
      const eventResponse = await EventService.getEventById(eventId);

      if (!eventResponse) {
        ctx.throw(404, "Event not found");
      }

      ctx.status = 200;
      ctx.body = eventResponse;
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status ?? 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getAllEvents(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }
      const events = await EventService.getAllEvents();
      ctx.status = 200;
      ctx.body = events;
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status ?? 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async updateEvent(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const eventId = ctx.params.id;
      const updateEventRequest = ctx.request.body as UpdateEventRequest;

      const errors = await validate(updateEventRequest);
      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = { message: "Validation failed", errors };
        return;
      }

      const updatedEvent = await EventService.updateEvent(
        eventId,
        updateEventRequest,
      );

      if (!updatedEvent) {
        ctx.throw(404, "Event not found");
      }

      ctx.status = 200;
      ctx.body = updatedEvent;
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status ?? 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }
}
