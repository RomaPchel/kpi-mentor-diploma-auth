import request from "supertest";
import Koa from "koa";
import Router from "koa-router";
import { ValidationMiddleware } from "kpi-diploma-typescript-core";

// Create a test Koa app
const app = new Koa();
const router = new Router();

// Dummy route to test Create Event
router.post("/api/events", async (ctx) => {
  ctx.body = "Event Created";
});

// Dummy route to test Update Event
router.put("/api/events/:id", async (ctx) => {
  ctx.body = "Event Updated";
});

// Dummy route to test Event Param
router.put("/api/events/:id", async (ctx) => {
  ctx.body = "Event Param Updated";
});

// Apply Validation Middleware
app.use(ValidationMiddleware());

// Apply Routes
app.use(router.routes());
app.use(router.allowedMethods());

describe("Event Validation Middleware", () => {
  it("should successfully validate a valid Create Event request", async () => {
    const validEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .post("/api/events")
      .send(validEvent)
      .expect(200);

    expect(response.body).toBe("Event Created");
  });

  it("should return error for Create Event with invalid URL", async () => {
    const invalidEvent = {
      timestamp: "1635189000000",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .post("/api/events")
      .send(invalidEvent)
      .expect(400);

    expect(response.body.errors).toContainEqual({
      field: "url",
      message: "URL_CAN_NOT_BE_EMPTY",
    });
  });

  it("should return error for Create Event with invalid participants", async () => {
    const invalidEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
      participants: ["invalid-uuid"],
    };

    const response = await request(app.callback())
      .post("/api/events")
      .send(invalidEvent)
      .expect(400);

    expect(response.body.errors).toContainEqual({
      field: "participants.0",
      message: "PARTICIPANT_MUST_BE_VALID",
    });
  });

  it("should return error for Update Event with missing status", async () => {
    const updateEvent = {
      timestamp: "1635189000000",
    };

    const response = await request(app.callback())
      .put("/api/events/123e4567-e89b-12d3-a456-426614174000")
      .send(updateEvent)
      .expect(400);

    expect(response.body.errors).toContainEqual({
      field: "status",
      message: "STATUS_MUST_BE_VALID",
    });
  });

  it("should successfully validate Update Event request", async () => {
    const updateEvent = {
      timestamp: "1635189000000",
      status: "ACTIVE", // Assuming ACTIVE is a valid EventStatus
    };

    const response = await request(app.callback())
      .put("/api/events/123e4567-e89b-12d3-a456-426614174000")
      .send(updateEvent)
      .expect(200);

    expect(response.body).toBe("Event Updated");
  });

  it("should return error for invalid EventParam id", async () => {
    const response = await request(app.callback())
      .put("/api/events/invalid-id")
      .send()
      .expect(400);

    expect(response.body.errors).toContainEqual({
      field: "id",
      message: "ID_MUST_BE_VALID",
    });
  });

  it("should successfully validate valid EventParam id", async () => {
    const response = await request(app.callback())
      .put("/api/events/123e4567-e89b-12d3-a456-426614174000")
      .send()
      .expect(200);

    expect(response.body).toBe("Event Param Updated");
  });
});
