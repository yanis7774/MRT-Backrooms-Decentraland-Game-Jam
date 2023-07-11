import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { Box, Trap, InkSpot, PickUp, CandleBlock } from "./obstacleComponents";
import { ColliderLayer, GltfContainer, InputAction, MeshCollider, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import { createEntity, createPlaneShapeEntity } from "../modules/entityManager";
import { boxModel, candleActiveModel, inkSprite, trapModel } from "../resources/resources";
import { BASIC_TRAP_RANGE, inventoryItems } from "../globals";
import { invPickUpModel } from "./inventory";
import * as utils from '@dcl-sdk/utils'
import { callPrompt } from "../ui";
import { checkOccupiedCells, resetTimeToRecalculate } from "../enemies/pathfinding";
import { movePlayerTo } from "~system/RestrictedActions";
import { monsterPosition } from "../enemies/enemySystems";

export function createTrap(position: Vector3) {
    const trapEntity = createEntity(position,trapModel);
    Trap.create(trapEntity,{rangeTrigger: BASIC_TRAP_RANGE});
}

export function placeInkSpot(position: Vector3) {
    const inkEntity = createPlaneShapeEntity(position,inkSprite,Vector3.create(3,3,3),Quaternion.fromEulerDegrees(90,0,0));
    InkSpot.create(inkEntity);
    return inkEntity;
}

export function removeInkSpots() {
    const inkList = engine.getEntitiesWith(InkSpot);
    for (const [entity] of inkList) {
        engine.removeEntity(entity);
    }
}

export function createPickUp(index: inventoryItems, position: Vector3) {
    const pickUpEntity = createEntity(position,invPickUpModel[index]);
    Transform.createOrReplace(pickUpEntity, {
        position: Vector3.create(
            //Some light position randomization
            position.x,
            position.y + 0.7,
            position.z
        ), 
        scale: Vector3.create(2, 2, 2)
    });
    
    PickUp.create(pickUpEntity,{inventoryIndex: index});
    return pickUpEntity;
}

export function createCandleActive(position: Vector3) {
    //movePlayerTo({newRelativePosition:monsterPosition})
    //console.log("MOVED TO:", monsterPosition.x, monsterPosition.y, monsterPosition.z)
    const candleEntity = createEntity(position,candleActiveModel,'',true);
    CandleBlock.create(candleEntity);
    resetTimeToRecalculate()
    checkOccupiedCells(0)
    utils.timers.setTimeout(()=>{engine.removeEntity(candleEntity), resetTimeToRecalculate(), checkOccupiedCells(0)},15000);
}

export function createBox(position: Vector3) {
    const boxEntity = createEntity(position,boxModel);
    Box.create(boxEntity);
    pointerEventsSystem.onPointerDown({entity:boxEntity,opts:{button:InputAction.IA_POINTER, hoverText: "KILL WITH FIRE"}},function(){ callPrompt(
        "skjdkksj ksjdsk jsk jdks skjdkksj ksjdsk\njsk jdksskjdkksj ksjdsk jsk jdks skjdkksj ksjdsk\njsk jdks skjdkksj ksjdsk jsk jdks skjdkksj ksjdsk jsk jdks\nskjdkksj ksjdsk jsk jdks skjdkksj ksjdsk jsk\njdks skjdkksj ksjdsk jsk jdks skjdkksj ksjdsk jsk jdks\nskjdkksj ksjdsk jsk jdks sdsds",
        5,"PROBABLY",()=>{callPrompt("Are you a monster?",5,"OH YEAH",()=>{})},"I'M WRONG!",()=>{engine.removeEntity(boxEntity)})});
}