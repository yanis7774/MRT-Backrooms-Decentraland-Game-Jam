import { engine, executeTask } from '@dcl/sdk/ecs'

import { ToggleFog, initUi} from './ui'
import { initEnemySystems } from './enemies/enemySystems'
import { getUserData } from '~system/UserIdentity'
import { UserState } from './modules/userState'
import { getCurrentRealm } from '~system/EnvironmentApi'
import config from './config'
import { connectionColyseus } from './modules/connection'
import { Grid } from './enemies/pathfinding'
import { pickUpSystem, rotateSystem, trapSystem } from './objects/obstacleSystems'
import { shapeComponents } from './modules/mapgen/levelgeneration'
import { createBox } from './objects/obstacles'
import { Vector3 } from '@dcl/sdk/math'
import {movePlayerTo} from "~system/RestrictedActions";
import { backpackSystem } from './inputSystem'


export function initGamePlay() {

  executeTask(async () => {
         
        console.log("STARTING...");
        const data = await getUserData({});
        await connectionColyseus(data.data);
        new UserState(data.data);
        const realm = await getCurrentRealm({});
        
        console.log("realm = " + realm);
        console.log("data", data);
        console.log("VERSION: ", config.version);
        

        // Defining behavior. See `src/systems.ts` file.
        //engine.addSystem(trapSystem);
        engine.addSystem(pickUpSystem);
        engine.addSystem(rotateSystem);
        engine.addSystem(backpackSystem);

        initEnemySystems();
        new Grid();
        movePlayerTo({newRelativePosition: Vector3.create(32, 1, 30)})

        ToggleFog();
        initUi();
  })
  
}