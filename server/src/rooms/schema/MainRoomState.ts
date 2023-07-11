import {Schema, MapSchema, type} from "@colyseus/schema";
import { MAX_HEALTH, configMap } from "../env";

export class Player extends Schema {
    @type('string') address: string;
    @type('string') name: string;
    @type("boolean") connected: boolean;
    @type('string') pendingSessionId: string;
    @type('number') pendingSessionTimestamp: number;
    @type('string') activeSessionId: string;
    @type('boolean') banned: boolean;
    noWeb3: boolean = false;
    statActionList: {type: string, action: string}[] = [];
    adminStatus: boolean = false;
    healthPoints: number = MAX_HEALTH;
    healthBuff: number = 0;

    statAction(type: string, action: string) {
        this.statActionList.push({type: type, action: action});
    }
}

export class MainRoomState extends Schema {
    @type("number") countdown: number;
    @type({map: Player}) users = new MapSchema<Player>();
}