import { Transform, engine, GltfContainer, Entity, Material } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";
import { getCurrentZoneIndex } from "./zones";
import { calculateWeightedRandom } from "../logic/weighted_random";

const max_spawn_chance = 25

export function createFurniture(position: Vector3, rotation: Quaternion, parentRoom: Entity, level: number) {

    let spawn_result = Math.random() * 100

    if(
        (spawn_result <= max_spawn_chance)
    )

    {
        //We create furniture entity
        const entity = engine.addEntity();

        //We determine what kind of furniture we spawning

        const zone_index = getCurrentZoneIndex(level)

        let zone_weights = new Array<number>();

        for(let i = 0; i < furnituresCollection.length; i++) {
            zone_weights.push(furnituresCollection[i].weights[zone_index])    
    }


        let furniture_result = calculateWeightedRandom(zone_weights)

        Transform.create(entity, {
            position: position, 
            scale: Vector3.create(
                furnituresCollection[furniture_result].scale.x,
                furnituresCollection[furniture_result].scale.y,
                furnituresCollection[furniture_result].scale.z
                ),
            parent: parentRoom,
            rotation: rotation
        });

        let source = furnituresCollection[furniture_result].src
        GltfContainer.create(entity, {src: source[Math.floor(Math.random() * source.length)]})

        return entity;
    }
    
}

export function getMimicSrc(level: number) {
    const zone_index = getCurrentZoneIndex(level)
    let zone_weights = new Array<number>();

    for(let i = 0; i < furnituresCollection.length; i++)
        zone_weights.push(furnituresCollection[i].weights[zone_index])
    let calc = calculateWeightedRandom(zone_weights);

    return furnituresCollection[calc];
}

export interface Furniture {
    src: string[];
    weights: number[];
    //Keep this format, keep it up to maximum number of zones, numbers must be between 0 and 10
    //[1, 2, 3]
    scale: Vector3;
}

let furnituresCollection = new Array<Furniture>();

//MRT

const furniture_barrel: Furniture = {
    src: ['models/furniture/mrt/barrel.glb'],
    weights: [1, 3, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_barrel)

const furniture_barrel_wood: Furniture = {
    src: ['models/furniture/mrt/barrel_wood.glb'],
    weights: [1, 5, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_barrel_wood)

const furniture_box: Furniture = {
    src: ['models/furniture/mrt/box.glb'],
    weights: [1, 2, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_box)

const furniture_drawer_oak: Furniture = {
    src: ['models/furniture/mrt/drawer_oak.glb'],
    weights: [2, 3, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_drawer_oak)

const furniture_ancient_greek_amphora: Furniture = {
    src: ['models/furniture/mrt/ancient_greek_amphora.glb'],
    weights: [3, 1, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_ancient_greek_amphora)

const furniture_antique_globe: Furniture = {
    src: ['models/furniture/mrt/antique_globe.glb'],
    weights: [3, 0, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_antique_globe)

const furniture_Vase2: Furniture = {
    src: ['models/furniture/mrt/Vase2.glb'],
    weights: [3, 1, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_Vase2)

const furniture_chairs: Furniture = {
    src: ['models/furniture/mrt/chair15.glb', 'models/furniture/mrt/chair16.glb', 'models/furniture/mrt/garden_chair.glb', 'models/furniture/mrt/Nordic_Chair.glb'],
    weights: [7, 7, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_chairs)

const furniture_plants: Furniture = {
    src: ['models/furniture/mrt/plant_7.glb', 'models/furniture/mrt/plant_8.glb'],
    weights: [8, 8, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_plants)

const furniture_toilets: Furniture = {
    src: ['models/furniture/mrt/wc_1.glb', 'models/furniture/mrt/wc_2.glb', 'models/furniture/mrt/wc_3.glb'],
    weights: [1, 3, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_toilets)

const furniture_juxebox: Furniture = {
    src: ['models/furniture/mrt/juxebox.glb'],
    weights: [3, 3, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_juxebox)

const furniture_lamps: Furniture = {
    src: ['models/furniture/mrt/lamp_1.glb', 'models/furniture/mrt/lamp_2.glb', 'models/furniture/mrt/lamp_3.glb', 'models/furniture/mrt/lamp_4.glb'],
    weights: [6, 6, 0],
    scale: Vector3.create(1.5, 1.5, 1.5)
};
furnituresCollection.push(furniture_lamps)


//Hell furniture

const furniture_barrel_rust: Furniture = {
    src: ['models/furniture/barrel_rust.glb'],
    weights: [0, 2, 8],
    scale: Vector3.create(1, 1, 1)
};
furnituresCollection.push(furniture_barrel_rust)

const furniture_bloodbath: Furniture = {
    src: ['models/furniture/bloodbath.glb'],
    weights: [0, 0, 6],
    scale: Vector3.create(1, 1, 1)
};
furnituresCollection.push(furniture_bloodbath)

const furniture_cage: Furniture = {
    src: ['models/furniture/cage1.glb', 'models/furniture/cage2.glb', 'models/furniture/cage3.glb'],
    weights: [0, 0, 6],
    scale: Vector3.create(1, 1, 1)
};
furnituresCollection.push(furniture_cage)

const furniture_CRT_TV: Furniture = {
    src: ['models/furniture/CRT_TV1.glb', 'models/furniture/CRT_TV2.glb', 'models/furniture/CRT_TV3.glb', 'models/furniture/CRT_TV4.glb',],
    weights: [0, 3, 7],
    scale: Vector3.create(1, 1, 1)
};
furnituresCollection.push(furniture_CRT_TV)

const furniture_schooldesk: Furniture = {
    src: ['models/furniture/schooldesk.glb'],
    weights: [0, 2, 7],
    scale: Vector3.create(1, 1, 1)
};
furnituresCollection.push(furniture_schooldesk)
