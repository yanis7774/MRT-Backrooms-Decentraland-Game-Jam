import { Schemas, engine } from "@dcl/sdk/ecs";

// all enemies, to make a chase after player
export const Enemy = engine.defineComponent('Enemy',{
    movementSpeed: Schemas.Number,
    hitRange: Schemas.Number,
    moving: Schemas.Boolean, // if set to true, will move after player
    active: Schemas.Boolean, // if set to false, becomes inactive
    damage: Schemas.Number,
    damageThreshold: Schemas.Number
})

export const Mimic = engine.defineComponent('Mimic',{
    huntDistance: Schemas.Number,
    startAttackDistance: Schemas.Number,
    mimicState: Schemas.Number,
    tireTimerMax: Schemas.Number,
    tireTimer: Schemas.Number,
})

export const InkMonster = engine.defineComponent('InkMonster',{
    teleportState: Schemas.Number,
    removeDistance: Schemas.Number,
    huntDistance: Schemas.Number
});

export enum inkState {
    STABLE,
    TELEPORT_INIT,
    OBLIGATORY_INIT,
    TELEPORTING,
    HUNTING
}

export enum mimicState {
    STABLE,
    HUNTING,
    TIRED,
}

export const Worm = engine.defineComponent('Worm',{
    enrage: Schemas.Boolean,
    enrageSpeed: Schemas.Number,
    basicSpeed: Schemas.Number
});