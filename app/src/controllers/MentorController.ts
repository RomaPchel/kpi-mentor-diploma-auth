import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import type {
  CreateMentorRequest,
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
    this.post(
      "/become-mentor-request",
      AuthMiddleware(),
      this.createBecomeMentorRequest.bind(this),
    );

    this.get(
      "/become-mentor-request",
      AuthMiddleware(),
      this.getOwnBecomeMentorRequest.bind(this),
    );

    this.get(
      "/become-mentor-request/all",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllBecomeMentorRequests.bind(this),
    );

    this.get(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      this.getBecomeMentorRequestById.bind(this),
    );

    this.put(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.updateBecomeMentorRequest.bind(this),
    );

    this.delete(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.deleteBecomeMentorRequest.bind(this),
    );

    this.get("/", AuthMiddleware(), this.getAllMentors.bind(this));
    this.get("/:uuid", AuthMiddleware(), this.getOneMentor.bind(this));
    this.put("/:uuid", AuthMiddleware(), this.rateMentor.bind(this));
  }

  private async createBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const motivation = ctx.request.body as CreateMentorRequest;

    const existingRequest =
      await this.mentorService.getOneRequestByUser(user);
    if (existingRequest) {
      ctx.throw(400, "You already have a pending request.");
    }

    ctx.body = await this.mentorService.createBecomeMentorRequest(
      user,
      motivation,
    );
    ctx.status = 200;
  }

  private async getOwnBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    ctx.body = await this.mentorService.getOneRequestByUser(user);
    ctx.status = 200;
  }

  private async getAllBecomeMentorRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.mentorService.getAllRequests();
    ctx.status = 200;
  }

  private async getBecomeMentorRequestById(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const id = ctx.params.id;

    ctx.body = await this.mentorService.getOneRequestById(user, id);
    ctx.status = 200;
  }

  private async updateBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;

    const request = ctx.request.body as UpdateMentorRequest;

    ctx.body = await this.mentorService.updateRequest(id, request);
    ctx.status = 200;
  }

  private async deleteBecomeMentorRequest(ctx: Context): Promise<void> {
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
    const uuid = ctx.params.uuid;
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
