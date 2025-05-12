import type { MentorRequestStatus } from "../enums/UserEnums.js";
import type { Review } from "../entities/MentorReview.js";

export interface MentorProfileResponse {
  uuid: string;
  name: string;
  avatar: string;
  mentorUuid: string;
  email: string;
  interests: string[];
  specialization: string;
  bio: string;
  rating: number;
  totalReviews: number;
  reviews: Review[];
}

export interface BecomeMentorRequestResponse {
  uuid: string;
  motivation: string;
  status: MentorRequestStatus;
  createdAt: Date;
  user: {
    uuid: string;
    avatar: string;
    name: string;
    email: string;
  };
}

export interface RateMentorRequest {
  mentorUuid: string;
  friendliness: number;
  knowledge: number;
  communication: number;
  comment?: string;
}

export interface BecomeMentorRequestBody {
  motivation: string;
}

export interface RateMentorRequest {
  mentorUuid: string;
  friendliness: number;
  knowledge: number;
  communication: number;
  comment?: string;
}

export interface UpdateMentorRequest {
  motivation: string;
  status: MentorRequestStatus;
}
