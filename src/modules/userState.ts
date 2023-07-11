import { UserData } from "~system/Players"
import { INV_FRAME, MAX_HEALTH, MAX_INVENTORY, globalRooms, inventoryItems } from "../globals"
import * as utils from '@dcl-sdk/utils'
import { death } from "../ui"

export const User: UserState[] = []

export class UserState {
    public name: string | undefined
    public address: string
    public avatar: string | undefined
    public adminStatus: boolean = false;
    public healthPoints: number = MAX_HEALTH;
    public healthBuff: number = 0;
    public invincibleFrame: boolean = false;
    public invincibleMode: boolean = false;
    public wholeTimer: number = 0;
    public currentFloorTimer: number = 0;
    public floorTimer: number[] = [];
    public currentFloor: number = 0;
    public invincibleFrameTimer: any;
    public inventory: number[] = []
    public damageThreshold: number = 30;
    public damageThresholdMax: number = 30;

    public explainedGame = false
    public explainedHell = false
    public explainedHealthbuff = false
    public explainedMedkit = false
    public explainedGasmask = false
    public explainedCandle = false
    
    constructor(userData: UserData | undefined) {
        this.address = "";
        if (userData?.publicKey) {
            this.name = userData.displayName;
            this.address = userData.publicKey;
            this.avatar = userData.avatar?.snapshots?.face256;
        }
        this.initTimer();
        User.push(this);
        for(let i = 0; i < inventoryItems.LAST_INDEX; i++)
            this.inventory.push(0);
    }

    pickUpItem(itemIndex: inventoryItems, amount: number = 1) {
        if (itemIndex < inventoryItems.LAST_INDEX && this.inventory[itemIndex] < MAX_INVENTORY) {
            if(itemIndex === inventoryItems.HEALTH_BUFF){
                this.healthBuffing()
            }else{
                this.inventory[itemIndex]++;
            }
            return true;
        } else return false;
    }

    damage(amount: number = 1, ignoreInv: boolean = false, suppressThreshold: number = 3) {
        if (this.damageThreshold > 0) {
            this.damageThreshold-=suppressThreshold;
            return false;
        } else {
            if (ignoreInv && this.invincibleFrame) {
                utils.timers.clearTimeout(this.invincibleFrameTimer);
                this.invincibleFrame = false;
            }
            if (!this.invincibleFrame) {
                if (this.invincibleMode)
                    return true;
                this.healthPoints = Math.max(0,this.healthPoints-amount);
                globalRooms[0].send("damageReceived",{amount: amount});
                this.invincibleFrame = true;
                this.invincibleFrameTimer = utils.timers.setTimeout(()=>{this.invincibleFrame = false},INV_FRAME);
                if(!this.healthPoints)
                {
                    death()
                }
                return true;
            } else return false;
        }
    }

    healing(amount: number = 1) {
        this.healthPoints = Math.min(MAX_HEALTH + this.healthBuff,this.healthPoints+amount);
        globalRooms[0].send("healingReceived",{amount: amount});
    }

    healthBuffing(amount: number = 1) {
        this.healthBuff = amount
        globalRooms[0].send("healthBuffing",{amount: amount});
    }

    initTimer() {
        utils.timers.setInterval(()=>{
            this.currentFloorTimer++;
            this.wholeTimer++;
        },1000);
    }

    nextFloor() {
        this.floorTimer.push(this.currentFloorTimer);
        this.currentFloorTimer = 0;
        this.currentFloor++;
    }

    resetPlayer() {
        this.currentFloorTimer = 0;
        this.floorTimer = [];
        this.currentFloor = 0;
        this.wholeTimer = 0;
        this.healthPoints = MAX_HEALTH;
    }
}