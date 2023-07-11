import { Callback } from "@dcl/sdk/react-ecs";
import { inventoryItems } from "../globals";
import { User } from "../modules/userState";
import * as utils from '@dcl-sdk/utils'
import { candleModel, candleSprite, gasMaskModel, gasMaskSpirte, healthBuffModel, healthBuffSpirte, healthKitModel, healthKitSpirte, playerSounds } from "../resources/resources";
import { createCandleActive } from "./obstacles";
import { Vector3 } from "@dcl/sdk/math";
import { Transform, engine } from "@dcl/sdk/ecs";
import { enablePlayerSound } from "../modules/playerSounds";

const invFuncs: Callback[] = [];
export const invIcons: string[] = [];
export const invPickUpModel: string[] = [];

for(let i = 0; i < inventoryItems.LAST_INDEX; i++) {
    invFuncs.push(()=>{});
    invIcons.push("");
    invPickUpModel.push("");
}
function addItem(index: inventoryItems, func: Callback, img: string, model: string) {
    invIcons[index] = img;
    invPickUpModel[index] = model;
    invFuncs[index] = func;
}

addItem(
    inventoryItems.GAS_MASK,
    () => {
        User[0].invincibleMode = true;
        enablePlayerSound(playerSounds.gasMask)
        utils.timers.setTimeout(()=>{User[0].invincibleMode = false},15000)
    },
    gasMaskSpirte,
    gasMaskModel
)

addItem(
    inventoryItems.HEALTH_KIT,
    () => {
        enablePlayerSound(playerSounds.healthKit)
        User[0].healing(2);
    },
    healthKitSpirte,
    healthKitModel
)


addItem(
    inventoryItems.HEALTH_BUFF,
    () => {
        User[0].healthBuffing(1);
    },
    healthBuffSpirte,
    healthBuffModel
)

addItem(
    inventoryItems.WALL_TRAP,
    () => {
        enablePlayerSound(playerSounds.candle)
        createCandleActive(Vector3.create(Transform.get(engine.PlayerEntity).position.x,0.1,Transform.get(engine.PlayerEntity).position.z))
    },
    candleSprite,
    candleModel
)

export function useItem(index: inventoryItems) {
    //if (index < inventoryItems.LAST_INDEX) {
    if (index < inventoryItems.LAST_INDEX && User[0].inventory[index]) {
        invFuncs[index]();
        User[0].inventory[index]--;
    }
}
