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

export const CreateEventSchema = z.object({
  url: z.string().nonempty({ message: "URL is required" }),
  timestamp: z
    .string()
    .nonempty({ message: "Timestamp is required" })
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "Invalid timestamp format",
    }),
  participants: z
    .array(z.string().uuid({ message: "Invalid participant format" }))
    .min(1, { message: "At least one participant is required" }),
});

export const UpdateEventSchema = z.object({
  url: z.string().uuid({ message: "Invalid url format" }),
  timestamp: z.string().uuid({ message: "Invalid timestamp format" }),
  status: z.string().uuid({ message: "Invalid status format" }),
  participants: z.array(
    z.string().uuid({ message: "Invalid participant format" }),
  ),
});

export const EventParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid request ID format" }),
});
