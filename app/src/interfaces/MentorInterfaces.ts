import { ReviewResponse } from "./ReviewInterfaces";
import type { MentorRequestStatus } from "../enums/UserEnums";

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
  reviews: ReviewResponse[];
  avgFriendliness: number;
  avgKnowledge: number;
  avgCommunication: number;
}

export interface MentorRequestResponse {
  id: string;
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