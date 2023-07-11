import { Animator, AudioSource, Transform, engine } from "@dcl/sdk/ecs"
import { Enemy, InkMonster, Mimic, Worm, inkState, mimicState } from "./enemyComponents"
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { gridContainer } from "./pathfinding";
import { User } from "../modules/userState";
import { InkSpot } from "../objects/obstacleComponents";
import * as utils from '@dcl-sdk/utils';
import { enablePlayerSound } from "../modules/playerSounds";
import { elevatorDoors, enemyAttackSound, inkAttackSound, wormAttackSound } from "../resources/resources";

export let monsterPosition:Vector3 = Vector3.create(30, 0, 30)

export function initEnemySystems() {
    engine.addSystem(inkSystem);
    engine.addSystem(movementSystem);
    engine.addSystem(mimicSystem);
}

export function updateMonsterPos(update:Vector3) {
    monsterPosition = update
}

export function mimicSystem(dt: number) {
    if (!Transform.has(engine.PlayerEntity)) return 
    const playerPos = Transform.get(engine.PlayerEntity).position
    const enemies = engine.getEntitiesWith(Mimic,Transform);
    for (const [entity] of enemies) {
        const mimic = Mimic.getMutable(entity);
        const transform = Transform.getMutable(entity);
        const enemy = Enemy.getMutable(entity);
        const distance = Vector3.distanceSquared(transform.position, {x:playerPos.x,y:0.7,z:playerPos.z});
        switch(mimic.mimicState) {
            case mimicState.STABLE:
                enemy.active = true;
                if (distance < mimic.huntDistance && distance > mimic.startAttackDistance) {
                    mimic.mimicState = mimicState.HUNTING;
                    console.log("MIMIC: HUNTING");
                }
            break;
            case mimicState.TIRED:
                enemy.active = true;
                if (++mimic.tireTimer >= mimic.tireTimerMax) {
                    mimic.mimicState = mimicState.STABLE;
                    console.log("MIMIC: STABLE AGAIN");
                }
            break;
            case mimicState.HUNTING:
                enemy.active = false;
                if (--mimic.tireTimer <= 0) {
                    mimic.mimicState = mimicState.TIRED;
                    console.log("MIMIC: TIRED");
                } else if (distance > mimic.huntDistance || distance < mimic.startAttackDistance) {
                    mimic.mimicState = mimicState.STABLE;
                    console.log("MIMIC: STABLE");
                }
            break;
        }
    }
}


export let ink_inactive_timer: any;
export function inkSystem(dt: number) {
    //console.log("Firing Ink System")
    if (!Transform.has(engine.PlayerEntity)) return 
    const playerPos = Transform.get(engine.PlayerEntity).position
    const enemies = engine.getEntitiesWith(InkMonster,Transform);
    //console.log(enemies)
    for (const [entity] of enemies) {
        const inkMonster = InkMonster.getMutable(entity);
        
        const transform = Transform.getMutable(entity);
        const enemy = Enemy.getMutable(entity);
        const distance = Vector3.distanceSquared(transform.position, {x:playerPos.x,y:0.7,z:playerPos.z});
        if (enemy.active) {
            if (inkMonster.teleportState != inkState.HUNTING && distance > inkMonster.removeDistance) {
                enemy.active = false;
                enemy.moving = false;
                transform.position.y = -30;
                ink_inactive_timer = utils.timers.setTimeout(()=>{
                    enemy.active = true;
                    inkMonster.teleportState = inkState.HUNTING;
                },10000);
            }
            if (inkMonster.teleportState == inkState.HUNTING || inkMonster.teleportState == inkState.TELEPORT_INIT || inkMonster.teleportState == inkState.OBLIGATORY_INIT) {
                let pathLength = 9999;
                if (gridContainer[0] && inkMonster.teleportState != inkState.HUNTING) {
                    monsterPosition = Transform.get(entity).position
                    let pathFind = gridContainer[0].getPath(transform.position,playerPos);
                    if (pathFind.length || gridContainer[0].samePoint(transform.position,playerPos))
                        pathLength = pathFind.length;
                }
                let inkPathLeader = 99999;
                let inkLeader: any;
                let noInks = true;

                const inkList = engine.getEntitiesWith(InkSpot,Transform);
                
                for(const [ink] of inkList) {
                    //console.log("INK", ink)
                    const inkTransform = Transform.getMutable(ink);
                    const inkDistance = Vector3.distanceSquared(inkTransform.position, {x:playerPos.x,y:0.7,z:playerPos.z});
                    if (gridContainer[0] && (inkMonster.teleportState != inkState.HUNTING || inkDistance < inkMonster.huntDistance)) {
                        noInks = false;
                        AudioSource.getMutable(ink).playing = true
                        monsterPosition = Transform.get(entity).position
                        let pathFind = gridContainer[0].getPath(inkTransform.position,playerPos);
                        let tmpPath = 99999;
                        if (pathFind.length || gridContainer[0].samePoint(inkTransform.position,playerPos))
                            tmpPath = pathFind.length;
                        if (tmpPath < inkPathLeader) {
                            inkPathLeader = tmpPath;
                            inkLeader = ink;
                        }
                    }
                    monsterPosition = Transform.get(entity).position
                    //console.log("INK STATUS", noInks)
                }
                
                if (inkMonster.teleportState != inkState.HUNTING && (noInks || (pathLength <= inkPathLeader && inkMonster.teleportState != inkState.OBLIGATORY_INIT))) {
                    inkMonster.teleportState = inkState.STABLE;
                    monsterPosition = Transform.get(entity).position
                } else if (!noInks) {
                    inkMonster.teleportState = inkState.TELEPORTING;
                    console.log("TELEPORTING TO", Transform.getMutable(inkLeader).position.x,-5,Transform.getMutable(inkLeader).position.z)
                    transform.position = Vector3.create(Transform.getMutable(inkLeader).position.x,-5,Transform.getMutable(inkLeader).position.z);
                    Enemy.getMutable(entity).moving = false;
                    monsterPosition = Transform.get(entity).position
                }
            } else if (inkMonster.teleportState == inkState.TELEPORTING) {
                if (transform.position.y >= 0.5) {
                    Enemy.getMutable(entity).moving = true;
                    inkMonster.teleportState = inkState.STABLE;
                    monsterPosition = transform.position
                } else {
                    transform.position.y+=0.2;
                    console.log("SLIDING")
                    monsterPosition = transform.position
                }
            }
        }
    }
    
    //console.log("FINISHED FIRING")

}

let inkIsChasing: boolean = false
let mimicIsChasing: boolean = false
let wormIsChasing: boolean = false

export function movementSystem(dt: number) {
    if(!User[0]) 
    {
        return
    }
    if (!Transform.has(engine.PlayerEntity)) return
    const playerPos = Transform.get(engine.PlayerEntity).position
    if (User[0].damageThreshold < User[0].damageThresholdMax) User[0].damageThreshold++; 

    const enemies = engine.getEntitiesWith(Enemy,Transform);
    for (const [entity] of enemies) {
        
        const transform = Transform.getMutable(entity);
        const enemy = Enemy.getMutable(entity);

        const distance = Vector3.distanceSquared(transform.position, {x:playerPos.x,y:0.7,z:playerPos.z});
        let isInAttackDistance = distance < enemy.hitRange*2;
        
        let path;
        if (gridContainer[0]) {
            monsterPosition = Transform.get(entity).position
            path = gridContainer[0].getPath(transform.position,playerPos);
            if (gridContainer[0].samePoint(transform.position,playerPos))
                isInAttackDistance = true;
        } else continue;

        if (isInAttackDistance && enemy.moving && enemy.active) {
            if (User[0].damage(enemy.damage,false,enemy.damageThreshold)) {
                let ink = InkMonster.getMutableOrNull(entity)
                if (ink != null) {
                    enablePlayerSound(inkAttackSound)
                    enablePlayerSound(enemyAttackSound)
                    ink.teleportState = inkState.OBLIGATORY_INIT;
                }
                let mimic = Mimic.getMutableOrNull(entity)
                if (mimic != null) {
                    mimicIsChasing = false
                    AudioSource.getMutable(entity).playing = false
                    enablePlayerSound(enemyAttackSound)
                    mimic.mimicState = inkState.STABLE;
                }
                let worm = Worm.getMutableOrNull(entity)
                if(worm != null){
                    wormIsChasing = false
                    enablePlayerSound(wormAttackSound)
                    enablePlayerSound(enemyAttackSound)
                    Animator.playSingleAnimation(entity, "ATK1")
                }
            }
        }
        

        if (path.length && enemy.moving && enemy.active) {
            const lookAtTarget = Vector3.create(playerPos.x, transform.position.y, playerPos.z);
            const lookAtDirection = Vector3.subtract(lookAtTarget, transform.position);
            const moveAtTarget = Vector3.create(path[0].x, transform.position.y, path[0].z);
            const moveAtDirection = Vector3.subtract(moveAtTarget, transform.position);
            transform.rotation = Quaternion.slerp(
                transform.rotation,
                Quaternion.lookRotation(lookAtDirection),
                1 + dt
            )
            const isInChaseDistance = distance > enemy.hitRange;
            if (isInChaseDistance) {
                let mimic = Mimic.getMutableOrNull(entity)
                if (mimic != null && mimicIsChasing == false) {
                    mimicIsChasing = true
                    AudioSource.getMutable(entity).playing = true
                }
                let worm = Worm.getMutableOrNull(entity)
                if(worm != null && wormIsChasing == false){
                    wormIsChasing = true
                    Animator.playSingleAnimation(entity, "MOVE")
                }
                const forwardVector = Vector3.rotate(Vector3.Forward(), Quaternion.lookRotation(moveAtDirection))
                const positionDelta = Vector3.scale(forwardVector, enemy.movementSpeed * dt);
                transform.position = Vector3.add(transform.position, positionDelta);
            }
        }
    }
}