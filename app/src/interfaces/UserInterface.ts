import type { MentorRequestStatus } from "../enums/UserEnums";

export interface CreateMentorRequest {
  motivation: string;
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
  specializationTitle?: string;
  formOfEducation?: string;
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
  formOfEducation: string;
  groupCode: string;
  department: string;
  interests: string[];
}

export interface BecomeMentorRequestResponse {
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

export interface MentorProfileResponse {
  id: string;
  name: string;
  rating: number;
  totalReviews: number;
}
