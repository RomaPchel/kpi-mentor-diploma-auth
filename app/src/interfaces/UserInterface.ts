import { FormsOfEducation, type MentorRequestStatus } from "../enums/UserEnums";

export interface MentorRequest {
  motivation: string;
}

export interface RateMentorRequest {
  rating: number;
}

export interface UpdateMentorRequest {
  motivation: string;
  status: MentorRequestStatus;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  specializationCode?: number;
  specializationTitle?: string;
  formOfEducation?: FormsOfEducation;
  groupCode?: string;
  department?: string;
  interests?: string[];
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio?: string;
  specializationCode: number;
  specializationTitle: string;
  formOfEducation: string;
  groupCode: string;
  department: string;
  interests: string[];
}

export interface MentorRequestResponse {
  id: string;
  motivation: string;
  status: MentorRequestStatus;
  createdAt: Date;
  user: {
    uuid: string;
    name: string;
    email: string;
  };
}

export interface MenteeRequestResponse {
  id: string;
  motivation: string;
  status: MentorRequestStatus;
  createdAt: Date;
  user: {
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
}

export interface MenteeRequest {
  mentorId: string;
  motivation: string;
}
