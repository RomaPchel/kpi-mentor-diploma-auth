import Router from "koa-router";
import type { Context } from "koa";
import type { User } from "../entities/User.js";
import { UserRole } from "../enums/UserEnums.js";
import { Report } from "../entities/Report.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { roleMiddleware } from "../middlewares/RolesMiddleware.js";
import { MentorService } from "../services/MentorService.js";
import {
  BecomeMentorRequestBody,
  RateMentorRequest,
  UpdateMentorRequest,
} from "../interfaces/MentorInterfaces.js";
import { em } from "../db/config.js";
import { Feedback } from "../entities/Feedback.js";

export class MentorController extends Router {
  private readonly mentorService: MentorService;

  constructor() {
    super({ prefix: "/api/mentors" });
    this.mentorService = new MentorService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.post(
      "/become-mentor-request",
      AuthMiddleware(),
      this.createBecomeMentorRequest.bind(this),
    );
    this.post("/feedback", AuthMiddleware(), this.createFeedback.bind(this));
    this.post("/:uuid/report", AuthMiddleware(), this.createReport.bind(this));
    this.put(
      "/:uuid/report",
      AuthMiddleware(),
      this.markReportReviewed.bind(this),
    );
    this.put(
      "/:uuid/feedback",
      AuthMiddleware(),
      this.markFeedbackReviewed.bind(this),
    );

    this.get(
      "/become-mentor-request",
      AuthMiddleware(),
      this.getOwnBecomeMentorRequest.bind(this),
    );

    this.get(
      "/become-mentor-request/all",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllBecomeMentorRequests.bind(this),
    );

    this.get(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      this.getBecomeMentorRequestById.bind(this),
    );

    this.put(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.updateBecomeMentorRequest.bind(this),
    );

    this.delete(
      "/become-mentor-request/:id",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.deleteBecomeMentorRequest.bind(this),
    );

    this.get("/", AuthMiddleware(), this.getAllMentors.bind(this));
    this.get("/profile/:uuid", AuthMiddleware(), this.getOneMentor.bind(this));
    this.put("/rate/:uuid", AuthMiddleware(), this.rateMentor.bind(this));
    this.get(
      "/feedbacks",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllFeedbacks.bind(this),
    );
    this.get(
      "/reports",
      AuthMiddleware(),
      roleMiddleware(UserRole.ADMIN),
      this.getAllReports.bind(this),
    );
  }

  private async createBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const motivation = ctx.request.body as BecomeMentorRequestBody;

    const existingRequest = await this.mentorService.getOneRequestByUser(user);
    if (existingRequest) {
      ctx.throw(400, "You already have a pending request.");
    }

    ctx.body = await this.mentorService.createBecomeMentorRequest(
      user,
      motivation,
    );
    ctx.status = 200;
  }

  private async createFeedback(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    const { message } = ctx.request.body as {
      message: string;
      anonymous?: boolean;
    };

    if (!message || typeof message !== "string") {
      ctx.throw(400, "Report message is required.");
    }
    console.log(message);
    ctx.body = await this.mentorService.createFeedback(user, message);
    ctx.status = 201;
  }

  private async createReport(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;
    const mentorUuid = ctx.params.uuid;

    const { message, anonymous } = ctx.request.body as {
      message: string;
      anonymous?: boolean;
    };

    if (!message || typeof message !== "string") {
      ctx.throw(400, "Report message is required.");
    }

    ctx.body = await this.mentorService.createReport(
      user,
      mentorUuid,
      message,
      !!anonymous,
    );
    ctx.status = 201;
  }

  private async markReportReviewed(ctx: Context): Promise<void> {
    console.log("ASDASDASDASDAS");

    const reportUuid = ctx.params.uuid;
    if (!reportUuid) {
      ctx.throw(400, "Missing report UUID");
    }

    const report = await em.findOne(Report, { uuid: reportUuid });

    if (!report) {
      ctx.throw(404, "Report not found");
    }

    report.reviewedByAdmin = true;
    await em.flush();

    ctx.status = 201;
  }

  private async markFeedbackReviewed(ctx: Context): Promise<void> {
    const feedbackUuid = ctx.params.uuid;

    if (!feedbackUuid) {
      ctx.throw(400, "Missing report UUID");
    }

    const report = await em.findOne(Feedback, { uuid: feedbackUuid });

    if (!report) {
      ctx.throw(404, "Report not found");
    }

    report.reviewedByAdmin = true;
    await em.flush();

    ctx.status = 201;
  }

  private async getOwnBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    ctx.body = await this.mentorService.getOneRequestByUser(user);
    ctx.status = 200;
  }

  private async getAllBecomeMentorRequests(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    ctx.body = await this.mentorService.getAllRequests();
    ctx.status = 200;
  }

  private async getBecomeMentorRequestById(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;

    const id = ctx.params.id;

    ctx.body = await this.mentorService.getOneRequestById(user, id);
    ctx.status = 200;
  }

  private async updateBecomeMentorRequest(ctx: Context): Promise<void> {
    const id = ctx.params.id;

    const request = ctx.request.body as UpdateMentorRequest;

    ctx.body = await this.mentorService.updateRequest(id, request);
    ctx.status = 200;
  }

  private async deleteBecomeMentorRequest(ctx: Context): Promise<void> {
    const user: User = ctx.state.user as User;
    if (!user) {
      ctx.throw(401, "Unauthorized");
    }

    const id = ctx.params.id;

    await this.mentorService.deleteById(id);
    ctx.status = 200;
  }

  private async getAllMentors(ctx: Context): Promise<void> {
    try {
      console.log(await this.mentorService.getAllMentors());
      ctx.body = await this.mentorService.getAllMentors();
      ctx.status = 200;
    } catch (e) {
      console.error(e);
    }
  }

  private async getAllReports(ctx: Context): Promise<void> {
    ctx.body = await this.mentorService.getAllReports();
    ctx.status = 200;
  }

  private async getAllFeedbacks(ctx: Context): Promise<void> {
    ctx.body = await this.mentorService.getAllFeedbacks();
    ctx.status = 200;
  }

  private async getOneMentor(ctx: Context): Promise<void> {
    const uuid = ctx.params.uuid;

    ctx.body = await this.mentorService.getOneMentor(uuid);
    ctx.status = 200;
  }

  private async rateMentor(ctx: Context): Promise<void> {
    const user: User = ctx.state.user;

    const uuid = ctx.params.uuid;
    const rateRequest = ctx.request.body as RateMentorRequest;

    await this.mentorService.rateMentor(uuid, user, rateRequest);
    ctx.status = 200;
  }
}
