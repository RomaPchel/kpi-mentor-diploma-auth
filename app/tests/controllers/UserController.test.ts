import request from "supertest";
import Koa from "koa";
import Router from "koa-router";
import koabodyparser from "koa-bodyparser";
import { ValidationMiddleware } from "../../src/middlewares/ValidationMiddleware.js";
import { ErrorMiddleware } from "../../src/middlewares/ErrorMiddleware.js";
import { User } from "../../src/entities/User.js";
import { UserService } from "../../src/services/UserService";
import { FormsOfEducation } from "../../src/enums/UserEnums";
import { UserResponse, UserUpdateRequest } from "../../src/interfaces/UserInterface";

const mockUser = jest.fn();

jest.mock("../../src/services/UserService", () => {
  return {
    UserService: jest.fn().mockImplementation(() => ({
      updateUser: mockUser,
    })),
  };
});

const app = new Koa();
const router = new Router();

const userService = new UserService();

router.post("/api/users", async (ctx) => {
  const user = {
    uuid: "535f6637-ba75-44c2-a345-09d715c25d8f",
    firstName: "name",
    lastName: "name",
  } as User;

  ctx.body = await userService.updateUser(user, ctx.request.body as UserUpdateRequest);
});

app.use(koabodyparser());
app.use(ErrorMiddleware());
app.use(ValidationMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());

const mockResponse = {
  id: "535f6637-ba75-44c2-a345-09d715c25d8f",
  firstName: "name",
  lastName: "name",
  email: "ff@gmail.com",
  avatar: "url",
  bio: "bio",
  specializationCode: 121,
  specializationTitle: "title",
  formOfEducation: FormsOfEducation.FULL_TIME,
  groupCode: "ffr",
  department: "tef",
  interests: [],
} as UserResponse;

describe("UserController", () => {
  beforeEach(() => {
    mockUser.mockReset();
  });

  it("should successfully update user", async () => {
    const validUserRequest = {
      avatar: "http://example.com",
    };

    mockUser.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .post("/api/users")
      .send(validUserRequest)
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(mockUser).toHaveBeenCalledTimes(1);
  });
});
