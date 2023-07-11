import { Transform, engine, MeshRenderer, Entity, Material, MaterialTransparencyMode, pointerEventsSystem, InputAction, MeshCollider } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";
import { getCurrentZoneIndex } from "./zones";
import { calculateWeightedRandom } from "../logic/weighted_random";

const max_spawn_chance = 60

export function createDecal(position: Vector3, rotation: Quaternion, parentRoom: Entity, level: number, wallMounted: boolean) {

    //First we calculate the chance for not spawning decal at all, the deeper we go, the less clean the area

    let spawn_chance = (level + 1) * 5
    let spawn_result = Math.random() * 100

    if(
        (spawn_result <= spawn_chance) && (spawn_result <= max_spawn_chance)
    )

    {
        

        if(!wallMounted){

            //We determine what kind of decal we spawning

            const zone_index = getCurrentZoneIndex(level)

            let zone_weights = new Array<number>();

            for(let i = 0; i < decalsCollection.length; i++) {
                zone_weights.push(decalsCollection[i].weights[zone_index])
            }

            let decal_result = calculateWeightedRandom(zone_weights)

            let source = decalsCollection[decal_result].src

            //We create decal entity
            const entity = engine.addEntity();
            Transform.create(entity, {
                position: Vector3.create(
                    //Some light position randomization
                    position.x + Math.random() * 1.6 - 0.8,
                    position.y,
                    position.z + Math.random() * 1.6 - 0.8
                ), 
                scale: Vector3.create(
                    wallsDecalsCollection[decal_result].scale.x,
                    wallsDecalsCollection[decal_result].scale.y,
                    wallsDecalsCollection[decal_result].scale.z
                    ),
                parent: parentRoom,
                rotation: rotation
            });
            MeshRenderer.setPlane(entity)

            Material.setPbrMaterial(entity, {
                texture: Material.Texture.Common({
                src: source[Math.floor(Math.random() * source.length)]
                }),
                transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
            })
            return entity

        }
        else{

            //We determine what kind of decal we spawning

            const zone_index = getCurrentZoneIndex(level)

            let zone_weights = new Array<number>();

            for(let i = 0; i < wallsDecalsCollection.length; i++) {
                zone_weights.push(wallsDecalsCollection[i].weights[zone_index])
            }

            let decal_result = calculateWeightedRandom(zone_weights)

            let source = wallsDecalsCollection[decal_result].src

            //We create decal entity
            const entity = engine.addEntity();
            Transform.create(entity, {
                position: position, 
                scale: Vector3.create(
                    wallsDecalsCollection[decal_result].scale.x,
                    wallsDecalsCollection[decal_result].scale.y,
                    wallsDecalsCollection[decal_result].scale.z
                    ),
                parent: parentRoom,
                rotation: rotation
            });
            MeshRenderer.setPlane(entity)
            MeshCollider.setPlane(entity)

            Material.setPbrMaterial(entity, {
                texture: Material.Texture.Common({
                src: source[Math.floor(Math.random() * source.length)]
                }),
                transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
            })

            //pointerEventsSystem.onPointerDown({ entity: entity, opts: { button: InputAction.IA_POINTER, hoverText: `check` } }, function () { describeDecal(position, rotation) });

            return entity


        }

    }

    
    
}

function describeDecal(position: Vector3, rotation: Quaternion,) {
    console.log("Coordiates - ", position.x, position.y, position.z)
    console.log("Rotation - ", rotation.x, rotation.y, rotation.z, rotation.w)
}



interface Decal {
    src: string[];
    weights: number[] 
    //Keep this format, keep it up to maximum number of zones, numbers must be between 0 and 10
    //[1, 2, 3]
    scale: Vector3;
}




//Floors

let decalsCollection = new Array<Decal>();

const directions: Decal = {
    src: [
        'images/textures/decals/directions_1.png', 'images/textures/decals/directions_2.png', 'images/textures/decals/directions_3.png',
        'images/textures/decals/directions_5.png', 'images/textures/decals/directions_6.png', 
],
    weights: [7, 6, 2],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
decalsCollection.push(directions)

const decal_blood: Decal = {
    src: [
        'images/textures/decals/blood_1.png', 'images/textures/decals/blood_2.png', 'images/textures/decals/blood_3.png',
        'images/textures/decals/blood_4.png', 'images/textures/decals/blood_5.png', 'images/textures/decals/blood_6.png', 
],
    weights: [0, 2, 9],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
decalsCollection.push(decal_blood)

const decal_pipes: Decal = {
    src: [
        'images/textures/decals/pipes_1.png', 'images/textures/decals/pipes_2.png', 'images/textures/decals/pipes_3.png',
        'images/textures/decals/pipes_4.png', 'images/textures/decals/pipes_5.png', 'images/textures/decals/pipes_6.png', 
],
    weights: [0, 2, 9],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
decalsCollection.push(decal_pipes)



//Walls
let wallsDecalsCollection = new Array<Decal>();

const decal_pipes_wall: Decal = {
    src: [
        'images/textures/decals/pipes_1.png', 'images/textures/decals/pipes_2.png', 'images/textures/decals/pipes_3.png',
        'images/textures/decals/pipes_4.png', 'images/textures/decals/pipes_5.png', 'images/textures/decals/pipes_6.png', 
],
    weights: [0, 5, 6],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
wallsDecalsCollection.push(decal_pipes_wall)

const decal_vent: Decal = {
    src: [
        'images/textures/decals/vent_1.png', 'images/textures/decals/vent_2.png', 'images/textures/decals/vent_3.png',
        'images/textures/decals/vent_4.png', 'images/textures/decals/vent_5.png', 
],
    weights: [1, 5, 6],
    scale: Vector3.create(1, 1, 1)
};
wallsDecalsCollection.push(decal_vent)

const decal_normal_map: Decal = {
    src: [
        'images/textures/decals/normal_map_1.png', 'images/textures/decals/normal_map_2.png', 'images/textures/decals/normal_map_3.png',
        'images/textures/decals/normal_map_4.png', 'images/textures/decals/normal_map_5.png', 'images/textures/decals/normal_map_6.png',
        'images/textures/decals/normal_map_7.png', 'images/textures/decals/normal_map_8.png',
],
    weights: [8, 5, 1],
    scale: Vector3.create(1.3, 1.3, 1.3)
};
wallsDecalsCollection.push(decal_normal_map)

const decal_face: Decal = {
    src: [
        'images/textures/decals/face_1.png', 'images/textures/decals/face_2.png', 'images/textures/decals/face_3.png',
        'images/textures/decals/face_4.png', 'images/textures/decals/face_5.png', 'images/textures/decals/face_6.png',
        'images/textures/decals/face_7.png',
    ],
    weights: [0, 1, 4],
    scale: Vector3.create(2, 2, 2)
};
wallsDecalsCollection.push(decal_face)

const decal_machine: Decal = {
    src: [
        'images/textures/decals/machine_1.png', 'images/textures/decals/machine_2.png', 'images/textures/decals/machine_3.png',
        'images/textures/decals/machine_4.png', 'images/textures/decals/machine_5.png', 'images/textures/decals/machine_6.png',
        'images/textures/decals/machine_7.png', 'images/textures/decals/machine_8.png',
],
    weights: [4, 7, 4],
    scale: Vector3.create(1, 1, 1)
};
wallsDecalsCollection.push(decal_machine)

const decal_hell_signs: Decal = {
    src: [
        'images/textures/decals/hell_signs_1.png', 'images/textures/decals/hell_signs_2.png', 'images/textures/decals/hell_signs_3.png',
        'images/textures/decals/hell_signs_4.png', 'images/textures/decals/hell_signs_5.png', 'images/textures/decals/hell_signs_6.png',
        'images/textures/decals/hell_signs_7.png', 'images/textures/decals/hell_signs_8.png', 'images/textures/decals/hell_signs_9.png',
    ],
    weights: [0, 1, 6],
    scale: Vector3.create(1.3, 1.3, 1.3)
};
wallsDecalsCollection.push(decal_hell_signs)

const decal_hell_photo: Decal = {
    src: [
        'images/textures/decals/hell_photo_1.png', 'images/textures/decals/hell_photo_2.png', 'images/textures/decals/hell_photo_3.png',
        'images/textures/decals/hell_photo_4.png', 'images/textures/decals/hell_photo_5.png', 'images/textures/decals/hell_photo_6.png',
        'images/textures/decals/hell_photo_7.png', 'images/textures/decals/hell_photo_8.png', 'images/textures/decals/hell_photo_9.png',
    ],
    weights: [0, 1, 8],
    scale: Vector3.create(1.3, 1.3, 1.3)
};
wallsDecalsCollection.push(decal_hell_photo)
