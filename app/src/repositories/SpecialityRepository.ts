import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Speciality } from "../interfaces/SpecialityInterfaces.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../../specialities.json');

/**
 * Represents a repository for managing and accessing speciality data.
 * This class handles reading speciality data from a file and provides methods to retrieve the data.
 */
export class SpecialityRepository {
  private readonly filePath: string;

  constructor() {
    this.filePath = filePath;
  }

  private readSpecialitiesFile(): Speciality[] {
    const rawData = readFileSync(this.filePath, 'utf-8');
    return JSON.parse(rawData);  // Parse the JSON string into an object
  }

  getAllSpecialities(): Speciality[] {
    return this.readSpecialitiesFile();
  }
}
