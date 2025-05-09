import type { Context, Next } from "koa";
import { ZodError } from "zod";
import { Validator } from "../Utils/Validator.js";

export const ValidationMiddleware = () => {
    return async (ctx: Context, next: Next) => {
        try {
            if (ctx.method !== "GET") {
                Validator.validateBody(ctx);
            }
            await next();
        } catch (e) {
            if (e instanceof ZodError) {
                ctx.status = 400;
                ctx.body = {
                    errors: e.errors.map((error) => ({
                        field: error.path.join("."),
                        message: error.message,
                    })),
                };
            } else {
                ctx.status = 500;
                ctx.body = { message: (e as Error).message };
            }
        }
    };
};
