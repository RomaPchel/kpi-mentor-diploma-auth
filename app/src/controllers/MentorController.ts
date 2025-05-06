import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import type {
  MentorRequest,
  RateMentorRequest,
  UpdateMentorRequest,
} from "../interfaces/UserInterface.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { MentorService } from "../services/MentorService.js";

export class MentorController extends Router {
  private readonly mentorService: MentorService;

  constructor() {
    super({ prefix: "/api/mentors" });
    this.mentorService = new MentorService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post("/requests", AuthMiddleware(), this.createRequest.bind(this));

    this.get("/requests", AuthMiddleware(), this.getRequest.bind(this));

    this.get(
      "/requests/all",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllRequests.bind(this),
    );

    this.get("/requests/:id", AuthMiddleware(), this.getRequestById.bind(this));

    this.put(
      "/requests/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.updateRequest.bind(this),
    );

    this.delete(
      "/requests/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.deleteRequest.bind(this),
    );

    this.get("/", AuthMiddleware(), this.getAllMentors.bind(this));
    this.get("/:id", AuthMiddleware(), this.getOneMentor.bind(this));
    this.put("/rate/:id", AuthMiddleware(), this.rateMentor.bind(this));
  }

  private async createRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const request = ctx.request.body as MentorRequest;

    const existingRequest = await this.mentorService.getOneRequestByUser(user);
    if (existingRequest) {
      ctx.throw(400, "You already have a pending request.");
    }

    ctx.body = await this.mentorService.createRequest(
      user,
      request,
    );
    ctx.status = 200;
  }

  private async getRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    ctx.body = await this.mentorService.getOneRequestByUser(user);
    ctx.status = 200;
  }

  private async getAllRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.mentorService.getAllRequests();
    ctx.status = 200;
  }

  private async getRequestById(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const id = ctx.params.id;

    ctx.body = await this.mentorService.getOneRequestById(user, id);
    ctx.status = 200;
  }

  private async updateRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;

    const request = ctx.request.body as UpdateMentorRequest;

    ctx.body = await this.mentorService.updateRequest(id, request);
    ctx.status = 200;
  }

  private async deleteRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;

    await this.mentorService.deleteById(id);
    ctx.status = 200;
  }

  private async getAllMentors(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const {
      name,
      minRating,
      maxRating,
      minReviews,
      maxReviews,
      sortBy,
      sortOrder,
    } = ctx.query;

    const filters: Record<string, any> = {};

    if (name !== undefined) filters.name = name;
    if (minRating !== undefined) filters.minRating = Number(minRating);
    if (maxRating !== undefined) filters.maxRating = Number(maxRating);
    if (minReviews !== undefined) filters.minReviews = Number(minReviews);
    if (maxReviews !== undefined) filters.maxReviews = Number(maxReviews);

    const sorting: Record<string, any> = {};

    if (sortBy !== undefined) sorting.sortBy = sortBy;
    if (sortOrder !== undefined) sorting.sortOrder = sortOrder;

    ctx.body = await this.mentorService.getAllMentors(filters, sorting);
    ctx.status = 200;
  }

  private async getOneMentor(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }
    const uuid = ctx.params.id;
    ctx.body = await this.mentorService.getOneMentor(uuid);
    ctx.status = 200;
  }

  private async rateMentor(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }
    const uuid = ctx.params.uuid;
    const rateRequest = ctx.request.body as RateMentorRequest;

    await this.mentorService.rateMentor(uuid, rateRequest);
    ctx.status = 200;
  }
}
