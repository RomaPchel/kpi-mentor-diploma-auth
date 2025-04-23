import type { Speciality } from "../interfaces/SpecialityInterfaces.js";
import specialitiesData from '../specialities.json'; // Assuming you can import JSON

export class SpecialityService {
  private readonly specialities: Speciality[];

  constructor() {
    this.specialities = specialitiesData;
  }

  getAllSpecialities(): Speciality[] {
    return this.specialities;
  }
}