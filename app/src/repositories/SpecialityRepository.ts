import { readFileSync } from "fs";
import type { Speciality } from "../interfaces/SpecialityInterfaces.js";

export class SpecialityRepository {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private readSpecialitiesFile(): Speciality[] {
    const rawData = readFileSync(this.filePath, "utf-8");
    return JSON.parse(rawData);
  }

  getAllSpecialities(): Speciality[] {
    return this.readSpecialitiesFile();
  }
}
