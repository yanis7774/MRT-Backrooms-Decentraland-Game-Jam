import { Vector3 } from "@dcl/sdk/math";
import { Enemy, InkMonster, Mimic, Worm, inkState, mimicState } from "./enemyComponents";
import { createEntity } from "../modules/entityManager";
import { Animator, AudioSource, GltfContainer, Transform, engine } from "@dcl/sdk/ecs";
import { basicRange, inkMonsterSpeed, mimicSpeed, wormEnrageDuration, wormSpeed, wormWaitMax, wormWaitMin } from "../globals";
import { inkMonsterModel, inkWalkingSound, mimicWalkingSound, wormModel, wormWalkingSound } from "../resources/resources";
import * as utils from '@dcl-sdk/utils';
import { ink_inactive_timer, monsterPosition, updateMonsterPos } from "./enemySystems";
import { getMimicSrc, Furniture } from "../modules/mapgen/furniture";
import { User } from "../modules/userState";

export function createChaser(position: Vector3, model: string, speed: number, hitRange: number, damage: number = 1, damageThreshold: number = 3) {
    const chaserEntity = createEntity(position,model);
    Enemy.create(chaserEntity,{damageThreshold: damageThreshold, damage: damage, movementSpeed: speed, hitRange: hitRange, moving: true, active: true});
    return chaserEntity;
}

export let ink_timer: any;
export let mimic_timer: any;
export let worm_timer: any;

export function createMimic(position: Vector3) {
    let choosen_furniture = getMimicSrc(User[0].currentFloor)

    const newEntity = createChaser(
        position,
        choosen_furniture.src[0],
        mimicSpeed,
        basicRange);
    
    Transform.getMutable(newEntity).scale = choosen_furniture.scale

    AudioSource.createOrReplace(newEntity,
        {
            audioClipUrl: mimicWalkingSound,
            loop:true,
            volume: 8,
            playing: false,
        })


    Mimic.create(newEntity,{tireTimerMax:500,tireTimer:500,mimicState: mimicState.STABLE, huntDistance: 350, startAttackDistance: 100});

    Enemy.getMutable(newEntity).movementSpeed = (Enemy.getMutable(newEntity).movementSpeed - 2) + Math.floor(2 * Math.random() * 100) / 100
    
    mimic_timer = utils.timers.setInterval(()=>{
        if(!Mimic.getMutableOrNull(newEntity))
        {
            return
        }
        if (Mimic.getMutable(newEntity).mimicState != mimicState.HUNTING) {
            const playerPos = Transform.get(engine.PlayerEntity).position
            if (Vector3.distanceSquared(Transform.getMutable(newEntity).position, {x:playerPos.x,y:0.7,z:playerPos.z}) > Mimic.getMutable(newEntity).huntDistance) {

                let new_choosen_furniture = getMimicSrc(User[0].currentFloor)

                Transform.getMutable(newEntity).scale = new_choosen_furniture.scale
                GltfContainer.getMutable(newEntity).src = new_choosen_furniture.src[0]
            }
        }
    },10000)
    
    return newEntity;
}

export function removeMimic() {
    const enemyList = engine.getEntitiesWith(Enemy,Mimic);
    //utils.timers.clearInterval(mimic_timer);
    for (const [entity] of enemyList) {
        engine.removeEntity(entity);
    }
    


    
}

export function createInkMonster(position: Vector3) {
    console.log("SPAWNED INK MONSTER")
    updateMonsterPos(position)
    const newEntity = createChaser(position,inkMonsterModel,inkMonsterSpeed,basicRange);
    AudioSource.createOrReplace(newEntity,
        {
            audioClipUrl: inkWalkingSound,
            loop:true,
            volume: 40,
            playing: true,
        })
        
    InkMonster.create(newEntity,{teleportState: inkState.STABLE, removeDistance: 500, huntDistance: 100});
    ink_timer = utils.timers.setInterval(()=>{
        if(!InkMonster.getMutableOrNull(newEntity))
        {
            return
        }
        if (InkMonster.getMutable(newEntity).teleportState != inkState.HUNTING)
            InkMonster.getMutable(newEntity).teleportState = inkState.TELEPORT_INIT;
    },10000)
    return newEntity;
}

export function removeInkMonster() {
    const enemyList = engine.getEntitiesWith(Enemy,InkMonster);
    for (const [entity] of enemyList) {
        if (!Enemy.getMutable(entity).active) {
            utils.timers.clearTimeout(ink_inactive_timer);
        }
        engine.removeEntity(entity);
    }
    utils.timers.clearInterval(ink_timer);
}

export function createWormMonster(position: Vector3) {
    const entity = createChaser(position,wormModel,0,basicRange,2,5);
    Worm.create(entity,{
        enrage: false,
        enrageSpeed: wormSpeed*5,
        basicSpeed: wormSpeed,
    });
    AudioSource.createOrReplace(entity,
        {
            audioClipUrl: wormWalkingSound,
            loop:true,
            volume: 70,
            playing: true,
        })

    Animator.create(entity, {
        states: [
            {
                name: "MOVE",
                clip: "MOVE",
                playing: true,
                loop: true
            },
            {
                name: "ATK1",
                clip: "ATK1",
                playing: false,
                loop: false
            },
            {
                name: "ATK2",
                clip: "ATK2",
                playing: false,
                loop: false
            }
        ]
    })

    utils.timers.setTimeout(enrageWorm,(wormWaitMin + Math.floor(Math.random()*(wormWaitMax-wormWaitMin)))*1000)
    return entity;
}

const enrageWorm = () => {
    const enemyList = engine.getEntitiesWith(Worm);
    let worms_present = false
    for (const [entity] of enemyList) {
        let worm = Worm.getMutable(entity);
        let enemy = Enemy.getMutable(entity);
        enemy.movementSpeed = worm.enrageSpeed;
        worm.enrage = true;
        worms_present = true
    }
    if(worms_present)
    {
        utils.timers.setTimeout(calmWorm,wormEnrageDuration*1000)
    }
    

}

const calmWorm = () => {
    const enemyList = engine.getEntitiesWith(Worm);
    let worms_present = false

    for (const [entity] of enemyList) {
        let worm = Worm.getMutable(entity);
        let enemy = Enemy.getMutable(entity);
        enemy.movementSpeed = worm.basicSpeed;
        worm.enrage = false;
        worms_present = true
    }
    if(worms_present)
    {
        utils.timers.setTimeout(enrageWorm,wormEnrageDuration*1000)
    }
}

export function removeWorm() {
    const enemyList = engine.getEntitiesWith(Worm);
    utils.timers.clearTimeout(worm_timer);
    for (const [entity] of enemyList) {
        engine.removeEntity(entity);
    }
}