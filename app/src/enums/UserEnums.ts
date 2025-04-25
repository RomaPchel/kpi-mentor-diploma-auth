export enum UserRole {
  MENTOR = "mentor",
  STUDENT = "student",
  ADMIN = "admin",
}

export enum FormsOfEducation {
  PART_TIME = "part-time",
  FULL_TIME = "full-time",
}

export enum TokenExpiration {
  ACCESS = 60 * 60,
  REFRESH = 356 * 24 * 60 * 60,
}

export enum MentorRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
