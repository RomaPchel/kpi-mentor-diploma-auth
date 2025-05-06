import { FormsOfEducation } from "../enums/UserEnums";

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  specialization?: string;
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
  specialization: string;
  formOfEducation?: string;
  groupCode: string;
  department: string;
  interests: string[];
}
