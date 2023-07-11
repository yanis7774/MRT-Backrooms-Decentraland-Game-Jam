import {
    Animator,
    AudioSource,
    AvatarModifierArea,
    AvatarModifierType,
    CameraModeArea,
    CameraType,
    ColliderLayer,
    engine,
    Entity,
    GltfContainer,
    InputAction,
    pointerEventsSystem,
    Transform,
    VisibilityComponent
} from "@dcl/sdk/ecs";
import {Quaternion, Vector3} from "@dcl/sdk/math";
import { createDecal } from "./decals";
import * as utils from '@dcl-sdk/utils'

import { createFurniture } from "./furniture";
import {decalMapFloor_Normal, defaultFloorHight} from "./decals_maps";
import {
    decalsWallMapFloor_End,
    decalsWallMapFloor_FourExitTrap,
    decalsWallMapFloor_FourExitWhirly,
    decalsWallMapFloor_Normal,
    decalsWallMapFloor_Start,
    decalsWallMapFloor_ThreeExitNarrow,
    decalsWallMapFloor_ThreeExitWeird,
    decalsWallMapFloor_TwoExit,
    decalsWallMapFloor_TwoExitCorridor,
    defaultWallHight
} from "./decallsWall_map";
import {
    furnitureMapFloor_End,
    furnitureMapFloor_FourExitTrap,
    furnitureMapFloor_FourExitWhirly,
    furnitureMapFloor_Normal,
    furnitureMapFloor_Start,
    furnitureMapFloor_ThreeExitNarrow,
    furnitureMapFloor_ThreeExitWeird,
    furnitureMapFloor_TwoExit,
    furnitureMapFloor_TwoExitCorridor
} from "./furniture_maps";
import {enableZoneMusic, getCurrentZoneIndex, Zone, zones} from "./zones";
import { User } from "../userState";
import { changeFog, currentFog } from "../fog";
import {
    default_object_height,
    objectMapFloor_End,
    objectMapFloor_FourExitTrap,
    objectMapFloor_FourExitWhirly,
    objectMapFloor_Normal,
    objectMapFloor_Start,
    objectMapFloor_ThreeExitNarrow,
    objectMapFloor_ThreeExitWeird,
    objectMapFloor_TwoExit,
    objectMapFloor_TwoExitCorridor
} from "./objects_maps";
import {
    ink_spot_rate_modify,
    item_drop_rate,
    max_spot_rate,
    minimum_spot_rate,
    monster_spawns,
    monsters_enum
} from "./items_monsters_spawn";
import { inventoryItems } from "../../globals";
import {
    createInkMonster,
    createMimic,
    createWormMonster,
    removeInkMonster,
    removeMimic,
    removeWorm
} from "../../enemies/enemy";
import { createPickUp, placeInkSpot } from "../../objects/obstacles";
import {callPrompt, death, saveProgress, setCurrentHint, setupUi, ui_type} from "../../ui";
import {
    audiotape,
    casseteTapes,
    elevatorButton,
    elevatorDoors,
    generatorModel,
    generatorOn,
    liftGreenModel,
    liftRedModel,
    playerSounds,
} from "../../resources/resources";
import { enablePlayerSound } from "../playerSounds";
import {checkOccupiedCells, resetTimeToRecalculate} from "../../enemies/pathfinding";
import { elevatorText, gameText, generatorText, hellText } from "../text_collection";

enum RoomType {
    Start,
    End,
    Normal,
    TwoExit,
    TwoExitCorridor,
    ThreeExitWeird,
    ThreeExitNarrow,
    FourExitTrap,
    FourExitWhirly
}


enum Direction {
    North,
    East,
    South,
    West
}

interface Room {
    type: RoomType;
    coordinates: { x: number, y: number };
    direction: Direction;
    modelSrc: string;
    myEntity?: Entity;
    connectedRooms: Room[];
    roomTemplateIndex?: number;
}

interface Dungeon {
    grid: Room[][];
    start: Room;
    end: Room;
    path: Room[];
    branches: Room[][];
    level: number;
    zone: Zone;
    gridsize: number;
}


export let powered = true;


const decalMapFloorTypes: { [index: number]: any[] } = {
    [RoomType.Start]: decalMapFloor_Normal,
    [RoomType.End]: decalMapFloor_Normal,
    [RoomType.Normal]: decalMapFloor_Normal,
    [RoomType.TwoExit]: decalMapFloor_Normal,
    [RoomType.TwoExitCorridor]: decalMapFloor_Normal,
    [RoomType.ThreeExitWeird]: decalMapFloor_Normal,
    [RoomType.ThreeExitNarrow]: decalMapFloor_Normal,
    [RoomType.FourExitTrap]: decalMapFloor_Normal,
    [RoomType.FourExitWhirly]: decalMapFloor_Normal,
};

//This will remain on Normal only until their spawning is fixed
const decalMapWallTypes: { [index: number]: any[] } = {
    [RoomType.Start]: decalsWallMapFloor_Start,
    [RoomType.End]: decalsWallMapFloor_End,
    [RoomType.Normal]: decalsWallMapFloor_Normal,
    [RoomType.TwoExit]: decalsWallMapFloor_Normal,
    [RoomType.TwoExitCorridor]: decalsWallMapFloor_Normal,
    [RoomType.ThreeExitWeird]: decalsWallMapFloor_Normal,
    [RoomType.ThreeExitNarrow]: decalsWallMapFloor_Normal,
    [RoomType.FourExitTrap]: decalsWallMapFloor_Normal,
    [RoomType.FourExitWhirly]: decalsWallMapFloor_Normal,
};

const furnitureMapFloorTypes: { [index: number]: any[] } = {
    [RoomType.Start]: furnitureMapFloor_Start,
    [RoomType.End]: furnitureMapFloor_End,
    [RoomType.Normal]: furnitureMapFloor_Normal,
    [RoomType.TwoExit]: furnitureMapFloor_TwoExit,
    [RoomType.TwoExitCorridor]: furnitureMapFloor_TwoExitCorridor,
    [RoomType.ThreeExitWeird]: furnitureMapFloor_ThreeExitWeird,
    [RoomType.ThreeExitNarrow]: furnitureMapFloor_ThreeExitNarrow,
    [RoomType.FourExitTrap]: furnitureMapFloor_FourExitTrap,
    [RoomType.FourExitWhirly]: furnitureMapFloor_FourExitWhirly,
};

const objectMapFloorTypes: { [index: number]: any[] } = {
    [RoomType.Start]: objectMapFloor_Start,
    [RoomType.End]: objectMapFloor_End,
    [RoomType.Normal]: objectMapFloor_Normal,
    [RoomType.TwoExit]: objectMapFloor_TwoExit,
    [RoomType.TwoExitCorridor]: objectMapFloor_TwoExitCorridor,
    [RoomType.ThreeExitWeird]: objectMapFloor_ThreeExitWeird,
    [RoomType.ThreeExitNarrow]: objectMapFloor_ThreeExitNarrow,
    [RoomType.FourExitTrap]: objectMapFloor_FourExitTrap,
    [RoomType.FourExitWhirly]: objectMapFloor_FourExitWhirly,
};

//Shape components for pathfinding:
export const SmallBlock = engine.defineComponent('SmallBlock', {});
export const LargeBlock = engine.defineComponent('LargeBlock', {});


// Define shape components for each room type
export const objectMapShapes: { [index: number]: any } = {
    [RoomType.Start]: 'StartShape',
    [RoomType.End]: 'EndShape',
    [RoomType.Normal]: 'NormalShape',
    [RoomType.TwoExit]: 'TwoExitShape',
    [RoomType.TwoExitCorridor]: 'TwoExitCorridorShape',
    [RoomType.ThreeExitWeird]: 'ThreeExitWeirdShape',
    [RoomType.ThreeExitNarrow]: 'ThreeExitNarrowShape',
    [RoomType.FourExitTrap]: 'FourExitTrapShape',
    [RoomType.FourExitWhirly]: 'FourExitWhirlyShape',
};

// Define shape components for each room type
export const objectMapShapeComponents: { [index: number]: any } = {
    [RoomType.Start]: engine.defineComponent('StartShape', {}),
    [RoomType.End]: engine.defineComponent('EndShape', {}),
    [RoomType.Normal]: engine.defineComponent('NormalShape', {}),
    [RoomType.TwoExit]: engine.defineComponent('TwoExitShape', {}),
    [RoomType.TwoExitCorridor]: engine.defineComponent('TwoExitCorridorShape', {}),
    [RoomType.ThreeExitWeird]: engine.defineComponent('ThreeExitWeirdShape', {}),
    [RoomType.ThreeExitNarrow]: engine.defineComponent('ThreeExitNarrowShape', {}),
    [RoomType.FourExitTrap]: engine.defineComponent('FourExitTrapShape', {}),
    [RoomType.FourExitWhirly]: engine.defineComponent('FourExitWhirlyShape', {}),
};


export const shapeComponents = [
    'StartShape',
    'EndShape',
    'NormalShape',
    'TwoExitShape',
    'TwoExitCorridorShape',
    'ThreeExitWeirdShape',
    'ThreeExitNarrowShape',
    'FourExitTrapShape',
    'FourExitWhirlyShape'
];


const roomTemplates: { [index: number]: { model: string[], possibleDirections: Direction[] } } = {
    [RoomType.Start]: {
        model:
            ["models/rooms/coridor/baseRoomLift.glb", "models/rooms/backroom/baseRoomLift.glb", "models/rooms/horror/baseRoomLift.glb"],
        possibleDirections: [Direction.North]
    },
    [RoomType.End]: {
        model:
            ["models/rooms/coridor/baseRoom.glb", "models/rooms/backroom/baseRoom.glb", "models/rooms/horror/baseRoom.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.South, Direction.West]
    },
    [RoomType.Normal]: {
        model:
            ["models/rooms/coridor/baseRoom.glb", "models/rooms/backroom/baseRoom.glb", "models/rooms/horror/baseRoom.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.South, Direction.West]
    },
    [RoomType.TwoExit]: {
        model:
            ["models/rooms/coridor/2exit.glb", "models/rooms/backroom/2exit.glb", "models/rooms/horror/2exit.glb"],
        possibleDirections: [Direction.North, Direction.South]
    },
    [RoomType.TwoExitCorridor]: {
        model:
            ["models/rooms/coridor/2exitcorridor.glb", "models/rooms/backroom/2exitcorridor.glb", "models/rooms/horror/2exitcorridor.glb"],
        possibleDirections: [Direction.North, Direction.South]
    },
    [RoomType.ThreeExitNarrow]: {
        model:
            ["models/rooms/coridor/3exitnarrow.glb", "models/rooms/backroom/3exitnarrow.glb", "models/rooms/horror/3exitnarrow.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.West]
    },
    [RoomType.ThreeExitWeird]: {
        model:
            ["models/rooms/coridor/3exitweird.glb", "models/rooms/backroom/3exitweird.glb", "models/rooms/horror/3exitweird.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.West]
    },
    [RoomType.FourExitTrap]: {
        model:
            ["models/rooms/coridor/4exittrap.glb", "models/rooms/backroom/4exittrap.glb", "models/rooms/horror/4exittrap.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.South, Direction.West]
    },
    [RoomType.FourExitWhirly]: {
        model:
            ["models/rooms/coridor/4exitwhirly.glb", "models/rooms/backroom/4exitwhirly.glb", "models/rooms/horror/4exitwhirly.glb"],
        possibleDirections: [Direction.North, Direction.East, Direction.South, Direction.West]
    },
}


let roomEntities: Entity[] = [];
let planeEntities: Entity[] = [];
let decalEntities: Entity[] = [];
let monsterEntities: { monster: Entity, mon_enum: monsters_enum }[] = [];

const generateDungeon = (level: number): Dungeon => {
    let gridsize = Math.min(Math.max(3, level + 2), 5);
    //console.log("GRIDSIZE ==== ", gridsize)
    let grid: Room[][] = new Array(gridsize).fill([]).map(() => new Array(gridsize).fill(null));
    let path: Room[] = []
    let branches: Room[][] = []
    const zone = zones[getCurrentZoneIndex(level)]
    if (!zone) {
        throw new Error(`No zone defined for level ${level}`);
    }

    const start: Room = {
        type: RoomType.Start,
        coordinates: {x: 0, y: 0},
        direction: Direction.East,
        modelSrc: roomTemplates[RoomType.Start].model[getCurrentZoneIndex(level)],
        connectedRooms: []
    };
    grid[0][0] = start;

    const minDistance = 2
    const maxDistance = Math.min(3, level + 1); // Set this to your desired maximum distance
    const maxIterations = 3000; // Set this to the maximum number of iterations you're willing to allow
    let iterationCount = 0;

    //console.log(minDistance)
    //console.log(maxDistance)

    

    let endCoordinates: { x: number, y: number };
    do {
        endCoordinates = {
            x: Math.floor(Math.random() * maxDistance),
            y: Math.floor(Math.random() * maxDistance)
        };
        iterationCount++;

    } while (getEuclideanDistance(start.coordinates, endCoordinates) < minDistance && iterationCount < maxIterations);

    const end: Room = {
        type: RoomType.End,
        coordinates: endCoordinates,
        direction: Direction.South,
        modelSrc: roomTemplates[RoomType.End].model[getCurrentZoneIndex(level)],
        connectedRooms: []
    };
    grid[endCoordinates.y][endCoordinates.x] = end;

    // Generate basic rooms only from the East side of the Start room
    for (let x = 1; x < gridsize; x++) {
        const roomType = RoomType.Normal

        const room: Room = {
            type: roomType,
            coordinates: { x, y: 0 },
            direction: Direction.North,
            modelSrc: roomTemplates[roomType].model[getCurrentZoneIndex(level)],
            connectedRooms: []
        };

        grid[0][x] = room;
    }


    // Fill the remaining grid with random rooms
    for (let y = 1; y < gridsize; y++) {
        for (let x = 0; x < gridsize; x++) {
            // Skip if the room is already assigned
            if (grid[y][x]) {
                continue;
            }

            // Choose a random room type
            const roomType = Math.floor(Math.random() * (Object.keys(RoomType).length / 2 - 2)) + 2;

            const room: Room = {
                type: roomType,
                coordinates: { x, y },
                direction: Direction.North,
                modelSrc: roomTemplates[roomType].model[getCurrentZoneIndex(level)],
                connectedRooms: []
            };

            grid[y][x] = room;
        }
    }

    path = generatePath(grid, grid[0][1], end, gridsize);
    if (!path) {
        console.log("PATH GENERATION FAILED?!")
        path = generatePath(grid, grid[0][1], end, gridsize);
    }

    // Set the direction of the End room based on its adjacent room in the path
    if (path.length > 1) {
        const adjacentRoom = path[path.length - 2];
        //console.log(adjacentRoom)
        const dx = adjacentRoom.coordinates.x - end.coordinates.x;
        const dy = adjacentRoom.coordinates.y - end.coordinates.y;

        if (dx === 1) {
            end.direction = Direction.East;
        } else if (dx === -1) {
            end.direction = Direction.West;
        } else if (dy === 1) {
            end.direction = Direction.North;
        }

        //console.log(end.direction)
    }

    enableZoneMusic(level)

    if (User[0].explainedGame == false) {
        setupUi(ui_type.promt)
        callPrompt(gameText, 7, "OK", () => {setupUi(ui_type.game)});
        setCurrentHint(gameText)
        User[0].explainedGame = true
    }

    if ((User[0].explainedHell == false) && (level >= zones[2].minLevel)) {
        setupUi(ui_type.promt)
        callPrompt(hellText, 7, "OK", () => {setupUi(ui_type.game)});
        setCurrentHint(hellText);
        User[0].explainedHell = true
    }

    if (path.length > minDistance + 2) {
        if(level > 3){
        // Generate branches
        const maxBranches = Math.min(3, Math.floor(level / 2 - 1));  // Change this to control the maximum number of branches
        branches = generateBranches(grid, path, maxBranches, gridsize, end);

        // Remove connections outside the branches
        for (const branch of branches) {
            for (const room of branch) {

                removeConnectionsOutsideBranch(room, branch.slice(1, -1), path);
            }
        }
    }

        return {
            grid,
            start,
            end,
            path,
            branches,  // Add the branches to the dungeon object
            level,
            zone,
            gridsize
        };

    } else {
        console.log("DUNGEON GENERATION FAILED. RETRYING.")
        return generateDungeon(level)
    }


};


// Define possible moves
const moves = [
    { dx: -1, dy: 0 },  // West
    { dx: 1, dy: 0 },   // East
    { dx: 0, dy: -1 },  // North
    { dx: 0, dy: 1 },   // South
];

// Helper function to shuffle an array
const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Generates a path using randomized DFS
const generatePath = (grid: Room[][], start: Room, end: Room, gridsize: number): Room[] => {
    let stack: Room[] = [];
    let visited: boolean[][] = Array.from({ length: gridsize }, () => Array(gridsize).fill(false));
    stack.push(grid[0][0])
    stack.push(start);
    console.log("Visited:", visited)
    visited[0][0] = true;
    visited[start.coordinates.y][start.coordinates.x] = true;

    while (stack.length > 0) {
        let current = stack[stack.length - 1];

        // If we've reached the end, return the path
        if (current === end) {
            return stack;
        }

        // Get list of unvisited neighbors
        let neighbors: Room[] = [];
        for (let move of shuffle(moves)) {
            let nx = current.coordinates.x + move.dx;
            let ny = current.coordinates.y + move.dy;

            if (nx >= 0 && ny >= 0 && nx < gridsize && ny < gridsize && !visited[ny][nx] && grid[ny][nx]) {
                neighbors.push(grid[ny][nx]);
            }
        }

        if (neighbors.length > 0) {
            // Move to a random unvisited neighbor
            let next = neighbors[0];
            visited[next.coordinates.y][next.coordinates.x] = true;
            stack.push(next);
            current.connectedRooms.push(next);
            next.connectedRooms.push(current);

        } else {
            // If no unvisited neighbors, backtrack
            stack.pop();
        }
    }

    // If we haven't found a path, return an empty array
    return [];
};


const generateBranches = (grid: Room[][], path: Room[], maxBranches: number, gridsize: number, end: Room): Room[][] => {
    const branches: Room[][] = [];
    const branchableRooms = path.slice(1, -1);  // Exclude the start and end rooms
    let count = 0;
    let iterationLimit = 5000;
    let iterations = 0;

    while (count < maxBranches && branchableRooms.length > 0 && iterations < iterationLimit)  {
        iterations++;
        const indexFrom = Math.floor(Math.random() * branchableRooms.length);
        const roomFrom = branchableRooms.splice(indexFrom, 1)[0];

        // Choose another room from the path to be the end of the branch
        const indexTo = Math.floor(Math.random() * branchableRooms.length);
        const roomTo = branchableRooms[indexTo];
        if (roomTo === end) {
            continue; // Skip this iteration and choose another room
        }

        const branch = generatePath(grid, roomFrom, roomTo, gridsize);
        if (branch.length > 1) {
            connectBranchToPath(grid, branch, path, gridsize);
            branches.push(branch);
            count++;
            // Connect the branch rooms to the path rooms
            const roomFromNeighbor = path.find(room => getEuclideanDistance(roomFrom.coordinates, room.coordinates) === 1);
            const roomToNeighbor = path.find(room => getEuclideanDistance(roomTo.coordinates, room.coordinates) === 1);

            if (roomFromNeighbor && roomToNeighbor) {
                connectRooms(roomFrom, roomFromNeighbor);
                connectRooms(roomTo, roomToNeighbor);
            }
        }

    }

    return branches;
};

const connectRooms = (room1: Room, room2: Room) => {
    room1.connectedRooms.push(room2);
    room2.connectedRooms.push(room1);
};


const connectBranchToPath = (grid: Room[][], branch: Room[], path: Room[], gridsize: number) => {
    let stack = [branch[branch.length - 1]];
    let visited = Array.from({ length: gridsize }, () => Array(gridsize).fill(false));
    let maxIterations = gridsize * gridsize * gridsize; // Maximum number of iterations


    while (stack.length > 0 && maxIterations > 0) {
        let current = stack[stack.length - 1];
        visited[current.coordinates.y][current.coordinates.x] = true;

        if (path.includes(current)) {
            return;
        }

        let neighbors: Room[] = [];
        for (let move of shuffle(moves)) {
            let nx = current.coordinates.x + move.dx;
            let ny = current.coordinates.y + move.dy;

            if (nx >= 0 && ny >= 0 && nx < gridsize && ny < gridsize && !visited[ny][nx] && grid[ny][nx]) {
                neighbors.push(grid[ny][nx]);
            }
        }

        if (neighbors.length > 0) {
            let next = neighbors[0];
            visited[next.coordinates.y][next.coordinates.x] = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
};

const getValidRoomTemplates = (room: Room) => {
    const validRoomTemplates = [];
    for (let templateIndex of Object.keys(roomTemplates)) {
        const numIndex = Number(templateIndex);

        // Skip the start and end room templates for non-start/end rooms
        if (room.type !== RoomType.Start && room.type !== RoomType.End && (numIndex === RoomType.Start || numIndex === RoomType.End)) {
            continue;
        }

        const template = roomTemplates[numIndex];
        let validTemplate = true;
        for (let connectedRoom of room.connectedRooms) {
            const requiredDirection = getDirectionToConnectedRoom(room, connectedRoom);
            if (!template.possibleDirections.includes(requiredDirection)) {
                validTemplate = false;
                break;
            }
        }
        if (validTemplate) {
            validRoomTemplates.push(numIndex);
        }
    }
    return validRoomTemplates;
}


const getDirectionToConnectedRoom = (room: Room, connectedRoom: Room): Direction => {
    const dx = connectedRoom.coordinates.x - room.coordinates.x;
    const dy = connectedRoom.coordinates.y - room.coordinates.y;

    if (dx > 0) return Direction.East;
    if (dx < 0) return Direction.West;
    if (dy > 0) return Direction.North;
    if (dy < 0) return Direction.South;

    throw new Error(`Invalid connected room at ${connectedRoom.coordinates.x}, ${connectedRoom.coordinates.y}`);
}


const placeRoom = (room: Room, zone: Zone, dungeon: Dungeon, level: number) => {
    let chosenTemplateIndex;

    if (room.type === RoomType.Start) {
        chosenTemplateIndex = RoomType.Start;
    } else if (room.type === RoomType.End) {
        chosenTemplateIndex = RoomType.End;
    } else {
        const validRoomTemplates = getValidRoomTemplates(room);
        if (validRoomTemplates.length === 0) {
            throw new Error(`No valid room templates for room at ${room.coordinates.x}, ${room.coordinates.y}`);
        }
        chosenTemplateIndex = validRoomTemplates[Math.floor(Math.random() * validRoomTemplates.length)];
    }

    room.roomTemplateIndex = chosenTemplateIndex;


    const roomEntity = engine.addEntity();
    room.myEntity = roomEntity;
    roomEntities.push(roomEntity)

    // add the shape component to the room
    let roomShapeComponent = objectMapShapeComponents[chosenTemplateIndex];
    roomShapeComponent.create(roomEntity);


    GltfContainer.create(roomEntity, {
        src: roomTemplates[chosenTemplateIndex].model[getCurrentZoneIndex(level)],
        visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
        
    });

    //VisibilityComponent.create(roomEntity, { visible: false })

    let rotation = Quaternion.fromEulerDegrees(0, 0, 0);

    if (room.type === RoomType.Start) {
        rotation = Quaternion.fromEulerDegrees(0, Direction.East * 90, 0);
        createAudioTape(Vector3.create(2, 1.5, 3), roomEntity)
    }


    if (room.type === RoomType.End) {
        rotation = Quaternion.fromEulerDegrees(0, room.direction * 90, 0);
        createObjective(Vector3.create(0, 0, -5), roomEntity)
    }


    Transform.create(roomEntity, {
        position: Vector3.create(room.coordinates.x * 15 + 30, 0, room.coordinates.y * 15 + 30),
        rotation,
        scale: Vector3.create(0.985, 0.985, 0.985)
    });


    //pointerEventsSystem.onPointerDown({ entity: roomEntity, opts: { button: InputAction.IA_POINTER, hoverText: `VR` } }, function () { voiceRoom(room) });

    AudioSource.create(roomEntity, {
        audioClipUrl: elevatorDoors,
        loop: false,
        volume: 5,
        playing: false
    })

    Animator.create(roomEntity, {
        states: [
            {
                name: "lift_open",
                clip: "lift_open",
                playing: false,
                loop: false
            },
            {
                name: "lift_close",
                clip: "lift_close",
                playing: false,
                loop: false
            }
        ]
    })


    // block unconnected doorways
    blockDoorways(room, dungeon);

}

const voiceRoom = (room: Room) => {
    //console.log("REPORTING FOR ROOM:", room.coordinates)
    for (let i = room.connectedRooms.length - 1; i >= 0; i--) {
        //console.log(room.connectedRooms[i])
        //console.log(Direction[getDirectionToConnectedRoom(room, room.connectedRooms[i])])
    }
    //console.log(room.type)

}

const blockDoorways = (room: Room, dungeon: Dungeon) => {
    const x = room.coordinates.x;
    const y = room.coordinates.y;
    const level = dungeon.level;
    const gridsize = dungeon.gridsize;
    const grid = dungeon.grid;

    if (!x && !y) {
        return
    }

   // console.log(`placing doors for room at ${x}, ${y}`)
    // Check each direction around the room
    for (let direction = 0; direction < 4; direction++) {
        const dx = direction === Direction.East ? 1 : direction === Direction.West ? -1 : 0;
        const dy = direction === Direction.North ? 1 : direction === Direction.South ? -1 : 0;

        const nx = x + dx;
        const ny = y + dy;

        let outOfBounds = true;
        let isStartRoom = false;
        let connected = false;

        if (grid[ny] && grid[ny][nx]) {
            outOfBounds = !roomIncludedInPathOrBranch(grid[ny][nx], dungeon)
            isStartRoom = (grid[ny][nx] == dungeon.start && ny != y - 1)
            //console.log("connected rooms")
            connected = room.connectedRooms.includes(grid[ny][nx])
            room.connectedRooms.forEach(function (element) {
                //console.log(element.coordinates);
            });

        }


        //console.log(`Room at ${nx}, ${ny} is outOfBounds:${outOfBounds}, isStartRoom:${isStartRoom}, connected:${connected}`)

        const doorwayPosition = Vector3.create(
            (x + 0.5 * dx) * 15 + 30,
            0,
            (y + 0.5 * dy) * 15 + 30
        );
        const doorwayRotation = Quaternion.fromEulerDegrees(0, direction * 90 - 180, 0);

        // Block the doorway if it leads out of bounds or to a non-connected room
        if (room !== dungeon.start && !isStartRoom &&
            (nx < 0 || ny < 0 || outOfBounds ||
                nx >= gridsize || ny >= gridsize || !connected
            )) {

            if (nx < 0 || ny < 0 || outOfBounds ||
                nx >= gridsize || ny >= gridsize) {
                placeBlockingBarricade(doorwayPosition, doorwayRotation, level);
            }
            else {
                placeSeeThrough(doorwayPosition, doorwayRotation, level);
            }
        }
        else {
            placeEmpty(doorwayPosition, doorwayRotation, level);

        }

    }
};

const placeSeeThrough = (position: Vector3, rotation: Quaternion, level: number) => {

    const zone = zones[getCurrentZoneIndex(level)]

    //Barricade

    const doorEntity = engine.addEntity();
    planeEntities.push(doorEntity);  // keep track of door entities the same way as plane entities

    const randomDoorModel = zone.door_open_barricades[Math.floor(Math.random() * zone.door_open_barricades.length)];

    GltfContainer.create(doorEntity, {
        src: randomDoorModel,
    });


    Transform.create(doorEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation
    });

    //Door frame

    const doorFrameEntity = engine.addEntity();
    planeEntities.push(doorFrameEntity);  // keep track of door entities the same way as plane entities

    const doorFrameModel = zone.door_frame;

    GltfContainer.create(doorFrameEntity, {
        src: doorFrameModel,
    });

    Transform.create(doorFrameEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation
    });

}


const placeBlockingBarricade = (position: Vector3, rotation: Quaternion, level: number) => {

    const zone = zones[getCurrentZoneIndex(level)]

    //Barricade

    const doorEntity = engine.addEntity();
    planeEntities.push(doorEntity);  // keep track of door entities the same way as plane entities

    const randomDoorModel = zone.door_barricades[Math.floor(Math.random() * zone.door_barricades.length)];

    GltfContainer.create(doorEntity, {
        src: randomDoorModel,
    });


    Transform.create(doorEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation
    });

    //Door frame

    const doorFrameEntity = engine.addEntity();
    planeEntities.push(doorFrameEntity);  // keep track of door entities the same way as plane entities

    const doorFrameModel = zone.door_frame;

    GltfContainer.create(doorFrameEntity, {
        src: doorFrameModel,
    });

    Transform.create(doorFrameEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation
    });

}


const placeEmpty = (position: Vector3, rotation: Quaternion, level: number) => {

    const zone = zones[getCurrentZoneIndex(level)]
    //Door frame

    const doorFrameEntity = engine.addEntity();
    planeEntities.push(doorFrameEntity);  // keep track of door entities the same way as plane entities

    const doorFrameModel = zone.door_frame;

    GltfContainer.create(doorFrameEntity, {
        src: doorFrameModel,
    });

    Transform.create(doorFrameEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation
    });

}


const roomIncludedInPathOrBranch = (room: Room, dungeon: Dungeon): boolean => {
    if (dungeon.path.includes(room)) {
        return true;
    }

    if (dungeon.branches) {
        for (let branch of dungeon.branches) {
            if (branch.includes(room)) {
                return true;
            }
        }
    }

    return false;
}

const removeConnectionsOutsideBranch = (room: Room, branch: Room[], path: Room[]) => {
    if (room.connectedRooms.length <= 2) {
        return;
    }

    const orphanedRooms: Room[] = [];

    for (let i = room.connectedRooms.length - 1; i >= 0; i--) {
        const connectedRoom = room.connectedRooms[i];

        if (!branch.includes(connectedRoom) && !path.includes(connectedRoom)) {
            if (connectedRoom.connectedRooms.length <= 2) {
                orphanedRooms.push(connectedRoom);
            } else {
                connectedRoom.connectedRooms.splice(connectedRoom.connectedRooms.indexOf(room), 1);
                room.connectedRooms.splice(i, 1);
            }
        }
    }

    for (const orphanedRoom of orphanedRooms) {
        if (orphanedRoom.connectedRooms.length === 1) {
            const connectedRoom = orphanedRoom.connectedRooms[0];
            orphanedRoom.connectedRooms.splice(0, 1);
            connectedRoom.connectedRooms.splice(connectedRoom.connectedRooms.indexOf(orphanedRoom), 1);
        }
    }
};









const getEuclideanDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
};





//    let currentDecalMap = zone.decalMapFloorTypes[room.type]; // use zone-specific decal

const populateRoom = (room: Room, zone: Zone, level: number) => {
    if (!room) {
        console.log('Tried to populate a non-existing room');
        return;
    }


    //Floor

    let currentDecalMap = decalMapFloorTypes[room.type]

    if (!currentDecalMap) {
        console.log('No decal map!');
        return
    }


    for (let i = 0; i < currentDecalMap.length; i++) {

        if (room.myEntity != undefined) {
            decalEntities.push(createDecal(
                Vector3.create(currentDecalMap[i][0], defaultFloorHight, currentDecalMap[i][1]),
                Quaternion.fromEulerDegrees(90, Math.random() * 360, 0),
                room.myEntity,
                level,
                false
            )!)
        }

    }


    //Wall

    let currentWallDecalMap = decalMapWallTypes[room.type]

    //console.log("Room type  = == = =", room.type)
    //console.log("DECALMAP", currentWallDecalMap)
    //console.log("ROOM --- ", objectMapShapes[room.type])

    if (!currentWallDecalMap) {
        console.log('No decal map!');
        return
    }


    for (let i = 0; i < currentWallDecalMap.length; i++) {
        if (room.myEntity != undefined) {
            decalEntities.push(createDecal(
                Vector3.create(currentWallDecalMap[i][0], defaultWallHight, currentWallDecalMap[i][1]),
                Quaternion.fromEulerDegrees(0, currentWallDecalMap[i][2], 0),
                room.myEntity,
                level,
                true
            )!)
        }

    }

    //Furniture

    let currentFurnitureMap = furnitureMapFloorTypes[room.type]

    if (!currentFurnitureMap) {
        console.log('No currentFurnitureMap!');
        return
    }


    for (let i = 0; i < currentFurnitureMap.length; i++) {

        if (room.myEntity != undefined) {

            let entity = createFurniture(
                Vector3.create(currentFurnitureMap[i][0], defaultFloorHight, currentFurnitureMap[i][1]),
                Quaternion.fromEulerDegrees(0, Math.random() * 360, 0),
                room.myEntity,
                level
            )

            if (entity) {
                decalEntities.push(entity)
            }

        }

    }

}


export const removeAllEntities = () => {
    for (let room of roomEntities) {
        engine.removeEntity(room);
    }

    // Also remove all plane entities
    for (let planeEntity of planeEntities) {
        engine.removeEntity(planeEntity);
    }

    for (let decal of decalEntities) {
        engine.removeEntity(decal);
    }

    for (let monster of monsterEntities) {
        if (monster.mon_enum == monsters_enum.ink) {
            removeInkMonster();
        }
        if (monster.mon_enum == monsters_enum.worm) {
            removeWorm();
        }
        if (monster.mon_enum == monsters_enum.mimic) {
            removeMimic();
        }
    }

    // Reset the plane entities array
    planeEntities = [];

    decalEntities = [];

    monsterEntities = [];
};


const sanitizeConnectedRooms = (room: Room, dungeon: Dungeon) => {
    const x = room.coordinates.x;
    const y = room.coordinates.y;
    const grid = dungeon.grid;

    room.connectedRooms = room.connectedRooms.filter(connectedRoom => {
        const dx = Math.abs(connectedRoom.coordinates.x - x);
        const dy = Math.abs(connectedRoom.coordinates.y - y);

        // The connected room must be adjacent to the current room in the grid
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

        // The connected room must be included in the dungeon's path or a branch
        const isInPathOrBranch = roomIncludedInPathOrBranch(connectedRoom, dungeon);

        return isAdjacent && isInPathOrBranch;
    });

    // Remove duplicates
    room.connectedRooms = Array.from(new Set(room.connectedRooms));

    // If the room is the End room and has more than one connection, remove extras
    if (room.type === RoomType.End && room.connectedRooms.length > 1 || room.type === RoomType.Start && room.connectedRooms.length > 1) {
        // Store the room to be kept connected
        const roomToKeepConnected = room.connectedRooms[0];

        // Remove the End room from the connectedRooms of the other rooms
        for (let i = 1; i < room.connectedRooms.length; i++) {
            const index = room.connectedRooms[i].connectedRooms.indexOf(room);
            if (index > -1) {
                room.connectedRooms[i].connectedRooms.splice(index, 1);
            }
        }

        // Only keep the first connection
        room.connectedRooms = [roomToKeepConnected];

    }
}

const connectAdjacentRooms = (room: Room, dungeon: Dungeon) => {
    const x = room.coordinates.x;
    const y = room.coordinates.y;
    const grid = dungeon.grid;

    // If the room is the End room, skip this function
    if (room.type === RoomType.End) {
        return;
    }

    // If the room is the Start room, skip this function
    if (room.type === RoomType.Start) {
        return;
    }

    // Check if room has less than 2 connections
    if (room.connectedRooms.length < 2) {
        // Check each direction around the room
        for (let direction = 0; direction < 4; direction++) {
            const dx = direction === Direction.East ? 1 : direction === Direction.West ? -1 : 0;
            const dy = direction === Direction.North ? 1 : direction === Direction.South ? -1 : 0;

            const nx = x + dx;
            const ny = y + dy;

            // Check if the nearby room exists and it's not already connected
            if (grid[ny] && grid[ny][nx] && !room.connectedRooms.includes(grid[ny][nx])) {
                // Add it to the connectedRooms array
                // Prevent other rooms from connecting to the End room if it already has a connection
                if (grid[ny][nx].type === RoomType.End && grid[ny][nx].connectedRooms.length > 0) {
                    continue;
                }
                if (grid[ny][nx].type === RoomType.Start && grid[ny][nx].connectedRooms.length > 0) {
                    continue;
                }
                room.connectedRooms.push(grid[ny][nx]);
                // Also add the current room to the connectedRooms array of the nearby room to ensure the connection is bidirectional
                grid[ny][nx].connectedRooms.push(room);

                // If the room now has 2 connections, stop trying to connect to more rooms
                if (room.connectedRooms.length >= 2) {
                    break;
                }
            }
        }
    }
}


export const resetDungeon = (level: number) => {

    // if (DC && getDist(DC) > 32) {
    //     return
    // }


    User[0].currentFloor++

    //console.log(User[0].currentFloor)

    powered = false

    Transform.getMutable(DC).position.x = 24.07;
    GltfContainer.createOrReplace(DC, { src: liftRedModel });

    changeFog()
    let fog_vc = VisibilityComponent.get(currentFog)

    if (!fog_vc.visible) {
        VisibilityComponent.createOrReplace(currentFog, { visible: true })
    } 


    removeAllEntities();
    let dungeon = generateDungeon(level);
    //dungeon.grid = removeNonPathRooms(dungeon.grid, dungeon)

    let placed_rooms: Room[] = []; // Array to track already placed rooms
    let room_object_spawn_array: Room[] = [];

    for (let row of dungeon.grid) {
        for (let room of row) {
            sanitizeConnectedRooms(room, dungeon);
            connectAdjacentRooms(room, dungeon);
        }
    }

    for (let room of dungeon.path) {
        if (!placed_rooms.includes(room)) {
            placeRoom(room, dungeon.zone, dungeon, level);
            populateRoom(room, dungeon.zone, level);
            room_object_spawn_array.push(room);
            placed_rooms.push(room);
        }
    }

    for (let branch of dungeon.branches) {
        for (let room of branch) {
            if (!placed_rooms.includes(room)) {
                placeRoom(room, dungeon.zone, dungeon, level);
                populateRoom(room, dungeon.zone, level);
                if (room.type !== RoomType.Start && room.type !== RoomType.End) {
                    room_object_spawn_array.push(room);
                }
                placed_rooms.push(room);
            }
        }
    }

    resetTimeToRecalculate()
    checkOccupiedCells(0)

    fillLevelObjects(room_object_spawn_array, level);
    playStartRoomAnimation(dungeon)

    return dungeon;
};

function fillLevelObjects(rooms: Room[], level: number) {

    // randomizing room object/inks/monster spawnings
    if (!rooms.length)
        return 0;
    let items = Math.ceil(item_drop_rate * level);
    let spawn_target = Math.min(level - 1, monster_spawns.length - 1)
    let monsters = monster_spawns[spawn_target]
    let monsters_amount = monsters.length;
    //console.log("MONSTER COUNT", monsters_amount) 
    //console.log("MONSTERS", monsters)
    let ink_amount = 0;
    for (let mon of monsters){
        if (mon == monsters_enum.ink)
            ink_amount = Math.min(max_spot_rate, Math.floor(minimum_spot_rate + (ink_spot_rate_modify * level)));
    }

    while (items * inventoryItems.LAST_INDEX + monsters_amount + ink_amount > rooms.length) {
        if (items > 0) {
            items--;
        } else if (ink_amount > 0) {
            ink_amount--;
        } else {
            // if neither items or ink_amount can be decreased, then we can't satisfy the loop condition anymore
            // so break out of the loop to prevent it from running infinitely
            break;
        }
    }
    
    

    for (let i = 0; i < monsters_amount; i++) {
        let index = Math.floor(Math.random() * rooms.length);
        let currentMap = objectMapFloorTypes[rooms[index].type];
        while(rooms[index].type == RoomType.Start || rooms[index].type == RoomType.End) 
        {
            index = Math.floor(Math.random() * rooms.length);
        }
        if (rooms[index].myEntity != undefined ) {
            switch (monsters[i]) {
                case monsters_enum.ink:
                    //console.log("CREATING INK MONSTER")
                    monsterEntities.push({
                        monster: createInkMonster(Vector3.add(
                            Vector3.create(currentMap[Math.floor(Math.random() * currentMap.length)][0], default_object_height, currentMap[Math.floor(Math.random() * currentMap.length)][1]),
                            Transform.get(rooms[index].myEntity!).position)),
                        mon_enum: monsters_enum.ink
                    });
                    break;
                case monsters_enum.worm:
                    //console.log("CREATING WORM")
                    monsterEntities.push({
                        monster: createWormMonster(Vector3.add(
                            Vector3.create(currentMap[Math.floor(Math.random() * currentMap.length)][0], default_object_height, currentMap[Math.floor(Math.random() * currentMap.length)][1]),
                            Transform.get(rooms[index].myEntity!).position)),
                        mon_enum: monsters_enum.worm
                    });
                    break;
                case monsters_enum.mimic:
                    //console.log("CREATING MIMIC")
                    monsterEntities.push({
                        monster: createMimic(Vector3.add(
                            Vector3.create(currentMap[Math.floor(Math.random() * currentMap.length)][0], default_object_height, currentMap[Math.floor(Math.random() * currentMap.length)][1]),
                            Transform.get(rooms[index].myEntity!).position)),
                        mon_enum: monsters_enum.mimic
                    });
                    break;
            }
            rooms.splice(index, 1);
        }
        else{
            console.log("Map generation fault!")
        }
    }
        let cap_it = 500
        while ((items + ink_amount) && cap_it > 0) {
            cap_it--
            let index = Math.floor(Math.random() * rooms.length);
            let max_iter = 200
            while ((!rooms[index] || !rooms[index].type) && max_iter > 0) {
                index = Math.floor(Math.random() * rooms.length);
                max_iter--
            }
        
            if(!rooms[index]) {
                console.error('No suitable room found after max iterations');
                break;
            }
        
            let currentMap = objectMapFloorTypes[rooms[index].type];
        
            if (ink_amount && (rooms[index].type !== RoomType.Start && rooms[index].type !== RoomType.End) ) {
                decalEntities.push(placeInkSpot(Vector3.add(
                    Vector3.create(currentMap[Math.floor(Math.random() * currentMap.length)][0], default_object_height, currentMap[Math.floor(Math.random() * currentMap.length)][1]),
                    Transform.get(rooms[index].myEntity!).position)
                ));
                rooms.splice(index, 1);
                ink_amount--;
            } else {
                for (let i = 0; i < inventoryItems.LAST_INDEX; i++) {
                    let index = Math.floor(Math.random() * rooms.length);
                    if(!rooms[index]) {
                        console.error('No suitable room found');
                        break;
                    }
                    let currentMap = objectMapFloorTypes[rooms[index].type];
                    decalEntities.push(createPickUp(i, Vector3.add(
                        Vector3.create(currentMap[Math.floor(Math.random() * currentMap.length)][0], default_object_height, currentMap[Math.floor(Math.random() * currentMap.length)][1]),
                        Transform.get(rooms[index].myEntity!).position)
                    ));
                    rooms.splice(index, 1);
                }
                items--;
            }
        }
        

}


const MakeDummyElevator = (position: Vector3) => {
    const dummy = engine.addEntity()
    Transform.create(dummy, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation: Quaternion.fromEulerDegrees(0, 1 * 90, 0)

    })

    GltfContainer.create(dummy, { src: "models/rooms/baseRoomLift.glb" });

    AudioSource.create(dummy, {
        audioClipUrl: elevatorDoors,
        loop: false,
        volume: 5,
        playing: false
    })

    Animator.create(dummy, {
        states: [
            {
                name: "lift_open",
                clip: "lift_open",
                playing: true,
                loop: false
            },
            {
                name: "lift_close",
                clip: "lift_close",
                playing: false,
                loop: false
            }
        ]
    })

    return dummy
}

let dummyElevator = MakeDummyElevator(Vector3.create(30, 0, 30))


const createObjective = (position: Vector3, parent: Entity) => {
    const generator = engine.addEntity()

    GltfContainer.create(generator, { src: generatorModel });

    Transform.create(generator, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        parent: parent
    })

    planeEntities.push(generator)
    AudioSource.create(generator, {
        audioClipUrl: generatorOn,
        loop: true,
        volume: 5,
        playing: false
    })

    pointerEventsSystem.onPointerDown({ entity: generator, opts: { button: InputAction.IA_POINTER, hoverText: " Power" } }, function () {
        ;
        TurnOnPower()
        setupUi(ui_type.promt)
        callPrompt(generatorText, 5, "OK", () => {setupUi(ui_type.game)});
        setCurrentHint(generatorText);
        GltfContainer.createOrReplace(DC, { src: liftGreenModel })
        enablePlayerSound(playerSounds.knifeSwitch)
        AudioSource.getMutable(generator).playing = true
    });
    return generator
}

const createAudioTape = (position: Vector3, parent: Entity) => {
    const Tape = engine.addEntity()
    Transform.create(Tape, {
        position: position,
        scale: Vector3.create(2, 2, 2),
        parent: parent
    })

    GltfContainer.create(Tape, {
        src: audiotape,
        invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
        visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
    });

    pointerEventsSystem.onPointerDown({
        entity: Tape,
        opts: {button: InputAction.IA_POINTER, hoverText: "Play audiotape"}
    }, function () {
        //So we won't end up with another component
        if(AudioSource.getMutableOrNull(Tape) == null){
            playRecord(Tape)
        }
    });
    decalEntities.push(createDecal(
        position,
        Quaternion.fromEulerDegrees(0, 0, 0),
        parent,
        User[0].currentFloor,
        false
    )!)

    return Tape
}

const playRecord = (entity: Entity) => {
    
    let sounds = casseteTapes[Math.min(9, User[0].currentFloor - 1)]    

    // Create AudioSource component
    AudioSource.create(entity, {
        audioClipUrl: sounds,
        playing: false
    })

    // call function
    playSound(entity)
}

// Define a simple function
function playSound(entity: Entity) {

    // fetch mutable version of audio source component
    const audioSource = AudioSource.getMutable(entity)

    // modify its playing value
    audioSource.playing = true
}

export const TurnOnPower = () => {
    //console.log("PRESSED")
    powered = true
}

export const createDungeonController = (position: Vector3) => {
    const liftButton = engine.addEntity()
    Transform.create(liftButton, {
        position: position,
        rotation: Quaternion.fromEulerDegrees(0, Direction.East * 90, 0),
        scale: Vector3.create(2.4, 2.4, 2.4),
    })

    GltfContainer.create(liftButton, { src: liftGreenModel });

    CameraModeArea.create(liftButton, {
        area: Vector3.create(3 * 15 * 7, 10, 3 * 15 * 7),
        mode: CameraType.CT_FIRST_PERSON,
    })

    AvatarModifierArea.create(liftButton, {
        area: Vector3.create(3 * 15 * 7, 10, 3 * 15 * 7),
        excludeIds: [],
        modifiers: [AvatarModifierType.AMT_HIDE_AVATARS]
    })

    AudioSource.create(liftButton, {
        audioClipUrl: elevatorButton,
        playing: false
    })


    pointerEventsSystem.onPointerDown({
        entity: liftButton,
        opts: {button: InputAction.IA_POINTER, hoverText: "Activate Elevator"}
    }, function () {        
        AudioSource.getMutable(liftButton).playing = true
        if (powered) {

            if(User[0].currentFloor == 10)
            {   
                setupUi(ui_type.promt)
                callPrompt(
                    "Congratulations on surviving 10 layers of living nightmare!\n\
                    You can choose to wake up and have your name added to our leaderboard,\n\
                    Or continue to endless mode, where you can reach even deeper layers,\n\
                    Each increasing in difficulty!",
                    0,"Wake up",()=>{setupUi(ui_type.game), death()},"Go deeper",()=>{setupUi(ui_type.game), resetDungeon(User[0].currentFloor + 1), setCurrentHint(elevatorText)})            
                }
            else
            {
                saveProgress();
                resetDungeon(User[0].currentFloor + 1);
                setCurrentHint(elevatorText)
            }
        }

        else {
            saveProgress();
            setupUi(ui_type.promt)
            callPrompt(elevatorText, 5, "OK", () => {setupUi(ui_type.game)});
            setCurrentHint(elevatorText)
        }});
    return liftButton
}

const getDist = (entity: Entity) => {

    const playerPos = Transform.get(engine.PlayerEntity).position

    const transform = Transform.get(entity);

    return Vector3.distanceSquared(transform.position, { x: playerPos.x, y: 0.7, z: playerPos.z })
}

const playStartRoomAnimation = (dungeon: Dungeon) => {
    const startRoom = dungeon.start;

    if (startRoom.myEntity) {
        //Animator.playSingleAnimation(startRoom.myEntity, "lift_open")
        enablePlayerSound(elevatorDoors)
        Animator.playSingleAnimation(startRoom.myEntity, "lift_close")

    }

    if (dummyElevator) {
        //Animator.playSingleAnimation(dummyElevator, "lift_open")
        enablePlayerSound(elevatorDoors)
        Animator.playSingleAnimation(dummyElevator, "lift_close")

    }


    engine.removeEntity(dummyElevator)

    utils.timers.setTimeout(() => {
        openSesame(dungeon)
    }, 3500)

};

const openSesame = (dungeon: Dungeon) => {
    const startRoom = dungeon.start;
    if (startRoom.myEntity) {
        enablePlayerSound(elevatorDoors)
        Animator.playSingleAnimation(startRoom.myEntity, "lift_open")
        //Animator.playSingleAnimation(startRoom.myEntity, "lift_close")

    }
};


export let DC = createDungeonController(Vector3.create(24.62, 1.85, 30))


// Define a function to create and place a room based on the template
function createRoom(template: { model: string[], possibleDirections: Direction[] }, position: Vector3, rotation: Quaternion) {
    const roomEntity = engine.addEntity();
    Transform.create(roomEntity, {
        position: position,
        scale: Vector3.create(1, 1, 1),
        rotation: rotation
    });

    GltfContainer.create(roomEntity, { src: template.model[0] });
    return roomEntity
}


export function BuildRooms() {
    // Iterate over the room templates and create/place the corresponding rooms
    let offset = 0
    let counter = 0
    for (const roomType in roomTemplates) {
        offset = offset + 17
        counter++
        if (counter < 6) {
            const template = roomTemplates[roomType];
            const position = Vector3.create(offset, 0, 50); // Set the desired position
            const rotation = Quaternion.fromEulerDegrees(0, 1 * 90, 0); // Set the desired rotation

            let entity = createRoom(template, position, rotation);

            dummyPopulateRoom(getRoomTypeFromModel(template.model[0]), zones[1], 1, entity)
        } else {
            if (counter == 6) {
                offset = 17
        }
            const template = roomTemplates[roomType];
            const position = Vector3.create(offset, 0, 75); // Set the desired position
            const rotation = Quaternion.fromEulerDegrees(0, 1 * 90, 0); // Set the desired rotation

            let entity = createRoom(template, position, rotation);

            dummyPopulateRoom(getRoomTypeFromModel(template.model[0]), zones[1], 1, entity)
        }
    }
}


const dummyPopulateRoom = (room: RoomType, zone: Zone, level: number, myEntity: Entity) => {
    if (!room) {
        console.log('Tried to populate a non-existing room');
        return;
    }
    //Floor

    let currentDecalMap = decalMapFloorTypes[room]

    if (!currentDecalMap) {
        console.log('No decal map!');
        return
    }

    for (let i = 0; i < currentDecalMap.length; i++) {

        if (myEntity != undefined) {
            decalEntities.push(createDecal(
                Vector3.create(currentDecalMap[i][0], defaultFloorHight, currentDecalMap[i][1]),
                Quaternion.fromEulerDegrees(90, Math.random() * 360, 0),
                myEntity,
                level,
                false
            )!)
        }

    }

    //Wall

    let currentWallDecalMap = decalMapWallTypes[room]

    if (!currentWallDecalMap) {
        console.log('No decal map!');
        return
    }

    for (let i = 0; i < currentWallDecalMap.length; i++) {

        if (myEntity != undefined) {
            decalEntities.push(createDecal(
                Vector3.create(currentWallDecalMap[i][0], defaultWallHight, currentWallDecalMap[i][1]),
                Quaternion.fromEulerDegrees(0, currentWallDecalMap[i][2], 0),
                myEntity,
                level,
                true
            )!)
        }

    }

    //Furniture

    let currentFurnitureMap = furnitureMapFloorTypes[room]

    if (!currentFurnitureMap) {
        console.log('No currentFurnitureMap!');
        return
    }

    for (let i = 0; i < currentFurnitureMap.length; i++) {

        if (myEntity != undefined) {

            let entity = createFurniture(
                Vector3.create(currentFurnitureMap[i][0], defaultFloorHight, currentFurnitureMap[i][1]),
                Quaternion.fromEulerDegrees(0, Math.random() * 360, 0),
                myEntity,
                level
            )

            if (entity) {
                decalEntities.push(entity)
            }

        }

    }

}


function getRoomTypeFromModel(model: string): RoomType {
    for (const key in roomTemplates) {
        for (let i = 0; i < roomTemplates[key].model.length; i++) {
            if (roomTemplates[key].model[i] === model) {
                return parseInt(key);
            }
        }
    }
    throw new Error(`No RoomType found for model: ${model}`);
}