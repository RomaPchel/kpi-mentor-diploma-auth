import type { MatchFunction } from "path-to-regexp";
import { match } from "path-to-regexp";
import type { Context } from "koa";
import { ZodSchema } from "zod";
import {
  BecomeMentorRequestIdSchema,
  CreateBecomeMentorRequestSchema,
  CreateEventSchema,
  EventIdSchema,
  GetAllEventsQuerySchema, GetAllMentorsQuerySchema,
  LoginRequestSchema, MentorIdSchema, RateMentorSchema,
  RegistrationRequestSchema, UpdateBecomeMentorRequestSchema,
  UpdateEventSchema,
  UpdateUserSchema
} from "../schemas/ZodSchemas.js";

type SchemaEntry = {
  method: string;
  pattern: string;
  matcher: MatchFunction<Record<string, string>>;
  schema: ZodSchema<any>;
  validate: "body" | "query" | "path";
};

const schemaMap: SchemaEntry[] = [
  {
    method: "POST",
    pattern: "/api/auth/register",
    matcher: match("/api/auth/register", { decode: decodeURIComponent }),
    schema: RegistrationRequestSchema,
    validate: "body",
  },
  {
    method: "POST",
    pattern: "/api/auth/login",
    matcher: match("/api/auth/login", { decode: decodeURIComponent }),
    schema: LoginRequestSchema,
    validate: "body",
  },
  {
    method: "POST",
    pattern: "/api/events",
    matcher: match("/api/events", { decode: decodeURIComponent }),
    schema: CreateEventSchema,
    validate: "body",
  },
  {
    method: "PUT",
    pattern: "/api/events/:id",
    matcher: match("/api/events/:id", { decode: decodeURIComponent }),
    schema: UpdateEventSchema,
    validate: "body",
  },
  {
    method: "PUT",
    pattern: "/api/events/:id",
    matcher: match("/api/events/:id", { decode: decodeURIComponent }),
    schema: EventIdSchema,
    validate: "path",
  },
  {
    method: "GET",
    pattern: "/api/events/:id",
    matcher: match("/api/events/:id", { decode: decodeURIComponent }),
    schema: EventIdSchema,
    validate: "path",
  },
  {
    method: "GET",
    pattern: "/api/events",
    matcher: match("/api/events", { decode: decodeURIComponent }),
    schema: GetAllEventsQuerySchema,
    validate: "query",
  },
  {
    method: "PUT",
    pattern: "/api/users",
    matcher: match("/api/users", { decode: decodeURIComponent }),
    schema: UpdateUserSchema,
    validate: "body",
  },
  {
    method: "POST",
    pattern: "/api/mentors/requests",
    matcher: match("api/mentors/requests", { decode: decodeURIComponent }),
    schema: CreateBecomeMentorRequestSchema,
    validate: "body",
  },
  {
    method: "GET",
    pattern: "/api/mentors/requests/:id",
    matcher: match("api/mentors/requests/:id", { decode: decodeURIComponent }),
    schema: BecomeMentorRequestIdSchema,
    validate: "path",
  },
  {
    method: "PUT",
    pattern: "/api/mentors/requests/:id",
    matcher: match("api/mentors/requests/:id", { decode: decodeURIComponent }),
    schema: BecomeMentorRequestIdSchema,
    validate: "path",
  },
  {
    method: "PUT",
    pattern: "/api/mentors/requests/:id",
    matcher: match("api/mentors/requests/:id", { decode: decodeURIComponent }),
    schema: UpdateBecomeMentorRequestSchema,
    validate: "body",
  },
  {
    method: "DELETE",
    pattern: "/api/mentors/requests/:id",
    matcher: match("api/mentors/requests/:id", { decode: decodeURIComponent }),
    schema: BecomeMentorRequestIdSchema,
    validate: "path",
  },
  {
    method: "GET",
    pattern: "/api/mentors",
    matcher: match("api/mentors", { decode: decodeURIComponent }),
    schema: GetAllMentorsQuerySchema,
    validate: "query",
  },
  {
    method: "GET",
    pattern: "/api/mentors/:id",
    matcher: match("api/mentors/:id", { decode: decodeURIComponent }),
    schema: MentorIdSchema,
    validate: "path",
  },
  {
    method: "PUT",
    pattern: "/api/mentors/rate/:id",
    matcher: match("api/mentors/rate/:id", { decode: decodeURIComponent }),
    schema: RateMentorSchema,
    validate: "body",
  },
];

export class Validator {
  private static findSchema(
    path: string,
    method: string,
    validate: "body" | "query" | "path",
  ) {
    for (const entry of schemaMap) {
      if (entry.method === method && entry.validate === validate) {
        const matched = entry.matcher(path);
        if (matched) {
          return { schema: entry.schema, params: matched.params };
        }
      }
    }
    return null;
  }

  public static validateBody(ctx: Context) {
    const path = ctx.request.path;
    const hit = this.findSchema(path, ctx.request.method, "body");
    if (!hit) {
      return;
    }
    hit.schema.parse((ctx.request as any).body);
  }

  public static validateQuery(ctx: Context) {
    const path = ctx.request.path;
    const hit = this.findSchema(path, ctx.request.method, "query");
    if (!hit) {
      return;
    }
    console.log(ctx.request.query);
    hit.schema.parse(ctx.request.query);
  }

  public static validatePathParams(ctx: Context) {
    const path = ctx.request.path;
    const hit = this.findSchema(path, ctx.request.method, "path");
    if (!hit) {
      return;
    }
    hit.schema.parse(hit.params);
  }

  public static validateRequest(ctx: Context) {
    this.validatePathParams(ctx);
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
