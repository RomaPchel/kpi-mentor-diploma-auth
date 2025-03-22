import Router from "koa-router";
import type { Context } from "koa";
import type {
  LoginRequestBody,
  RegistrationRequestBody,
} from "../interfaces/AuthInterfaces.js";
import { AuthenticationUtil } from "../Utils/AuthenticationUtil.js";
import type { User } from "../entities/User.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";

export class AuthController extends Router {
  constructor() {
    super({ prefix: "/api/auth" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post("/login", this.login);
    this.post("/register", this.registration);
    this.get("/me", AuthMiddleware(), this.me);
    this.get("/refresh/:refreshToken", this.refresh);
  }

  private async me(ctx: Context) {
    const user: User = ctx.state.user as User;

    ctx.body = await AuthenticationUtil.convertPersistedToUser(user);
    ctx.status = 200;
  }

  private async login(ctx: Context) {
    console.log(ctx.request.body);
    const body: LoginRequestBody = ctx.request.body as LoginRequestBody;
    ctx.body = await AuthenticationUtil.login(body);
    ctx.status = 200;
  }

  private async refresh(ctx: Context) {
    console.log("Refreshing user...");
    try {
      const { refreshToken } = ctx.params;

      const token: string | false | null =
        await AuthenticationUtil.verifyRefreshToken(refreshToken);
      ctx.body = { accessToken: token };
      ctx.status = 200;
    } catch (e) {
      console.error(e);
    }
  }

  private async registration(ctx: Context) {
    const body: RegistrationRequestBody = ctx.request
      .body as RegistrationRequestBody;

    await AuthenticationUtil.register(body);

    ctx.body = "Success";
    ctx.status = 201;
  }
}
