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
        throw new Error(`No validation defined for ${request.url}`);
    }
  }
}
