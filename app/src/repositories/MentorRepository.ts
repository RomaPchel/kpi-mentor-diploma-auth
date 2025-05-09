import { em } from "../db/config.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorProfile } from "../entities/MentorProfile.js";
import { User } from "../entities/User.js";
import { MentorStudent } from "../entities/StudentMentor.js";

export class MentorRepository {
  async findRequestByUser(userUuid: string) {
    return em.findOne(BecomeMentorRequest, { user: userUuid });
  }

  async findRequestById(id: string) {
    return em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
  }

  async findMentorProfileByUser(user: User) {
    return em.findOne(MentorProfile, {
      mentor: user,
    })
  }

  async findMentorStudentsByUser(user: User) {
    return em.find(MentorStudent, {
      mentor: user,
    })
  }

  async findAllRequests() {
    return em.find(BecomeMentorRequest, {}, { populate: ["user"] });
  }

  async saveRequest(request: BecomeMentorRequest) {
    await em.persistAndFlush(request);
  }

  async removeRequest(request: BecomeMentorRequest) {
    await em.removeAndFlush(request);
  }

  async saveMentorProfile(profile: MentorProfile) {
    await em.persistAndFlush(profile);
  }

  async saveMentorStudent(mentorStudent: MentorStudent) {
    await em.persistAndFlush(mentorStudent);
  }

  async findAllMentorProfiles(where: any) {
    return await em.find(MentorProfile, where, { populate: ["mentor", "reviews.reviewer"] });
  }

  async findMentorProfileById(uuid: string) {
    return em.findOne(MentorProfile, { uuid }, { populate: ["mentor"] });
  }
}
