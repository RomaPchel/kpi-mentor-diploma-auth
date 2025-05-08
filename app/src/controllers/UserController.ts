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
    this.put("/", AuthMiddleware(), this.updateUser.bind(this));
    this.get("/", AuthMiddleware(), this.getAllUsers.bind(this));
  }

  private async updateUser(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      const data = ctx.request.body as UserUpdateRequest;

      ctx.body = await this.userService.updateUser(user, data);
      ctx.status = 201;
    } catch (e) {
      console.error(e);
    }
  }

  private async getAllUsers(ctx: Context): Promise<void> {
    const users = await this.userService.getAllUsers();
    ctx.status = 200;
    ctx.body = users;
  }
}
