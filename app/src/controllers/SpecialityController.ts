import Router from "koa-router";
import type { Context } from "koa";
import { SpecialityService } from "../services/SpecialityService.js";

export class SpecialityController extends Router {
  private readonly specialityService: SpecialityService;

  constructor() {
    super({ prefix: "/api/specialities" });
    this.specialityService = new SpecialityService();
    this.setUpRoutes();
  }

  private setUpRoutes() {
    this.get("/", this.getAllSpecialities.bind(this));
  }

  private async getAllSpecialities(ctx: Context): Promise<void> {
    const events = this.specialityService.getAll();
    ctx.status = 200;
    ctx.body = events;
  }
}
