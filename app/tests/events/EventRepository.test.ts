import { EventRepository } from "../../src/repositories/EventRepository.js";
import { Event } from "../../src/entities/Event.js";

jest.mock("../../src/db/config.js", () => {
  return {
    em: {
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
  };
});

import { em } from "../../src/db/config.js";  // after jest.mock

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
    (em.findAll as jest.Mock).mockResolvedValue(expectedEvents);

    const result = await repo.findAll();
    expect(em.findAll).toHaveBeenCalledWith(Event, { populate: ["participants"] });
    expect(result).toBe(expectedEvents);
  });
});
