import { match } from "path-to-regexp";
import type { Context } from "koa";
import type { MatchFunction } from "path-to-regexp";
import { ZodSchema } from "zod";
import {
  CreateEventSchema, EventParamSchema,
  LoginRequestSchema,
  RegistrationRequestSchema, UpdateEventSchema
} from "../schemas/ZodSchemas.js";

type SchemaEntry = {
  pattern: string;
  matcher: MatchFunction<Record<string, string>>;
  schema: ZodSchema<any>;
};

const schemaMap: SchemaEntry[] = [
  {
    pattern: "/api/auth/register",
    matcher: match("/api/auth/register", { decode: decodeURIComponent }),
    schema: RegistrationRequestSchema,
  },
  {
    pattern: "/api/auth/login",
    matcher: match("/api/auth/login", { decode: decodeURIComponent }),
    schema: LoginRequestSchema,
  },
  {
    pattern: "/api/events",
    matcher: match("/api/events", { decode: decodeURIComponent }),
    schema: CreateEventSchema,
  },
  {
    pattern: "/api/events/:id",
    matcher: match("/api/events/:id", { decode: decodeURIComponent }),
    schema: EventParamSchema,
  },
  {
    pattern: "/api/events/:id",
    matcher: match("/api/events/:id", { decode: decodeURIComponent }),
    schema: UpdateEventSchema,
  },
];

export class Validator {
  private static findSchema(path: string) {
    for (const entry of schemaMap) {
      const matched = entry.matcher(path);
      if (matched) {
        return { schema: entry.schema, params: matched.params };
      }
    }
    return null;
  }

  public static validateBody(ctx: Context) {
    const path = ctx.request.path;
    const hit = this.findSchema(path);
    if (!hit) {
      throw new Error(`No validation schema defined for URL ${path}`);
    }
    hit.schema.parse((ctx.request as any).body);
  }

  public static validateQuery(ctx: Context) {
    const path = ctx.request.path;
    const hit = this.findSchema(path);
    if (!hit) {
      throw new Error(`No validation schema defined for URL ${path}`);
    }
    hit.schema.parse(ctx.request.query);
  }

  public static validateRequest(ctx: Context) {
    // body for non‑GET
    if (ctx.request.method !== "GET") {
      this.validateBody(ctx);
    }
    // query if any
    if (ctx.request.querystring) {
      this.validateQuery(ctx);
    }
  }
}
