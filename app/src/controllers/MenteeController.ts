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
      "/requests",
      AuthMiddleware(),
      this.getMentorMenteeRequests.bind(this),
    );
    this.get(
      "/mentee-request/:uuid",
      AuthMiddleware(),
      this.getMentorMenteeRequest.bind(this),
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
    this.get("/my-mentors", AuthMiddleware(), this.getMyMentors.bind(this));
    this.get(
      "/already-requested/:uuid",
      AuthMiddleware(),
      this.getAlreadyRequested.bind(this),
    );
  }

  private async getMyMentors(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.menteeService.getMentorsForStudent(user);
    ctx.status = 200;
  }

  private async getYourMentees(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.menteeService.getAllMenteesByUser(user.uuid);
    ctx.status = 200;
  }

  private async getMentorMenteeRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.menteeService.getRequestsByUser(user.uuid);
    ctx.status = 200;
  }

  private async getMentorMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    const request = await this.menteeService.getMentorMenteeRequest(
      ctx.params.uuid as string,
      user.uuid,
    );

    console.log("ASDSDASD");
    if (!request) {
      ctx.throw(400, "No request");
    }

    ctx.body = request;
    ctx.status = 200;
  }

  private async getAlreadyRequested(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    const request = await this.menteeService.getAlreadyRequested(
      ctx.params.uuid as string,
      user.uuid,
    );

    console.log(!!request);
    if (!request) {
      ctx.throw(400, "No request");
    }

    ctx.body = request;
    ctx.status = 200;
  }

  private async approveMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    console.log(ctx.params.uuid);
    ctx.body = await this.menteeService.approveRequest(
      ctx.params.uuid as string,
      user,
    );
    ctx.status = 200;
  }

  private async rejectMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.menteeService.rejectRequest(
      ctx.params.uuid as string,
      user.uuid,
    );
    ctx.status = 200;
  }

  private async becomeMentee(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user;

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
