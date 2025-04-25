// tests/specialities/speciality.test.ts
import { jest } from '@jest/globals';
import * as fs from 'fs';
import { SpecialityRepository } from "../../src/repositories/SpecialityRepository.js";
import type { Speciality } from "../../src/interfaces/SpecialityInterfaces.js";

describe('SpecialityRepository', () => {
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
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockSpecialities));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all specialities from the file', () => {
    const repo = new SpecialityRepository();
    const result = repo.getAllSpecialities();

    expect(fs.readFileSync).toHaveBeenCalled();
    expect(result).toEqual(mockSpecialities);
  });
});
