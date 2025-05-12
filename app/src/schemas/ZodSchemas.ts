import { z } from "zod";
import { EventStatus } from "../enums/EventEnums.js";
import { FormsOfEducation, MentorRequestStatus } from "../enums/UserEnums.js";

export const RegistrationRequestSchema = z.object({
  email: z.string().email({ message: "EMAIL_MUST_BE_VALID" }),
  password: z
    .string()
    .min(8, { message: "PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_LONG" }),
});

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "EMAIL_MUST_BE_VALID" }),
  password: z
    .string()
    .min(8, { message: "PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_LONG" }),
});

export const RateMentorSchema = z.object({
  friendliness: z.number().refine((val) => !isNaN(Number(val)), {
    message: "RATING_MUST_BE_VALID",
  }),
  knowledge: z.number().refine((val) => !isNaN(Number(val)), {
    message: "RATING_MUST_BE_VALID",
  }),
  communication: z.number().refine((val) => !isNaN(Number(val)), {
    message: "RATING_MUST_BE_VALID",
  }),
  message: z
    .string()
    .min(20, { message: "MESSAGE_SHOULD_BE_AT_LEAST_20_CHARACTERS_LONG" }),
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
    .optional(),
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
      message: "MIN_TIMESTAMP_MUST_BE_VALID",
    })
    .optional(),
  maxTimestamp: z
    .string()
    .refine((value) => /^\d{13}$/.test(value), {
      message: "MAX_TIMESTAMP_MUST_BE_VALID",
    })
    .optional(),
  sortBy: z
    .string()
    .refine((value) => value && value === "status", {
      message: "SORT_BY_MUST_BE_VALID",
    })
    .optional(),
  sortOrder: z
    .string()
    .refine((value) => (value && value === "asc") || value === "desc", {
      message: "SORT_ORDER_MUST_BE_VALID",
    })
    .optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, "FIRST_NAME_CANNOT_BE_EMPTY").optional(),
  lastName: z.string().min(1, "LAST_NAME_CANNOT_BE_EMPTY").optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().min(1, "AVATAR_CANNOT_BE_EMPTY").optional(),
  bio: z.string().min(1, "BIO_CANNOT_BE_EMPTY").optional(),
  specializationCode: z.number().optional(),
  specializationTitle: z
    .string()
    .min(1, "SPECIALIZATION_TITLE_CANNOT_BE_EMPTY")
    .optional(),
  formOfEducation: z.nativeEnum(FormsOfEducation).optional(),
  groupCode: z.string().min(1, "GROUP_CODE_CANNOT_BE_EMPTY").optional(),
  department: z.string().min(1, "DEPARTMENT_CANNOT_BE_EMPTY").optional(),
  interests: z
    .array(z.string().min(1, "INTEREST_CANNOT_BE_EMPTY"))
    .optional()
    .refine((arr) => arr === undefined || arr.length > 0, {
      message: "INTERESTS_CANNOT_BE_EMPTY",
    }),
});

export const CreateMentorRequestSchema = z.object({
  motivation: z.string().min(1, "MOTIVATION_CANNOT_BE_EMPTY").optional(),
});

export const MentorRequestIdSchema = z.object({
  id: z.string().uuid({ message: "ID_MUST_BE_VALID" }),
});

export const UpdateMentorRequestSchema = z.object({
  motivation: z.string().min(1, "MOTIVATION_CANNOT_BE_EMPTY").optional(),
  status: z.nativeEnum(MentorRequestStatus).optional(),
});

export const GetAllMentorsQuerySchema = z.object({
  name: z.string().optional(),
  minRating: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "MIN_RATING_MUST_VALID",
    })
    .optional(),
  maxRating: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "MAX_RATING_MUST_VALID",
    })
    .optional(),
  minReviews: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "MIN_REVIEWS_MUST_VALID",
    })
    .optional(),
  maxReviews: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "MAX_REVIEWS_MUST_VALID",
    })
    .optional(),
  sortBy: z
    .string()
    .refine((val) => ["name", "rating", "reviews"].includes(val), {
      message: "SORT_BY_MUST_BE_VALID",
    })
    .optional(),
  sortOrder: z
    .string()
    .refine((val) => val === "asc" || val === "desc", {
      message: "SORT_ORDER_MUST_BE_VALID",
    })
    .optional(),
});

export const MentorIdSchema = z.object({
  id: z.string().uuid({ message: "ID_MUST_BE_VALID" }),
});

export const MenteeRequestIdSchema = z.object({
  id: z.string().uuid({ message: "ID_MUST_BE_VALID" }),
});

export const CreateMenteeRequestSchema = z.object({
  motivation: z.string().min(1, "MOTIVATION_CANNOT_BE_EMPTY").optional(),
  mentorId: z.string().uuid({ message: "MENTOR_ID_MUST_BE_VALID" }),
});
