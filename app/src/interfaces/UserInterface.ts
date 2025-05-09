import { FormsOfEducation } from "../enums/UserEnums";

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
