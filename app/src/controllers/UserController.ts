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
      this.deleteBecomeMentorRequest.bind(this),
    );

    this.get("/mentors", AuthMiddleware(), this.getAllMentors.bind(this));
    this.get(
      "/mentee-request/:uuid",
      AuthMiddleware(),
      this.getYourMenteeRequest.bind(this),
    );
    this.get(
      "/mentee-requests",
      AuthMiddleware(),
      roleMiddleware(UserRole.MENTOR),
      this.getMentorMenteeRequests.bind(this),
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
    this.get("/mentors/:uuid", AuthMiddleware(), this.getOneMentor.bind(this));
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

    await this.userService.deleteById(id);
    ctx.status = 200;
  }

  private async getAllMentors(ctx: Context): Promise<void> {
    ctx.body = await this.userService.getAllMentors();
    ctx.status = 200;
  }

  private async getYourMenteeRequest(ctx: Context): Promise<void> {
    const mentorUuid = ctx.params.uuid as string;
    const user: User = ctx.state.user;

    ctx.body = await this.userService.getYourMenteeRequest(
      mentorUuid,
      user.uuid,
    );
    ctx.status = 200;
  }

  private async getMentorMenteeRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.userService.getMentorMenteeRequests(user.uuid);
    ctx.status = 200;
  }

  private async approveMenteeRequest(ctx: Context): Promise<void> {
    const mentor: User = ctx.state.user;

    ctx.body = await this.userService.approveMenteeRequest(
      ctx.params.uuid as string,
      mentor,
    );
    ctx.status = 200;
  }

  private async rejectMenteeRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    ctx.body = await this.userService.rejectMenteeRequest(
      ctx.params.uuid as string,
      user.uuid,
    );
    ctx.status = 200;
  }

  private async becomeMentee(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user;
      console.log(user);
      const { mentorUuid, motivation } = (await ctx.request.body) as {
        mentorUuid: string;
        motivation: string;
      };

      ctx.body = await this.userService.becomeMentee(
        user,
        mentorUuid,
        motivation,
      );
      ctx.status = 201;
    } catch (e) {
      console.error(e);
    }
  }

  private async getOneMentor(ctx: Context): Promise<void> {
    const uuid = ctx.params.uuid;

    ctx.body = await this.userService.getOneMentor(uuid);
    ctx.status = 200;
  }
}
