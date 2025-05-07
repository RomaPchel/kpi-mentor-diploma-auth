import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { MenteeService } from "../services/MenteeService.js";
import { CreateMenteeRequest } from "../interfaces/MenteeInterfaces.js";

export class MenteeController extends Router {
  private readonly menteeService: MenteeService;

  constructor() {
    super({ prefix: "/api/mentees" });
    this.menteeService = new MenteeService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.get(
      "/",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.getMenteesByUser.bind(this),
    );
    this.get(
      "/requests",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.getRequests.bind(this),
    );
    this.post(
      "/requests/:id/approve",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.approveRequest.bind(this),
    );
    this.post(
      "/requests/:id/reject",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.rejectRequest.bind(this),
    );
    this.post("/requests", AuthMiddleware(), this.createRequest.bind(this));
    this.get("/requests/:id", AuthMiddleware(), this.getRequest.bind(this));
  }

  private async getMenteesByUser(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.getAllMenteesByUser(user.uuid);
    ctx.status = 200;
  }

  private async getRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.getAllRequestsByUser(user.uuid);
    ctx.status = 200;
  }

  private async approveRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.approveRequest(
      ctx.params.id as string,
      user,
    );
    ctx.status = 200;
  }

  private async getRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    const request = await this.menteeService.getRequestByMentorAndUser(
      ctx.params.id as string,
      user.uuid,
    );

    if (!request) {
      ctx.throw(400, "No request");
    }

    ctx.body = request;
    ctx.status = 200;
  }

  private async rejectRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.menteeService.rejectRequest(
      ctx.params.id as string,
      user.uuid,
    );
    ctx.status = 200;
  }

  private async createRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const request = ctx.request.body as CreateMenteeRequest;

    ctx.body = await this.menteeService.createRequest(user, request);
    ctx.status = 201;
  }
}
