import type { MentorRequestStatus } from "../enums/UserEnums";

export interface CreateMenteeRequest {
  mentorId: string;
  motivation: string;
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