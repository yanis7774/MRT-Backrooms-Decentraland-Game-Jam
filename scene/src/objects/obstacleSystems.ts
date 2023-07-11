import {engine, InputAction, pointerEventsSystem, Transform} from "@dcl/sdk/ecs";
import {PickUp, Trap} from "./obstacleComponents";
import {Vector3} from "@dcl/sdk/math";
import {User} from "../modules/userState";
import {inventoryItems} from "../globals";
import {enablePlayerSound} from "../modules/playerSounds";
import {playerSounds} from "../resources/resources";
import {callPrompt, setupUi, ui_type} from "../ui";
import {candleText, gasmaskText, healthbuffText, medkitText} from "../modules/text_collection";

export function trapSystem(dt: number) {
    if (!Transform.has(engine.PlayerEntity)) return
    const playerPos = Transform.get(engine.PlayerEntity).position

    const traps = engine.getEntitiesWith(Trap,Transform);
    for (const [entity] of traps) {
        const transform = Transform.getMutable(entity);
        const trap = Trap.getMutable(entity);
        const distance = Vector3.distanceSquared(transform.position, {x:playerPos.x,y:0.7,z:playerPos.z});
        if (distance < trap.rangeTrigger) {
            User[0].damage(1,true);
            engine.removeEntity(entity);
        }
    }
}

let triggerTicksItemSystem = 30;

export function pickUpSystem(dt: number) {

    if(triggerTicksItemSystem > 0)
    {
        triggerTicksItemSystem--
        return
    }

    triggerTicksItemSystem = 30

    //console.log("Pickup System Triggered")

    if (!Transform.has(engine.PlayerEntity)) return

    const healthKits = engine.getEntitiesWith(PickUp,Transform);
    
    for (const [entity] of healthKits) {
        const pickup = PickUp.getMutable(entity);

        pointerEventsSystem.onPointerDown(
            {
              entity: entity,
              opts: { button: InputAction.IA_POINTER, hoverText: 'Collect' },
            },
            function () {
                if(pickup.inventoryIndex == inventoryItems.HEALTH_BUFF){
                    enablePlayerSound(playerSounds.healthBuff)
                }else{
                    enablePlayerSound(playerSounds.pickUp)
                }

                //Explanations
                if((pickup.inventoryIndex == inventoryItems.HEALTH_BUFF) && (User[0].explainedHealthbuff == false)){
                    // callPrompt(healthbuffText, 10, "OK", () => { });
                    setupUi(ui_type.promt)
                    callPrompt(healthbuffText, 4, "OK", () => {setupUi(ui_type.game) });
                    User[0].explainedHealthbuff = true
                }

                if((pickup.inventoryIndex == inventoryItems.GAS_MASK) && (User[0].explainedGasmask == false)){
                    setupUi(ui_type.promt)
                    callPrompt(gasmaskText, 4, "OK", () => {setupUi(ui_type.game) });
                    User[0].explainedGasmask = true
                }

                if((pickup.inventoryIndex == inventoryItems.HEALTH_KIT) && (User[0].explainedMedkit == false)){
                    setupUi(ui_type.promt)
                    callPrompt(medkitText, 4, "OK", () => {setupUi(ui_type.game) });
                    User[0].explainedMedkit = true
                }

                if((pickup.inventoryIndex == inventoryItems.WALL_TRAP) && (User[0].explainedCandle == false)){
                    setupUi(ui_type.promt)
                    callPrompt(candleText, 4, "OK", () => {setupUi(ui_type.game) });
                    User[0].explainedCandle = true
                }

                User[0].pickUpItem(pickup.inventoryIndex);
                engine.removeEntity(entity);
            }
        )
    
    }
}

export function rotateSystem(dt: number) {

    const healthKits = engine.getEntitiesWith(PickUp,Transform);
    for (const [entity] of healthKits) {
        const pickup = PickUp.getMutable(entity);
        
        pickup.t += dt
        Transform.getMutable(entity).position.y = pickup.originalPosition.y + 1 + 0.05 * Math.sin(10 * pickup.t)
    }
}
