import { SpecialityService } from "../../src/services/SpecialityService";
import { SpecialityRepository } from "../../src/repositories/SpecialityRepository";
import type { Speciality } from "../../src/interfaces/SpecialityInterfaces";

jest.mock("../../src/repositories/SpecialityRepository", () => {
  return {
    SpecialityRepository: jest.fn().mockImplementation(() => ({
      getAllSpecialities: jest.fn(),
    })),
  };
});

describe("SpecialityService", () => {
  let service: SpecialityService;
  let mockRepo: jest.Mocked<SpecialityRepository>;

  beforeEach(() => {
    service = new SpecialityService();
    mockRepo = (service as any).specialityRepository;
    jest.clearAllMocks();
  });

  it("should return all specialities", () => {
    const fakeSpecialities: Speciality[] = [
      {
        code: "SC101",
        name: "Software Engineering",
        level: "1",
        department: "1",
      },
      {
        code: "SC102",
        name: "Information Security",
        level: "1",
        department: "1",
      },
    ];

    (mockRepo.getAllSpecialities as jest.Mock).mockReturnValue(fakeSpecialities);

    const result = service.getAll();

    expect(mockRepo.getAllSpecialities).toHaveBeenCalled();
    expect(result).toEqual(fakeSpecialities);
  });
});
