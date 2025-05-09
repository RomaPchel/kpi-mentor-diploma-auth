import type { MentorRequestStatus } from "../enums/UserEnums";

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

export interface CreateMenteeRequest {
  mentorId: string;
  motivation: string;
}