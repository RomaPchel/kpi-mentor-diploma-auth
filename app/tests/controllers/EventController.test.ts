import request from "supertest";
import Koa from "koa";
import Router from "koa-router";
import koabodyparser from "koa-bodyparser";
import { ValidationMiddleware } from "../../src/middlewares/ValidationMiddleware.js";
import { ErrorMiddleware } from "../../src/middlewares/ErrorMiddleware.js";
import { EventService } from "../../src/services/EventService.js";
import {
  CreateEventRequest,
  UpdateEventRequest,
} from "../../src/interfaces/EventInterfaces.js";
import { User } from "../../src/entities/User.js";

const mockEvent = jest.fn();

jest.mock("../../src/services/EventService", () => {
  return {
    EventService: jest.fn().mockImplementation(() => ({
      createEvent: mockEvent,
      getEventById: mockEvent,
      updateEvent: mockEvent,
      getAllEvents: mockEvent,
    })),
  };
});

const app = new Koa();
const router = new Router();

const eventService = new EventService();

router.post("/api/events", async (ctx) => {
  const owner = {
    uuid: "owner-id",
    firstName: "John",
    lastName: "Doe",
  } as User;
  ctx.body = await eventService.createEvent(
    ctx.request.body as CreateEventRequest,
    owner,
  );
});

router.get("/api/events/:id", async (ctx) => {
  ctx.body = await eventService.getEventById(
    "535f6637-ba75-44c2-a345-09d715c25d8f",
  );
});

router.put("/api/events/:id", async (ctx) => {
  ctx.body = await eventService.updateEvent(
    "535f6637-ba75-44c2-a345-09d715c25d8f",
    ctx.request.body as UpdateEventRequest,
  );
});

router.get("/api/events", async (ctx) => {
  ctx.body = await eventService.getAllEvents({}, {});
});

app.use(koabodyparser());
app.use(ErrorMiddleware());
app.use(ValidationMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());

const mockResponse = {
  id: "535f6637-ba75-44c2-a345-09d715c25d8f",
  url: "http://example.com",
  status: "PLANNED",
  timestamp: new Date(Number("1635189000000")).toISOString(),
  owner: {
    id: "owner-id",
    name: "John Doe",
  },
  participants: [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Jane Smith",
    },
  ],
};

describe("EventController - Create Event", () => {
  beforeEach(() => {
    mockEvent.mockReset();
  });

  it("should successfully validate and create event", async () => {
    const validEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    mockEvent.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .post("/api/events")
      .send(validEvent)
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(mockEvent).toHaveBeenCalledTimes(1);
    expect(mockEvent).toHaveBeenCalledWith(validEvent, expect.any(Object));
  });

  it("should fail if url is missing", async () => {
    const inValidEvent = {
      timestamp: "1635189000000",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "url",
          message: "URL_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });

  it("should fail if timestamp is missing", async () => {
    const inValidEvent = {
      url: "http://example.com",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "timestamp",
          message: "TIMESTAMP_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });

  it("should fail if participants is missing", async () => {
    const inValidEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "participants",
          message: "PARTICIPANTS_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });

  it("should fail if timestamp is invalid (not a valid number or incorrect format)", async () => {
    const inValidEvent = {
      url: "http://example.com",
      timestamp: "invalid-timestamp",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "timestamp",
          message: "TIMESTAMP_MUST_BE_A_VALID",
        }),
      ]),
    );
  });

  it("should fail if participants array is empty", async () => {
    const inValidEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
      participants: [], // Empty participants array
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "participants",
          message: "PARTICIPANTS_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });

  it("should fail if participants array has an invalid UUID", async () => {
    const inValidEvent = {
      url: "http://example.com",
      timestamp: "1635189000000",
      participants: ["invalid-uuid"], // Invalid UUID
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "participants.0", // Corrected field name
          message: "PARTICIPANT_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if url is empty (invalid URL)", async () => {
    const inValidEvent = {
      url: "",
      timestamp: "1635189000000",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };
    const response = await request(app.callback())
      .post("/api/events")
      .send(inValidEvent)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "url",
          message: "URL_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });
});

describe("EventController - Get Event by ID", () => {
  beforeEach(() => {
    mockEvent.mockReset();
  });

  it("should successfully retrieve an event by ID", async () => {
    const eventId = "535f6637-ba75-44c2-a345-09d715c25d8f";

    mockEvent.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .get(`/api/events/${eventId}`)
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(mockEvent).toHaveBeenCalledTimes(1);
    expect(mockEvent).toHaveBeenCalledWith(eventId);
  });

  it("should fail if id in path is invalid", async () => {
    const eventId = "invalid-id";

    mockEvent.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .get(`/api/events/${eventId}`)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "id",
          message: "ID_MUST_BE_VALID",
        }),
      ]),
    );
  });
});

describe("EventController - Update Event", () => {
  beforeEach(() => {
    mockEvent.mockReset();
  });

  it("should successfully update event", async () => {
    const updateData = {
      url: "http://updated-example.com",
      status: "completed",
      timestamp: "1635189000000",
    };

    mockEvent.mockResolvedValueOnce(mockResponse);

    const response = await request(app.callback())
      .put("/api/events/535f6637-ba75-44c2-a345-09d715c25d8f")
      .send(updateData)
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(mockEvent).toHaveBeenCalledTimes(1);
  });

  it("should fail if url is invalid", async () => {
    const updateData = {
      url: "",
      timestamp: "1635189000000",
      status: "completed",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .put("/api/events/535f6637-ba75-44c2-a345-09d715c25d8f")
      .send(updateData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "url",
          message: "URL_CAN_NOT_BE_EMPTY",
        }),
      ]),
    );
  });

  it("should fail if timestamp is invalid (not a valid number or incorrect format)", async () => {
    const updateData = {
      url: "http://updated-example.com",
      timestamp: "invalid-timestamp",
      status: "completed",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .put("/api/events/535f6637-ba75-44c2-a345-09d715c25d8f")
      .send(updateData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "timestamp",
          message: "TIMESTAMP_MUST_BE_A_VALID",
        }),
      ]),
    );
  });

  it("should fail if status is invalid", async () => {
    const updateData = {
      url: "http://updated-example.com",
      timestamp: "1635189000000",
      status: "INVALID_STATUS",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .put("/api/events/535f6637-ba75-44c2-a345-09d715c25d8f")
      .send(updateData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "status",
          message: "STATUS_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if participants array has an invalid UUID", async () => {
    const updateData = {
      url: "http://updated-example.com",
      timestamp: "1635189000000",
      status: "completed",
      participants: ["invalid-uuid"],
    };

    const response = await request(app.callback())
      .put("/api/events/535f6637-ba75-44c2-a345-09d715c25d8f")
      .send(updateData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "participants.0", // Corrected field name
          message: "PARTICIPANT_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if id in path is invalid", async () => {
    const updateData = {
      url: "http://updated-example.com",
      timestamp: "1635189000000",
      status: "completed",
      participants: ["123e4567-e89b-12d3-a456-426614174000"],
    };

    const response = await request(app.callback())
      .put("/api/events/invalid-id")
      .send(updateData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "id",
          message: "ID_MUST_BE_VALID",
        }),
      ]),
    );
  });
});

describe("EventController - Get all events", () => {
  beforeEach(() => {
    mockEvent.mockReset();
  });

  it("should successfully retrieve events", async () => {
    mockEvent.mockResolvedValueOnce([mockResponse]);

    const response = await request(app.callback())
      .get(`/api/events/`)
      .expect(200);

    expect(response.body).toEqual([mockResponse]);
    expect(mockEvent).toHaveBeenCalledTimes(1);
  });

  it("should fail if minTimestamp is not valid ", async () => {
    mockEvent.mockResolvedValueOnce([mockResponse]);

    const response = await request(app.callback())
      .get(`/api/events?minTimestamp=4343`)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "minTimestamp",
          message: "MIN_TIMESTAMP_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if maxTimestamp is not valid ", async () => {
    mockEvent.mockResolvedValueOnce([mockResponse]);

    const response = await request(app.callback())
      .get(`/api/events?maxTimestamp=4343`)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxTimestamp",
          message: "MAX_TIMESTAMP_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if sortBy is not valid", async () => {
    const response = await request(app.callback())
      .get(`/api/events?sortBy=statu`)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "sortBy",
          message: "SORT_BY_MUST_BE_VALID",
        }),
      ]),
    );
  });

  it("should fail if sortOrder is not valid", async () => {
    const response = await request(app.callback())
      .get(`/api/events?sortOrder=asce`)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "sortOrder",
          message: "SORT_ORDER_MUST_BE_VALID",
        }),
      ]),
    );
  });
});
