export interface RegistrationRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specializationCode: number;
  specializationTitle: string;
  formOfEducation: string;
  groupCode: string;
  department: string;
  course: number;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface HelpRequest {
  email: string;
  firstName: string;
  usersOrganizationName: string;
  currentChapter: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
}

export interface CleanedUser {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}
