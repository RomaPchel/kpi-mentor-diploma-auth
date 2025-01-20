import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 } from 'uuid';
import {UserRole} from "../enums/UserEnums";

@Entity()
export class User {
    @PrimaryKey()
    id: string = v4();

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

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();
}
