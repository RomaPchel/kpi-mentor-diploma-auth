import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { EventStatus } from "../enums/EventEnums";

export class UpdateEventRequest {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsEnum(EventStatus)
  status: EventStatus = EventStatus.PLANNED;

  @IsISO8601()
  @IsNotEmpty()
  timestamp!: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[];
}
