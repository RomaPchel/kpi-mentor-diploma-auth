import { Entity, Property, OneToOne, JsonType } from '@mikro-orm/core';
import { User } from './User.js';
import {BaseEntity} from "./BaseEntity.js";

@Entity()
export class MentorProfile extends BaseEntity{
    @OneToOne(() => User, { owner: true })
    mentor!: User;

    @Property({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    rating: number = 0.0;

    @Property({ default: 0 })
    totalReviews: number = 0;

    @Property({ type: JsonType, nullable: true })
    badges?: Record<string, any>;
}
