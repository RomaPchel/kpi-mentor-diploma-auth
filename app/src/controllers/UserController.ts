import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import type {
  CreateMentorRequest,
  UpdateMentorRequest,
  UserProfileUpdateRequest,
} from "../interfaces/UserInterface.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { UserService } from "../services/UserService.js";

export class UserController extends Router {
  private readonly userService: UserService;

  constructor() {
    super({ prefix: "/api/user" });
    this.userService = new UserService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post(
      "/become-mentor-request",
      AuthMiddleware(),
      this.createBecomeMentorRequest.bind(this),
    );

    this.put("/profile", AuthMiddleware(), this.updateUserInfo);

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
      this.getBecomeMentorRequestById.bind(this),
    );

    this.get("/mentors", AuthMiddleware(), this.getAllMentors);
  }

  private async updateUserInfo(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      const data = ctx.request.body as UserProfileUpdateRequest;

      ctx.body = await this.userService.updateUserProfile(user, data);
      ctx.status = 201;
    } catch (e) {
      console.error(e);
    }
  }

  private async createBecomeMentorRequest(ctx: Context): Promise<void> {
      const user: User = ctx.state.user as User;

      const motivation = ctx.request.body as CreateMentorRequest;

      const existingRequest =
        await this.userService.getOwnBecomeMentorRequest(user);
      if (existingRequest) {
        ctx.throw(400, "You already have a pending request.");
      }

      ctx.body = await this.userService.createBecomeMentorRequest(
        user,
        motivation,
      );
      ctx.status = 200;
  }

  private async getOwnBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    ctx.body = await this.userService.getOwnBecomeMentorRequest(user);
    ctx.status = 200;
  }

  private async getAllBecomeMentorRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.userService.getAllBecomeMentorRequests();
    ctx.status = 200;
  }

  private async getBecomeMentorRequestById(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const id = ctx.params.id;

    ctx.body = await this.userService.getBecomeMentorRequestById(user, id);
    ctx.status = 200;
  }

  private async updateBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;

    const request = ctx.request.body as UpdateMentorRequest;

    ctx.body = await this.userService.updateBecomeMentorRequest(id, request);
    ctx.status = 200;
  }

  private async deleteBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;
    const request = await this.userService.getBecomeMentorRequestById(user, id);
    if (!request) {
      ctx.throw(404, "Mentor request not found.");
    }
    await this.userService.deleteById(id);
    ctx.status = 200;
  }

  private async getAllMentors(ctx: Context): Promise<void> {
    console.log("ffrf")

    ctx.body = this.userService.getAllMentors();
    ctx.status = 200;
  }
}
