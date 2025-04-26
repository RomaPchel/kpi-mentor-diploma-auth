import { EventService } from "../../src/services/EventService.js";
import { EventRepository } from "../../src/repositories/EventRepository.js";
import { UserRepository } from "../../src/repositories/UserRepository.js";
import { User } from "../../src/entities/User.js";
import { Event } from "../../src/entities/Event.js";
import { EventStatus } from "../../src/enums/EventEnums.js";
import {
  CreateEventRequest,
  UpdateEventRequest,
} from "../../src/interfaces/EventInterfaces.js";

jest.mock("../../src/repositories/EventRepository", () => {
  return {
    EventRepository: jest.fn().mockImplementation(() => ({
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    })),
  };
});

jest.mock("../../src/repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      getAllUsersByIds: jest.fn(),
    })),
  };
});

jest.mock("../../src/entities/Event.js", () => {
  return {
    Event: jest.fn().mockImplementation(() => ({
      uuid: "mock-event-id",
      url: "",
      timestamp: new Date(),
      status: EventStatus.PLANNED,
      owner: null,
      participants: {
        set: jest.fn(), // fake .set() method
        getItems: jest.fn().mockReturnValue([]),
      },
    })),
  };
});

describe("EventService", () => {
  let service: EventService;
  let mockEventRepo: jest.Mocked<EventRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    service = new EventService();
    mockEventRepo = (service as any).eventRepository;
    mockUserRepo = (service as any).userRepository;
    jest.clearAllMocks();
  });

  it("should create a new event and save it", async () => {
    const owner = new User();
    owner.uuid = "owner-id";
    owner.firstName = "John";
    owner.lastName = "Doe";

    const participant = new User();
    participant.uuid = "participant-id";
    participant.firstName = "Jane";
    participant.lastName = "Smith";

    mockUserRepo.getAllUsersByIds.mockResolvedValue([participant]);
    mockEventRepo.save.mockResolvedValue(undefined); // save usually returns void

    const req: CreateEventRequest = {
      url: "https://event.com",
      timestamp: new Date().toISOString(),
      participants: ["participant-id"],
    };

    const result = await service.createEvent(req, owner);

    expect(mockUserRepo.getAllUsersByIds).toHaveBeenCalledWith([
      "participant-id",
    ]);

    expect(result).toEqual({
      id: "mock-event-id",
      url: "https://event.com",
      status: EventStatus.PLANNED,
      timestamp: expect.any(Date),
      owner: {
        id: "owner-id",
        name: "John Doe",
      },
      participants: [],
    });
  });

  it("should update event details", async () => {
    const event = new Event();
    event.uuid = "event-id";
    event.url = "https://old-url.com";
    event.status = EventStatus.PLANNED;
    event.timestamp = new Date();
    event.owner = new User();
    event.owner.uuid = "666fa648-48ff-4176-b8de-2ae95878e934";
    event.owner.firstName = "John";
    event.owner.lastName = "Doe";

    (mockEventRepo.findById as jest.Mock).mockResolvedValue(event);
    (mockEventRepo.save as jest.Mock).mockResolvedValue(undefined);

    const participant = new User();
    participant.uuid = "new-participant-id";
    participant.firstName = "Updated";
    participant.lastName = "Participant";

    (mockUserRepo.getAllUsersByIds as jest.Mock).mockResolvedValue([
      participant,
    ]);

    const updateData: UpdateEventRequest = {
      url: "https://new-url.com",
      status: EventStatus.PLANNED,
      timestamp: new Date().toISOString(),
      participants: ["new-participant-id"],
    };

    const result = await service.updateEvent("event-id", updateData);

    expect(mockEventRepo.findById).toHaveBeenCalledWith("event-id");
    expect(mockEventRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://new-url.com",
        status: EventStatus.PLANNED,
        participants: expect.anything(),
      }),
    );

    expect(result).toEqual({
      id: "event-id",
      url: "https://new-url.com",
      status: "planned",
      timestamp: expect.any(Date),
      owner: {
        id: "666fa648-48ff-4176-b8de-2ae95878e934",
        name: "John Doe",
      },
      participants: [],
    });
  });

  it("should fetch an event by ID", async () => {
    const eventId = "event-id";
    const event = new Event();
    event.uuid = eventId;
    event.url = "https://event.com";
    event.status = EventStatus.PLANNED;
    event.timestamp = new Date();
    event.owner = new User();
    event.owner.uuid = "owner-id";
    event.owner.firstName = "John";
    event.owner.lastName = "Doe";

    (mockEventRepo.findById as jest.Mock).mockResolvedValue(event);

    const result = await service.getEventById(eventId);

    expect(mockEventRepo.findById).toHaveBeenCalledWith(eventId);
    expect(result).toEqual({
      id: eventId,
      url: "https://event.com",
      status: EventStatus.PLANNED,
      timestamp: expect.any(Date),
      owner: {
        id: "owner-id",
        name: "John Doe",
      },
      participants: [],
    });
  });

  it("should throw an error if event is not found", async () => {
    const eventId = "nonexistent-event-id";

    (mockEventRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.getEventById(eventId)).rejects.toThrow(
      "Event not found",
    );
  });

  it("should fetch all events", async () => {
    const event1 = new Event();
    event1.uuid = "event-id-1";
    event1.url = "https://event1.com";
    event1.status = EventStatus.PLANNED;
    event1.timestamp = new Date();
    event1.owner = new User();
    event1.owner.uuid = "owner-id-1";
    event1.owner.firstName = "John";
    event1.owner.lastName = "Doe";

    const event2 = new Event();
    event2.uuid = "event-id-2";
    event2.url = "https://event2.com";
    event2.status = EventStatus.PLANNED;
    event2.timestamp = new Date();
    event2.owner = new User();
    event2.owner.uuid = "owner-id-2";
    event2.owner.firstName = "Jane";
    event2.owner.lastName = "Doe";

    (mockEventRepo.findAll as jest.Mock).mockResolvedValue([event1, event2]);

    const result = await service.getAllEvents();

    expect(mockEventRepo.findAll).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: "event-id-1",
        url: "https://event1.com",
        status: EventStatus.PLANNED,
        timestamp: expect.any(Date),
        owner: {
          id: "owner-id-1",
          name: "John Doe",
        },
        participants: [],
      },
      {
        id: "event-id-2",
        url: "https://event2.com",
        status: EventStatus.PLANNED,
        timestamp: expect.any(Date),
        owner: {
          id: "owner-id-2",
          name: "Jane Doe",
        },
        participants: [],
      },
    ]);
  });
});
