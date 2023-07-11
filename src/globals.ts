import { Room } from "colyseus.js"

export const inkMonsterSpeed = 3.5;
export const wormSpeed = 2;
export const mimicSpeed = 3;
export const basicRange = 2.5;

export const wormEnrageDuration = 10;
export const wormWaitMin = 5;
export const wormWaitMax = 60;

export const MAX_HEALTH = 10;
export const MAX_INVENTORY = 3;
export const INV_FRAME = 1500;
export enum inventoryItems {
    GAS_MASK,
    HEALTH_KIT,
    WALL_TRAP,
    HEALTH_BUFF,
    LAST_INDEX
}

export const BASIC_TRAP_RANGE = 5;
export const BASIC_HEALTHKIT_RANGE = 5;

export const backend_wss = "wss://crypto-grids.com/gamejamserver"
export let globalRooms: Room[] = []

interface leader {
    address: string,
    name: string,
    rooms: number,
    timer: number,
    deaths: number,
}
interface leaderboard_interface {
    room: leader[], timer: leader[], deaths: leader[]
}
export let leaderList: leaderboard_interface = {room: [], timer: [], deaths: []};
export let leaderStats: leader = {address: "", name: "", rooms: 0, timer: 0, deaths: 0};

export function setLeaderboardData(personal: leader, global: leaderboard_interface) {
    leaderList = global;
    leaderStats = personal;
}