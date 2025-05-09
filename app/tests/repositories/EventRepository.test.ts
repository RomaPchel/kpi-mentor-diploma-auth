import { EventRepository } from "../../src/repositories/EventRepository";
import { Event } from "../../src/entities/Event";

jest.mock("../../src/db/config", () => {
  return {
    em: {
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    },
  };
});

import { em } from "../../src/db/config";
import { EventStatus } from "../../src/enums/EventEnums";  // after jest.mock

describe("EventRepository", () => {
  let repo: EventRepository;

  beforeEach(() => {
    repo = new EventRepository();
    jest.clearAllMocks();
  });

  it("should save an event", async () => {
    const event = new Event();
    await repo.save(event);
    expect(em.persistAndFlush).toHaveBeenCalledWith(event);
  });

  it("should find event by id", async () => {
    const expectedEvent = new Event();
    (em.findOne as jest.Mock).mockResolvedValue(expectedEvent);

    const result = await repo.findById("1234");
    expect(em.findOne).toHaveBeenCalledWith(Event, { uuid: "1234" }, { populate: ["participants"] });
    expect(result).toBe(expectedEvent);
  });

  it("should find all events", async () => {
    const expectedEvents = [new Event(), new Event()];
    (em.find as jest.Mock).mockResolvedValue(expectedEvents);

    const whereCondition = { status: EventStatus.PLANNED };

    const result = await repo.findAll(whereCondition);

    expect(em.find).toHaveBeenCalledWith(
      Event,
      whereCondition,
      { populate: ["participants"] }
    );

    expect(result).toBe(expectedEvents);
  });
});
