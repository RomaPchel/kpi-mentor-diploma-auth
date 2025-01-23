import {Entity, Property, Enum, BeforeCreate} from '@mikro-orm/core';
import {UserRole} from "../enums/UserEnums.js";
import bcrypt from "bcrypt";
import {BaseEntity} from "./BaseEntity.js";

@Entity()
export class User extends BaseEntity{
    @Property()
    firstName!: string;

    @Property()
    lastName!: string;

    @Property({ unique: true })
    email!: string;

    @Property()
    password!: string;

    @Enum(() => UserRole)
    role: UserRole = UserRole.STUDENT;

    @Property({ nullable: true })
    avatar?: string;

    @Property({ type: 'text', nullable: true })
    bio?: string;


    @BeforeCreate()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }
}
