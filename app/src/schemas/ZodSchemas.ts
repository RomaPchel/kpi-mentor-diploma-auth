import { z } from "zod";

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
