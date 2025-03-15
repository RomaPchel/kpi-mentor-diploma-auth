import Router from "koa-router";
import type { Context } from "koa";
import type {
  LoginRequestBody,
  RegistrationRequestBody,
} from "../interfaces/AuthInterfaces.js";
import { AuthenticationUtil } from "../Utils/AuthenticationUtil.js";
import type { User } from "../entities/User.js";

export class AuthController extends Router {
  constructor() {
    super({ prefix: "/api/auth" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post("/login", this.login);
    this.post("/register", this.registration);
    this.get("/me", this.me);
    this.get("/refresh", this.refresh);
  }

  private async me(ctx: Context) {
    const user: User = ctx.state.user as User;

    ctx.body = await AuthenticationUtil.convertPersistedToUser(user);
    ctx.status = 200;
  }

  private async login(ctx: Context) {
    const body: LoginRequestBody = ctx.request.body as LoginRequestBody;
    ctx.body = await AuthenticationUtil.login(body);
    ctx.status = 200;
  }

  private async refresh(ctx: Context) {
    const { refreshToken } = ctx.params;

    const token: string | false | null =
      await AuthenticationUtil.verifyRefreshToken(refreshToken);
    ctx.body = { accessToken: token };
    ctx.status = 200;
  }

  private async registration(ctx: Context) {
    const body: RegistrationRequestBody = ctx.request
      .body as RegistrationRequestBody;

    await AuthenticationUtil.register(body);

    ctx.body = "Success";
    ctx.status = 201;
  }
}
