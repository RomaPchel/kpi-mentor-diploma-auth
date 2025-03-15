import type { Context, Next } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";

export function roleMiddleware(requiredRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (ctx: Context, next: Next) => {
    const user: User | undefined = ctx.state.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = { message: "Unauthorized" };
      return;
    }

    if (!roles.includes(user.role)) {
      ctx.status = 403;
      ctx.body = { message: "Forbidden: insufficient permissions" };
      return;
    }
    await next();
  };
}
