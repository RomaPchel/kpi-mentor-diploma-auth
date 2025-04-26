import { em } from "../db/config.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorProfile } from "../entities/MentorProfile.js";

export class MentorRepository {
  async findBecomeMentorRequestByUser(userUuid: string) {
    return em.findOne(BecomeMentorRequest, { user: userUuid });
  }

  async findBecomeMentorRequestById(id: string) {
    return em.findOne(
      BecomeMentorRequest,
      { uuid: id },
      { populate: ["user"] },
    );
  }

  async findAllBecomeMentorRequests() {
    return em.find(BecomeMentorRequest, {}, { populate: ["user"] });
  }

  async saveBecomeMentorRequest(request: BecomeMentorRequest) {
    await em.persistAndFlush(request);
  }

  async removeBecomeMentorRequest(request: BecomeMentorRequest) {
    await em.removeAndFlush(request);
  }

  async saveMentorProfile(profile: MentorProfile) {
    await em.persistAndFlush(profile);
  }

  async findAllMentorProfiles(where: any) {
    return em.find(MentorProfile, where, { populate: ["mentor"] });
  }

  async findMentorProfileById(uuid: string) {
    return em.findOne(MentorProfile, { uuid }, { populate: ["mentor"] });
  }
}
