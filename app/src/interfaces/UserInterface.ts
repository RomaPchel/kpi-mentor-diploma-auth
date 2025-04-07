export interface BecomeMentorApiRequest {
  motivation: string;
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
