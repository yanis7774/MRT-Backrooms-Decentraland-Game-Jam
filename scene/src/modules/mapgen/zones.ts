import { AvatarAttach, engine, AvatarAnchorPointType, AudioSource, Entity } from "@dcl/sdk/ecs";

export interface Zone {
    minLevel: number;
    maxLevel: number;
    modelSrc: { [index: number]: string }; // Updated room templates for each RoomType within the zone
    zone_ost: string[];
    door_frame: string,
    door_barricades: string[],
    door_open_barricades: string[],
}

export const zones: Zone[] = [
    //MRT
    {
        minLevel: 0,
        maxLevel: 3,
        modelSrc: { /* define zone-specific room templates */ },
        zone_ost: [
            "sounds/ambient/calm_1.mp3",
            "sounds/ambient/calm_2.mp3",
            "sounds/ambient/calm_3.mp3",
            "sounds/ambient/calm_4.mp3",
            "sounds/ambient/calm_5.mp3",
            "sounds/ambient/calm_6.mp3",
        ],
        door_frame: "models/doors/roomDoorCoridor.glb",
        door_barricades: ["models/doors/baricadaWood.glb", "models/doors/baricadaConcrete.glb"],
        door_open_barricades: ["models/doors/baricadaPlanks.glb"],
    },
    //Backrooms
    {
        minLevel: 4,
        maxLevel: 6,
        modelSrc: { /* define zone-specific room templates */ },
        zone_ost: [
            "sounds/ambient/medium_1.mp3",
            "sounds/ambient/medium_2.mp3",
            "sounds/ambient/medium_3.mp3",
            "sounds/ambient/medium_4.mp3",
            "sounds/ambient/medium_5.mp3",
            "sounds/ambient/medium_6.mp3",
            "sounds/ambient/medium_7.mp3",
            "sounds/ambient/medium_8.mp3",
        ],
        door_frame: "models/doors/roomDoorBackroom.glb",
        door_barricades: ["models/doors/baricadaWood.glb", "models/doors/baricadaConcrete.glb"],
        door_open_barricades: ["models/doors/baricadaPlanks.glb"],
    },
    //Hell
    {
        minLevel: 7,
        maxLevel: 10,
        modelSrc: { /* define zone-specific room templates */ },
        zone_ost: [
            "sounds/ambient/crazy_1.mp3",
            "sounds/ambient/crazy_2.mp3",
            "sounds/ambient/crazy_3.mp3",
            "sounds/ambient/crazy_4.mp3",
            "sounds/ambient/crazy_5.mp3",
            "sounds/ambient/crazy_6.mp3",
        ],
        door_frame: "models/doors/roomDoorHorror.glb",
        door_barricades: ["models/doors/baricadaConcrete.glb"],
        door_open_barricades: ["models/doors/baricadaArmatura.glb", "models/doors/baricadaPlanks.glb"],
    },
];

export function getCurrentZoneIndex(level: number){
    let zone_index = zones.findIndex(z => z.minLevel <= level && z.maxLevel >= level);
    if(zone_index == -1){
        zone_index = 2 //Hell
    }
    return zone_index
}


let musicEntity: Entity
let musicPlaying = false


export function enableZoneMusic(level: number){

    if(musicPlaying){
        AudioSource.deleteFrom(musicEntity)
        AvatarAttach.deleteFrom(musicEntity)
        engine.removeEntity(musicEntity)
    }

    musicEntity = engine.addEntity()
    musicPlaying = true

    let ost_list = zones[getCurrentZoneIndex(level)].zone_ost

    AudioSource.createOrReplace(musicEntity,
        {
            audioClipUrl: ost_list[Math.floor(Math.random() * ost_list.length)],
            loop: true,
            playing: false,
        })

    AvatarAttach.createOrReplace(musicEntity,{
        anchorPointId: AvatarAnchorPointType.AAPT_POSITION,
    })

    AudioSource.getMutable(musicEntity).playing = true

}
