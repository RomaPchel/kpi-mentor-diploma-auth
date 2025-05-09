import type { Speciality } from "../interfaces/SpecialityInterfaces.js";
import { SpecialityRepository } from "../repositories/SpecialityRepository.js";
import { resolve } from "path";

export class SpecialityService {
  private readonly specialityRepository: SpecialityRepository;

  constructor() {
    this.specialityRepository = new SpecialityRepository(resolve("specialities.json"));
  }

  getAll(): Speciality[] {
    return this.specialityRepository.getAllSpecialities();
  }
}
