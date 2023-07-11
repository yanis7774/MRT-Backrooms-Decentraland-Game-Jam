import { Entity, InputAction, MeshCollider, MeshRenderer, Transform, engine, executeTask, pointerEventsSystem } from "@dcl/sdk/ecs";
import { getSceneInfo } from "~system/Scene";
import { Vector3 } from "@dcl/sdk/math";
import { Box, CandleBlock } from "../objects/obstacleComponents";
import { powered, shapeComponents } from "../modules/mapgen/levelgeneration";
import { roomShapes } from "../modules/mapgen/roomShapes";

const parcel_length = 64;
const occupy_entity_list = [
    Box,
]


export let gridContainer: Grid[] = []
export class Grid {
    public cell_size: number = 1;
    public base: {x: number, z: number} = {x: 0, z: 0};
    public furthest: {x: number, z: number} = {x: 0, z: 0};
    public length_x: number = 0;
    public length_z: number = 0;
    public cell_len_x: number = 0;
    public cell_len_z: number = 0;
    public cell: number[][] = [];
    public cell_box: Entity[][] = [];

    constructor() {
        executeTask(async ()=>{ // making base empty grid out of parcel info in scene.json
            let info = JSON.parse((await getSceneInfo({})).metadata);
            this.base = {
                x: Number(info.scene.base.substring(0,info.scene.base.indexOf(','))),
                z: Number(info.scene.base.substring(info.scene.base.indexOf(',')+1,info.scene.base.length))
            };
            this.furthest = {x: this.base.x, z: this.base.z};
            for(let i = 0; i < info.scene.parcels.length; i++) {
                let x = Number(info.scene.parcels[i].substring(0,info.scene.parcels[i].indexOf(',')));
                let z = Number(info.scene.parcels[i].substring(info.scene.parcels[i].indexOf(',')+1,info.scene.parcels[i].length));
                if (x > this.furthest.x) this.furthest.x = x;
                if (z > this.furthest.z) this.furthest.z = z;
            }
            this.length_x = this.furthest.x - this.base.x + 1;
            this.length_z = this.furthest.z - this.base.z + 1;
            this.cell_len_x = this.length_x*(parcel_length/this.cell_size);
            this.cell_len_z = this.length_z*(parcel_length/this.cell_size);
            for(let i = 0; i < this.cell_len_x; i ++) {
                let row = []
                for(let j = 0; j < this.cell_len_z; j ++)
                    row.push(0);
                this.cell.push(row);
            }
            gridContainer.push(this);
            engine.addSystem(checkOccupiedCells);
        })
    }

    clearGrid() {
        for(let i = 0; i < this.cell_len_x; i++)
            for(let j = 0; j < this.cell_len_z; j++)
                this.cell[i][j] = 0;
    }

    samePoint(start: Vector3, end: Vector3) {
        const start_point = {x: Math.floor(start.x / this.cell_size), z: Math.floor(start.z / this.cell_size)}
        const end_point = {x: Math.floor(end.x / this.cell_size), z: Math.floor(end.z / this.cell_size)}
        return start_point.x == end_point.x && start_point.z == end_point.z
    }
    getPath(start: Vector3, end: Vector3) {
        const MAX_ITERATIONS = 1350;
        let iterations = 0;
        const start_point = {x: Math.floor(start.x / this.cell_size), z: Math.floor(start.z / this.cell_size)}
        const end_point = {x: Math.floor(end.x / this.cell_size), z: Math.floor(end.z / this.cell_size)}
        if (start_point.x == end_point.x && start_point.z == end_point.z)
            return []
        if (start_point.x < 0 || start_point.z < 0 || start_point.x >= this.cell_len_x || start_point.z >= this.cell_len_z)
            return []
        if (end_point.x < 0 || end_point.z < 0 || end_point.x >= this.cell_len_x || end_point.z >= this.cell_len_z)
            return []
        let check_grid: number[][] = [];
        let from_grid: {x:number,z:number}[][] = [];
        let queue: {x: number, z: number, cost: number, steps: number}[] = [{
            x: start_point.x, z: start_point.z,
            cost: Math.abs(end_point.x-start_point.x)+Math.abs(end_point.z-start_point.z),
            steps: 0
        }];
        for(let i=0; i<this.cell_len_x; i++) {
            let row: number[] = []
            let coord_row: {x:number,z:number}[] = []
            for(let j=0; j<this.cell_len_z; j++) {
                row.push(0);
                coord_row.push({x:-1,z:-1});
            }
            check_grid.push(row);
            from_grid.push(coord_row);
        }
        check_grid[start_point.x][start_point.z] = 1;
        let path_found = false;
        while(queue.length && iterations < MAX_ITERATIONS) {
            iterations++
            let priority = {cost: 999999, next: -1};
            for (let i = 0; i < queue.length; i++){
                if (queue[i].cost < priority.cost) {
                    priority.cost = queue[i].cost;
                    priority.next = i;
                }
            }
            let next = queue[priority.next];
            queue.splice(priority.next,1);
            for(let i = -1; i < 2; i++) {
                for(let j = -1; j < 2; j++) {
                    if (next.x+i >= 0 && next.x+i < this.cell_len_x && next.z+j >= 0 && next.z+j < this.cell_len_z) {
                        if (next.x+i == end_point.x && next.z+j == end_point.z) {
                            path_found = true;
                            from_grid[next.x+i][next.z+j] = {x:next.x,z:next.z};
                            check_grid[next.x+i][next.z+j] = 1;
                            break;
                        }
                        if (check_grid[next.x+i][next.z+j] == 0 && this.cell[next.x+i][next.z+j] == 0) {
                            queue.push({
                                x:next.x+i,z:next.z+j,steps:next.steps+1,
                                cost:next.steps+1+Math.abs(end_point.x - (next.x+i))+Math.abs(end_point.z - (next.z+j))
                            })
                            from_grid[next.x+i][next.z+j] = {x:next.x,z:next.z};
                            check_grid[next.x+i][next.z+j] = 1;
                        }
                    }
                }
                if (path_found) break;
            }
            if (path_found) break;
        }

        if (iterations === MAX_ITERATIONS) {
            // The target is probably unreachable.
            return [];
        }

        if (path_found) {
            let result: Vector3[] = [];
            let next_point = end_point;
            result.push(end);
            while(true) {
                next_point = from_grid[next_point.x][next_point.z];
                if ((next_point.x == start_point.x && next_point.z == start_point.z) || next_point.x == -1)
                    break;
                else
                    result.push(Vector3.create((next_point.x+0.5) * this.cell_size, 0.7, (next_point.z+0.5) * this.cell_size))
            }
            result.reverse();
            return result;
        } else {
            return []
        }
    }
}

let visEntities: Entity[] = [];

 let timeToRecalculate = 999999;

export function resetTimeToRecalculate()
{
    timeToRecalculate = 0;
    console.log("Recalculation time reset.")
}

export function checkOccupiedCells(dt: number) {
    if(timeToRecalculate > 0)
    {
        timeToRecalculate--
        return
    }
    console.log("Recalculating")
    timeToRecalculate = 999999
    if (gridContainer[0]) {
        gridContainer[0].clearGrid();
        for(let i = 0; i < occupy_entity_list.length; i++) {
            const occupiers = engine.getEntitiesWith(occupy_entity_list[i],Transform);
            for (const [entity] of occupiers) {
                const transform = Transform.getMutable(entity);
                let pos = {x: Math.floor(transform.position.x / gridContainer[0].cell_size), z: Math.floor(transform.position.z / gridContainer[0].cell_size)}
                if (pos.x < gridContainer[0].cell_len_x && pos.z < gridContainer[0].cell_len_z) {
                    gridContainer[0].cell[pos.x][pos.z] = 1;
                }
            }
        }
        // candles block 3x3 around them
        const candles = engine.getEntitiesWith(CandleBlock,Transform);
        for (const [entity] of candles) {
            const transform = Transform.getMutable(entity);
            let pos = {x: Math.floor(transform.position.x / gridContainer[0].cell_size), z: Math.floor(transform.position.z / gridContainer[0].cell_size)}
            for(let i = -1; i < 2; i++)
                for(let j = -1; j < 2; j++)
                    if (pos.x+i < gridContainer[0].cell_len_x && pos.z+j < gridContainer[0].cell_len_z) {
                        gridContainer[0].cell[pos.x+i][pos.z+j] = 1;
                    }
        }


        for (let shape of shapeComponents) {
            const rooms = engine.getEntitiesWith(engine.getComponent(shape), Transform);
            for (const [entity] of rooms) {
                const transform = Transform.getMutable(entity);
                // Here, calculate the positions of the occupied cells based on the specific shape associated with this room
                let occupiedCells = calculateOccupiedCells(transform.position, shape);
                for (let pos of occupiedCells) {
                    if (pos.x < gridContainer[0].cell_len_x && pos.z < gridContainer[0].cell_len_z) {
                        gridContainer[0].cell[pos.x][pos.z] = 1;
                    }
                }
            }
        }


    }
    
    
    //if(powered){
    //    visualizeOccupiedCells(gridContainer[0].cell);
    //}
    
    }


function calculateOccupiedCells(roomPosition: Vector3, shape: string): {x: number, z: number}[] {
    let occupiedCells: {x: number, z: number}[] = [];
    let map = roomShapes[shape];
    if (map) {
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (map[i][j] === '#') {
                    let pos = {x: Math.floor((roomPosition.x + i) / gridContainer[0].cell_size) - 7 , z: Math.floor((roomPosition.z + j) / gridContainer[0].cell_size) - 7};
                    occupiedCells.push(pos);
                }
            }
        }
    }
    return occupiedCells;
}


function visualizeOccupiedCells(grid: number[][]) {
    for (let ve of visEntities) {
        engine.removeEntity(ve);
    }
    // loop over each cell in the grid
    for(let x = 0; x < grid.length; x++) {
        for(let z = 0; z < grid[x].length; z++) {
            // if the cell is occupied
            if(grid[x][z] == 1) {
                // create a cube at this cell's position
                const cubeEntity = engine.addEntity();
                const cubePosition = Vector3.create(x * gridContainer[0].cell_size, 0.5, z * gridContainer[0].cell_size);
                Transform.create(cubeEntity, {
                    position: cubePosition,
                    scale: Vector3.create(0.7, 0.7, 0.7),
                });
                MeshRenderer.setBox(cubeEntity);
                MeshCollider.setBox(cubeEntity);
                visEntities.push(cubeEntity)
                pointerEventsSystem.onPointerDown({ entity: cubeEntity, opts: { button: InputAction.IA_POINTER, hoverText: String(x) + " " + String(z) } }, function () { console.log(x, z) });

            }
        }
    }
}
