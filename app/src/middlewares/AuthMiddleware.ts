import type Application from "koa";
import type { Context, Middleware, Next } from "koa";
import jwt from "jsonwebtoken";
import type { User } from "../entities/User.js";
import { AuthenticationUtil } from "../Utils/AuthenticationUtil.js";

export const AuthMiddleware: () => Application.Middleware<
  Application.DefaultState,
  Application.DefaultContext
> = (): Middleware => {
  return async (ctx: Context, next: Next) => {
    const excludedEndpoints: string[] = [];
    if (excludedEndpoints.some((endpoint) => ctx.path.includes(endpoint))) {
      await next();
      return;
    }
    const token: string = ctx.get("Authorization").split(" ")[1];

    if (!token) {
      ctx.status = 401;
      console.log("No token provided");
      return;
    }

    try {
      const user: User | null =
        await AuthenticationUtil.fetchUserWithTokenInfo(token);
      if (!token || !user) {
        ctx.status = 401;
        ctx.body = "401 - unauthorized";
      } else {
        ctx.state.user = user;
        await next();
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        ctx.status = 401;
        return;
      }
    }
  };
};
