import request from "supertest";
import Koa from "koa";
import Router from "koa-router";
import koabodyparser from "koa-bodyparser";
import { ValidationMiddleware } from "../../src/middlewares/ValidationMiddleware.js";
import { ErrorMiddleware } from "../../src/middlewares/ErrorMiddleware.js";
import { SpecialityService } from "../../src/services/SpecialityService";
import type { Speciality } from "../../src/interfaces/SpecialityInterfaces";

const mockSpecialities = jest.fn();

jest.mock("../../src/services/SpecialityService", () => {
  return {
    SpecialityService: jest.fn().mockImplementation(() => ({
      getAll: mockSpecialities,
    })),
  };
});

const app = new Koa();
const router = new Router();

const specialityService = new SpecialityService();

router.get("/api/specialities", async (ctx) => {
  ctx.body = await specialityService.getAll();
});

app.use(koabodyparser());
app.use(ErrorMiddleware());
app.use(ValidationMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());

const mockResponse = [
  {
    name: "name",
    department: "dep",
    code: "code",
    level: "level",
  },
] as Speciality[];

describe("SpecialityController", () => {
  beforeEach(() => {
    mockSpecialities.mockReset();
  });

  it("should successfully get specialities", async () => {
    mockSpecialities.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .get("/api/specialities")
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(mockSpecialities).toHaveBeenCalledTimes(1);
  });
});
