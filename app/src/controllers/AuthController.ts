import Router from "koa-router";
import type { Context } from "koa";
import type {
  LoginRequestBody,
  RegistrationRequestBody,
} from "../interfaces/AuthInterfaces.js";
import { AuthenticationUtil } from "../Utils/AuthenticationUtil.js";
import type { User } from "../entities/User";

export class AuthController extends Router {
  constructor() {
    super();
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
    console.log(user);
    ctx.body = await AuthenticationUtil.getUserDetails(user.uuid);
    ctx.status = 200;
  }

  private async login(ctx: Context) {
    const body: LoginRequestBody = ctx.request.body as LoginRequestBody;
    console.log(await AuthenticationUtil.login(body));
    ctx.body = await AuthenticationUtil.login(body);
    ctx.status = 200;
  }

  private async refresh(ctx: Context) {
    const { refreshToken } = ctx.params;
    console.log(refreshToken);
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
