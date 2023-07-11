import {Entity, Property} from "@mikro-orm/core";
import {BaseEntity} from './BaseEntity';

@Entity()
export class ConfigEntity extends BaseEntity {
    @Property({type: 'string'}) configName: string;
    @Property({type: 'any'}) value: any;

    constructor(configName: string, value: string) {
        super();
        this.configName = configName
        this.value = value
    }
}