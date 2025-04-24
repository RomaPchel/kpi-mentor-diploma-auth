import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Speciality } from "../interfaces/SpecialityInterfaces.js";

// Get the current directory path from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../../specialities.json');

export class SpecialityService {
  private readonly specialities: Speciality[];

  constructor() {
    // Read the JSON file synchronously and parse it
    const rawData = readFileSync(filePath, 'utf-8');
    this.specialities = JSON.parse(rawData);  // Parse the JSON string into an object
  }

  getAllSpecialities(): Speciality[] {
    return this.specialities;
  }
}
