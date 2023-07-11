import {Entity, Property} from "@mikro-orm/core";
import {BaseEntity} from './BaseEntity';
import { saveUserToDB } from "../rooms/dbUtils";


@Entity()
export class User extends BaseEntity {
    @Property({type: 'string'}) address: string;
    @Property({type: 'string'}) name: string;
    @Property({type: 'boolean'}) banned: boolean;
    @Property({type: 'number'}) timeLeader: number;
    @Property({type: 'number'}) roomLeader: number;
    @Property({type: 'number'}) deathLeader: number;
    //@Property({type: 'array'}) messageQueue: string[];

    constructor(address: string,
                name: string,
                banned: boolean
    ) {
        super();
        this.address = address
        this.name = name
        this.banned = banned
        this.timeLeader = -1;
        this.roomLeader = -1;
        this.deathLeader = 0;
    }
}