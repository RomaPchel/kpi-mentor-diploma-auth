import { z } from "zod";
import { EventStatus } from "../enums/EventEnums.js";

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
  url: z
    .string()
    .optional()
    .refine((value) => value !== undefined && value !== null && value !== "", {
      message: "URL_CAN_NOT_BE_EMPTY",
    }),
  timestamp: z
    .string()
    .optional()
    .refine((value) => value !== undefined && value !== null && value !== "", {
      message: "TIMESTAMP_CAN_NOT_BE_EMPTY",
    })
    .refine((value) => value !== undefined && /^\d{13}$/.test(value), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    })
    .refine((value) => !isNaN(Number(value)), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    }),
  participants: z
    .array(
      z
        .string()
        .uuid({ message: "PARTICIPANT_MUST_BE_VALID" })
        .optional()
        .refine(
          (value) => value !== undefined && value !== null && value !== "",
          {
            message: "PARTICIPANT_CAN_NOT_BE_EMPTY",
          },
        ),
    )
    .min(1, { message: "PARTICIPANTS_CAN_NOT_BE_EMPTY" })
    .optional()
    .refine(
      (value) => value !== undefined && value !== null && value.length > 0,
      {
        message: "PARTICIPANTS_CAN_NOT_BE_EMPTY",
      },
    ),
});

export const UpdateEventSchema = z.object({
  url: z
    .string()
    .optional()
    .refine((value) => value !== undefined && value !== null && value !== "", {
      message: "URL_CAN_NOT_BE_EMPTY",
    }),
  timestamp: z
    .string()
    .refine((value) => /^\d{13}$/.test(value), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    })
    .refine((value) => !isNaN(Number(value)), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    })
    .optional(),
  status: z
    .nativeEnum(EventStatus, {
      errorMap: () => {
        return { message: "STATUS_MUST_BE_VALID" };
      },
    })
    .optional(),
  participants: z
    .array(z.string().uuid({ message: "PARTICIPANT_MUST_BE_VALID" }))
    .optional(),
});

export const EventIdSchema = z.object({
  id: z.string().uuid({ message: "ID_MUST_BE_VALID" }),
});

export const GetAllEventsQuerySchema = z.object({
  status: z
    .nativeEnum(EventStatus, {
      errorMap: () => {
        return { message: "STATUS_MUST_BE_VALID" };
      },
    })
    .optional(),
  minTimestamp: z
    .string()
    .refine((value) => /^\d{13}$/.test(value), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    })
    .optional(),
  maxTimeStamp: z
    .string()
    .refine((value) => /^\d{13}$/.test(value), {
      message: "TIMESTAMP_MUST_BE_A_VALID",
    })
    .optional(),
  sortBy: z
    .string()
    .refine((value) => value && value !== "status", {
      message: "SORT_BY_MUST_BE_VALID",
    })
    .optional(),
  sortOrder: z
    .string()
    .refine((value) => value && value !== "asc" && value !== "desc", {
      message: "SORT_ORDER_MUST_BE_VALID",
    })
    .optional(),
});
