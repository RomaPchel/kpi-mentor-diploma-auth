import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import type { BecomeMentorApiRequest } from "../interfaces/UserInterface.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { em } from "../db/config.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { ZodError } from "zod";

interface HttpError extends Error {
  status?: number;
}

export class UserController extends Router {
  constructor() {
    super({ prefix: "/api/user" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post(
      "/become-mentor-request",
      AuthMiddleware(),
      this.createBecomeMentorRequest,
    );

    this.get(
      "/become-mentor-request",
      AuthMiddleware(),
      this.getOwnBecomeMentorRequest,
    );

    this.get(
      "/become-mentor-request/all",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllBecomeMentorRequests,
    );

    this.get(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      this.getBecomeMentorRequestById,
    );

    this.put(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.updateBecomeMentorRequest,
    );

    this.delete(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.deleteBecomeMentorRequest,
    );
  }

  private async createBecomeMentorRequest(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const { motivation } = ctx.request.body as BecomeMentorApiRequest;

      const existingRequest = await em.findOne(BecomeMentorRequest, {
        user: user.uuid,
      });
      if (existingRequest) {
        ctx.throw(400, "You already have a pending request.");
      }

      const request = new BecomeMentorRequest();
      request.user = user;
      request.motivation = motivation;
      request.status = MentorRequestStatus.PENDING;

      await em.persistAndFlush(request);

      ctx.status = 201;
      ctx.body = { message: "Become mentor request submitted successfully." };
    } catch (e: unknown) {
      console.error("Error in createBecomeMentorRequest:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getOwnBecomeMentorRequest(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const request = await em.findOne(BecomeMentorRequest, {
        user: user.uuid,
      });
      if (!request) {
        ctx.status = 404;
        ctx.body = { message: "No mentor request found for this user." };
        return;
      }
      ctx.body = request;
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in getOwnBecomeMentorRequest:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getAllBecomeMentorRequests(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      ctx.body = await em.find(BecomeMentorRequest, {});
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in getAllBecomeMentorRequests:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async getBecomeMentorRequestById(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }
      const id = ctx.params.id;
      const request = await em.findOne(BecomeMentorRequest, { uuid: id });
      if (!request) {
        ctx.status = 404;
        ctx.body = { message: "Mentor request not found." };
        return;
      }
      if (user.role !== UserRole.ADMIN && request.user.uuid !== user.uuid) {
        ctx.throw(403, "Forbidden");
      }
      ctx.body = request;
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in getBecomeMentorRequestById:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async updateBecomeMentorRequest(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const id = ctx.params.id;
      const { status, motivation } = ctx.request.body as Partial<{
        status: MentorRequestStatus;
        motivation: string;
      }>;
      const request = await em.findOne(BecomeMentorRequest, { uuid: id });
      if (!request) {
        ctx.throw(404, "Mentor request not found.");
      }
      if (status) {
        request.status = status;
      }
      if (motivation) {
        request.motivation = motivation;
      }
      await em.persistAndFlush(request);
      ctx.body = { message: "Mentor request updated successfully.", request };
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in updateBecomeMentorRequest:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }

  private async deleteBecomeMentorRequest(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }

      const id = ctx.params.id;
      const request = await em.findOne(BecomeMentorRequest, { uuid: id });
      if (!request) {
        ctx.throw(404, "Mentor request not found.");
      }
      await em.removeAndFlush(request);
      ctx.body = { message: "Mentor request deleted successfully." };
      ctx.status = 200;
    } catch (e: unknown) {
      console.error("Error in deleteBecomeMentorRequest:", e);
      if (e instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          error: "Validation error",
          details: e.errors,
        };
      } else {
        const error = e as HttpError;
        ctx.status = error.status || 500;
        ctx.body = { error: error.message || "Internal server error" };
      }
    }
  }
}
