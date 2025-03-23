import {
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateEventRequest {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsISO8601()
  @IsNotEmpty()
  timestamp!: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[];
}
