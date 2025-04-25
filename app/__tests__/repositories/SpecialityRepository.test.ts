import * as fs from 'fs';
import { SpecialityRepository } from "../../src/repositories/SpecialityRepository.js"; // import path module


describe('SpecialityRepository', () => {
  let specialityRepository: SpecialityRepository;

  beforeEach(() => {
    specialityRepository = new SpecialityRepository();
  });

  it('should read specialities file correctly', () => {
    // Setup mock implementation for fs.readFileSync
    // const mockData = '[{"name": "Cardiology"}]'; // example mock data
    // (fs.readFileSync as jest.Mock).mockReturnValueOnce(mockData);  // mock return value

    const result = specialityRepository.getAllSpecialities();

    expect(result).toEqual([{ name: 'Cardiology' }]); // expect the result to be the mock data
  });
});