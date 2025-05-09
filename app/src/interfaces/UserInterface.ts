import { FormsOfEducation, type MentorRequestStatus } from "../enums/UserEnums";
import type { Review } from "../entities/MentorReview.js";

export interface CreateMentorRequest {
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

export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  specializationCode?: number;
  specialization?: string;
  formOfEducation?: FormsOfEducation;
  groupCode?: string;
  department?: string;
  interests?: string[];
}

export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio?: string;
  specializationCode: number;
  specializationTitle: string;
  formOfEducation?: string;
  groupCode: string;
  department: string;
  interests: string[];
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

export interface BecomeMenteeRequestResponse {
  uuid: string;
  motivation: string;
  status: MentorRequestStatus;
  createdAt: Date;
  mentee: {
    uuid: string;
    name: string;
    email: string;
    avatar: string;
  };
}

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
