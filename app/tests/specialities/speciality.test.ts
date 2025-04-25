import { jest } from "@jest/globals";
import { readFileSync } from "fs";
import type { Speciality } from "../../src/interfaces/SpecialityInterfaces";
import { SpecialityRepository } from "../../src/repositories/SpecialityRepository";

describe("SpecialityRepositoryTest", () => {
  const mockSpecialities: Speciality[] = [
    {
      name: "Computer Science",
      level: "",
      code: "",
      department: "",
    },
    {
      name: "Mathematics",
      level: "",
      code: "",
      department: "",
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock readFileSync
    jest
      .spyOn({ readFileSync }, "readFileSync")
      .mockReturnValue(JSON.stringify(mockSpecialities));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return all specialities from the file", () => {
    const repo = new SpecialityRepository();
    const result = repo.getAllSpecialities();

    expect(readFileSync).toHaveBeenCalled();
    expect(result).toEqual(mockSpecialities);
  });
});
