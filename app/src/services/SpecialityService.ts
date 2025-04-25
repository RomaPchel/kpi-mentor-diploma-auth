import type { Speciality } from "../interfaces/SpecialityInterfaces.js";
import { SpecialityRepository } from "../repositories/SpecialityRepository.js";

export class SpecialityService {
  private readonly specialityRepository: SpecialityRepository;

  constructor() {
    this.specialityRepository = new SpecialityRepository();
  }

  getAllSpecialities(): Speciality[] {
    return this.specialityRepository.getAllSpecialities();
  }
}
