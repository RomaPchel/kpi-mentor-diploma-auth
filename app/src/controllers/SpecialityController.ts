import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { SpecialityService } from "../services/SpecialityService.js";
import { ZodError } from "zod";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";

interface HttpError extends Error {
  status?: number;
}

export class SpecialityController extends Router {
  private readonly specialityService: SpecialityService;

  constructor() {
    super({ prefix: "/api/specialities" });
    this.specialityService = new SpecialityService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.get("/", AuthMiddleware(), this.getAllSpecialities.bind(this));
  }

  private async getAllSpecialities(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }
      const events = await this.specialityService.getAllSpecialities();
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
}
