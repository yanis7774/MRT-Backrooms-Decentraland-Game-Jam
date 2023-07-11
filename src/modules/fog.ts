import { AvatarAttach, engine, GltfContainer, AvatarAnchorPointType, Transform, Entity, VisibilityComponent } from "@dcl/sdk/ecs";
import { fogBackroomModel, fogClassicModel, fogHorrorModel } from "../resources/resources";
import { Vector3 } from "@dcl/sdk/math";
import { getCurrentZoneIndex } from "./mapgen/zones";
import { User } from "./userState";

export const currentFog:Entity = createFog()

export function createFog() {
    const fog = engine.addEntity()
    GltfContainer.create(fog, {src: fogClassicModel});
    Transform.create(fog, {
        scale: Vector3.create(1, 1, 1)
    });
    AvatarAttach.create(fog,{
        anchorPointId: AvatarAnchorPointType.AAPT_POSITION,
    })
    VisibilityComponent.create(fog, { visible: true })

    return fog;
}

export function changeFog(){
    let currentZone = getCurrentZoneIndex(User[0].currentFloor)
    switch(currentZone){
        case 0:
            GltfContainer.createOrReplace(currentFog, {src: fogClassicModel})
            break;
        case 1:
            GltfContainer.createOrReplace(currentFog, {src: fogBackroomModel})
            break;
        case 2:
            GltfContainer.createOrReplace(currentFog, {src: fogHorrorModel})
            break;
        default:
            GltfContainer.createOrReplace(currentFog, {src: fogClassicModel})
            break;
    }
}