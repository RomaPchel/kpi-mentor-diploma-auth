import { unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { Speciality } from "../../src/interfaces/SpecialityInterfaces";
import { SpecialityRepository } from "../../src/repositories/SpecialityRepository";

describe("SpecialityRepository test", () => {
  const testFilePath = "specialities-test.json";
  const testData: Speciality[] = [
    {
      name: "Computer Science",
      level: "Bachelor",
      code: "CS101",
      department: "Engineering",
    },
    {
      name: "Mathematics",
      level: "Master",
      code: "MATH202",
      department: "Science",
    },
  ];

  beforeAll(() => {
    writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
  });

  afterAll(() => {
    unlinkSync(testFilePath);
  });

  it("should read and return all specialities from the file", () => {
    const repo = new SpecialityRepository(resolve("specialities-test.json"));
    const result = repo.getAllSpecialities();

    expect(result).toEqual(testData);
  });
});
