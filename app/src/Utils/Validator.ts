import { z } from "zod";
import type { Request } from "koa";

export const RegistrationRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const BecomeMentorRequestSchema = z.object({
  motivation: z
    .string()
    .min(32, { message: "Motivation should be at least 32 characters long" }),
});

export const UUIDParamSchema = z.object({
  chatId: z.string().uuid({ message: "Invalid chat ID format" }),
});

export const MentorRequestParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid request ID format" }),
});

export type RegistrationRequestBody = z.infer<typeof RegistrationRequestSchema>;

export class Validator {
  public static validateBody(request: Request): void {
    switch (request.url) {
      case "/api/auth/register":
        RegistrationRequestSchema.parse(request.body);
        break;
      case "/api/auth/login":
        LoginRequestSchema.parse(request.body);
        break;
      case "/api/user/become-mentor-request":
        BecomeMentorRequestSchema.parse(request.body);
        break;
      default:
        if (Object.keys(request.body || {}).length > 0) {
          console.warn(`No body validation defined for ${request.url}`);
        }
    }
  }

  public static validateParams(
    url: string,
    params: Record<string, string>,
  ): void {
    const urlPattern = url.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/g,
      "/:id$1",
    );

    console.log(`Validating params for pattern: ${urlPattern}`);

    if (url.match(/^\/api\/chat\/[^/]+$/)) {
      UUIDParamSchema.parse(params);
    } else if (url.match(/^\/api\/chat\/[^/]+\/read$/)) {
      UUIDParamSchema.parse(params);
    } else if (url.match(/^\/api\/auth\/refresh\/[^/]+$/)) {
      console.log("here");
      UUIDParamSchema.parse(params);
    } else if (url.match(/^\/api\/user\/become-mentor-request\/[^/]+$/)) {
      MentorRequestParamSchema.parse(params);
    }
  }
}
