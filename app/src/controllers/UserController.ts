import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { BecomeMentorRequest } from "../entities/BecomeMentorRequest.js";
import { MentorRequestStatus, UserRole } from "../enums/UserEnums.js";
import type {
  BecomeMentorApiRequest,
  UserProfileUpdateRequest,
} from "../interfaces/UserInterface.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { em } from "../db/config.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { MentorProfile } from "../entities/MentorProfile.js";

export class UserController extends Router {
  constructor() {
    super({ prefix: "/api/user" });
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post(
      "/become-mentor-request",
      AuthMiddleware(),
      this.createBecomeMentorRequest,
    );

    this.put("/profile", AuthMiddleware(), this.updateUserInfo);

    this.get(
      "/become-mentor-request",
      AuthMiddleware(),
      this.getOwnBecomeMentorRequest,
    );

    this.get(
      "/become-mentor-request/all",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllBecomeMentorRequests,
    );

    this.get(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      this.getBecomeMentorRequestById,
    );

    this.put(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.updateBecomeMentorRequest,
    );

    this.delete(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllMentors,
    );

    this.get("/mentors", AuthMiddleware(), this.getAllMentors);
  }

  private async updateUserInfo(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;
      const data = ctx.request.body as UserProfileUpdateRequest;

      user.firstName = data.firstName ?? user.firstName;
      user.lastName = data.lastName ?? user.lastName;
      user.email = data.email ?? user.email;
      user.avatar = data.avatar ?? user.avatar;
      user.bio = data.bio ?? user.bio;
      user.specializationCode =
        data.specializationCode ?? user.specializationCode;
      user.specializationTitle =
        data.specializationTitle ?? user.specializationTitle;
      user.formOfEducation = data.formOfEducation ?? user.formOfEducation;
      user.groupCode = data.groupCode ?? user.groupCode;
      user.department = data.department ?? user.department;
      user.interests = data.interests ?? user.interests;

      await em.persistAndFlush(user);

      ctx.status = 201;
      ctx.body = { message: "Updated successfully." };
    } catch (e) {
      console.error(e);
    }
  }

  private async createBecomeMentorRequest(ctx: Context): Promise<void> {
    try {
      const user: User = ctx.state.user as User;

      const { motivation } = ctx.request.body as BecomeMentorApiRequest;

      const existingRequest = await em.findOne(BecomeMentorRequest, {
        user: user.uuid,
      });
      if (existingRequest) {
        ctx.throw(400, "You already have a pending request.");
      }

      const request = new BecomeMentorRequest();
      request.user = user;
      request.motivation = motivation;
      request.status = MentorRequestStatus.PENDING;

      await em.persistAndFlush(request);

      ctx.status = 201;
      ctx.body = { message: "Become mentor request submitted successfully." };
    } catch (e) {
      console.error(e);
    }
  }

  private async getOwnBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const request = await em.findOne(BecomeMentorRequest, {
      user: user.uuid,
    });
    console.log(request);
    ctx.body = request;
    ctx.status = 200;
  }

  private async getAllBecomeMentorRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await em.find(BecomeMentorRequest, {});
    ctx.status = 200;
  }

  private async getBecomeMentorRequestById(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }
    const id = ctx.params.id;
    const request = await em.findOne(BecomeMentorRequest, { uuid: id });
    if (!request) {
      ctx.status = 404;
      ctx.body = { message: "Mentor request not found." };
      return;
    }
    if (user.role !== UserRole.ADMIN && request.user.uuid !== user.uuid) {
      ctx.throw(403, "Forbidden");
    }
    ctx.body = request;
    ctx.status = 200;
  }

  private async updateBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;
    const { status, motivation } = ctx.request.body as Partial<{
      status: MentorRequestStatus;
      motivation: string;
    }>;
    const request = await em.findOne(BecomeMentorRequest, { uuid: id });
    if (!request) {
      ctx.throw(404, "Mentor request not found.");
    }
    if (status) {
      request.status = status;
    }
    if (motivation) {
      request.motivation = motivation;
    }
    await em.persistAndFlush(request);
    ctx.body = { message: "Mentor request updated successfully.", request };
    ctx.status = 200;
  }

  // private async deleteBecomeMentorRequest(ctx: Context): Promise<void> {
  //   const user: User = ctx.state.user as User;
  //   if (!user) {
  //     ctx.throw(401, "Unauthorized");
  //   }
  //
  //   const id = ctx.params.id;
  //   const request = await em.findOne(BecomeMentorRequest, { uuid: id });
  //   if (!request) {
  //     ctx.throw(404, "Mentor request not found.");
  //   }
  //   await em.removeAndFlush(request);
  //   ctx.body = { message: "Mentor request deleted successfully." };
  //   ctx.status = 200;
  // }

  private async getAllMentors(ctx: Context): Promise<void> {
    const mentors = await em.find(MentorProfile, {}, { populate: ["mentor"] });

    if (!mentors) {
      ctx.throw(400, "Mentors  not found.");
    }

    ctx.body = mentors.map((mentorProfile) => {
      return {
        uuid: mentorProfile.mentor.uuid,
        name:
          mentorProfile.mentor.firstName + " " + mentorProfile.mentor.lastName,
        rating: mentorProfile.rating,
        totalReviews: mentorProfile.totalReviews,
      };
    });
    ctx.status = 200;
  }
}
