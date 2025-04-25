import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { MenteeService } from "../services/MenteeService.js";

export class MenteeController extends Router {
  private readonly menteeService: MenteeService;

  constructor() {
    super({ prefix: "/api/mentees" });
    this.menteeService = new MenteeService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.get(
      "/mentee-requests",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.getMentorMenteeRequests.bind(this),
    );
    this.get(
      "/",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.getYourMentees.bind(this),
    );
    this.post(
      "/mentee-request/:uuid/approve",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.approveMenteeRequest.bind(this),
    );
    this.post(
      "/mentee-request/:uuid/reject",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.rejectMenteeRequest.bind(this),
    );
    this.post(
      "/become-mentee-request",
      AuthMiddleware(),
      this.becomeMentee.bind(this),
    );
  }

  private async getYourMentees(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.getYourMentees(user.uuid);
    ctx.status = 200;
  }

  private async getMentorMenteeRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.getMentorMenteeRequests(user.uuid);
    ctx.status = 200;
  }

  private async approveMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.approveMenteeRequest(
      ctx.params.uuid as string,
      user,
    );
    ctx.status = 200;
  }

  private async rejectMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.rejectMenteeRequest(
      ctx.params.uuid as string,
      user.uuid,
    );
    ctx.status = 200;
  }

  private async becomeMentee(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user;
      if (!user) {
        ctx.throw(401, "Unauthorized");
      }
      console.log(user);
      const { mentorUuid, motivation } = (await ctx.request.body) as {
        mentorUuid: string;
        motivation: string;
      };

      ctx.body = await this.menteeService.becomeMentee(
        user,
        mentorUuid,
        motivation,
      );
      ctx.status = 201;
    } catch (e) {
      console.error(e);
    }
  }
}
