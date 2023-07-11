import { AvatarAttach, engine, AvatarAnchorPointType, AudioStream, AudioSource, Entity, Transform } from "@dcl/sdk/ecs";
import * as utils from '@dcl-sdk/utils'
import { Vector3 } from "@dcl/sdk/math";

export function enablePlayerSound(sound: string){
    let playerSoundEntity: Entity
    playerSoundEntity = engine.addEntity()

    AudioSource.createOrReplace(playerSoundEntity,
        {
            audioClipUrl: sound,
            playing: false,
        })

    console.log("componentName",AudioSource.componentName, "componentType", AudioSource.componentType);
    AvatarAttach.createOrReplace(playerSoundEntity,{
        anchorPointId: AvatarAnchorPointType.AAPT_POSITION,
    })

    AudioSource.getMutable(playerSoundEntity).volume = 4
    AudioSource.getMutable(playerSoundEntity).playing = true
    let soundKillTimer = utils.timers.setTimeout(() => {
        engine.removeEntity(playerSoundEntity)
    }, 10 * 1000);
    
}
