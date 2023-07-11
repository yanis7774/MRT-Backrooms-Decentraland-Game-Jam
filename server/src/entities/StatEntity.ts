import {Entity, Property} from "@mikro-orm/core";
import {BaseEntity} from './BaseEntity';

@Entity()
export class Stat extends BaseEntity {
    @Property({type: 'string'}) address: string;
    @Property({type: 'string'}) type: string;
    @Property({type: 'string'}) action: string;
    @Property({type: 'string'}) sessionId: string;

    constructor(address: string, type: string, action: string, sessionId: string) {
        super();
        this.address = address;
        this.type = type;
        this.action = action;
        this.sessionId = sessionId;
    }

}