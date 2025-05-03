import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import type { UserUpdateRequest } from "../interfaces/UserInterface.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { UserService } from "../services/UserService.js";

export class UserController extends Router {
  private readonly userService: UserService;

  constructor() {
    super({ prefix: "/api/users" });
    this.userService = new UserService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.put("/", AuthMiddleware(), this.updateUserInfo);
  }

  private async updateUserInfo(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      const data = ctx.request.body as UserUpdateRequest;

      ctx.body = await this.userService.updateUser(user, data);
      ctx.status = 201;
    } catch (e) {
      console.error(e);
    }
  }
}
