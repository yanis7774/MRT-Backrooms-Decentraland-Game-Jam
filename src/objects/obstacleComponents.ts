import { Schemas, engine } from "@dcl/sdk/ecs";

export const Box = engine.defineComponent('Box',{});
export const Trap = engine.defineComponent('Trap',{
    rangeTrigger: Schemas.Number
});
export const PickUp = engine.defineComponent('PickUp',{
    t: Schemas.Number,
    originalPosition: Schemas.Vector3,
    inventoryIndex: Schemas.Number
});
export const CandleBlock = engine.defineComponent('CandleBlock',{});
 
export const InkSpot = engine.defineComponent('InkSpot',{});




