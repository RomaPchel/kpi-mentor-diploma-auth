import { Entity, Property, OneToOne } from "@mikro-orm/core";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class StudentInformation extends BaseEntity {
  @OneToOne(() => User, { owner: true })
  student!: User;

  @Property({ type: "int", default: 1 })
  year: number = 1;

  @Property({ type: "int", default: 0 })
  specializationCode: number = 0;

  @Property()
  specializationTitle!: string;

  @Property()
  formOfEducation!: string;

  @Property()
  groupCode!: string;
}
