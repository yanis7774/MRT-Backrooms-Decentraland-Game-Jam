import {DI} from "../config/database.config";
import {User} from "../entities/UserEntity";
import {Client} from "colyseus";
import {Player} from "./schema/MainRoomState";
import { Stat } from "../entities/StatEntity";
import { ConfigEntity } from "../entities/ConfigEntity";
import { checkAdmin } from "./env";

type UserData = {
    publicKey: string,
    displayName: string
    banned: boolean;
}
interface leader {
    address: string,
    name: string,
    rooms: number,
    timer: number,
    deaths: number,
}
export async function addActionList(address: string, actionList: {type:string,action:string}[], sessionId: string) {
    const statRepo = DI.em.fork().getRepository(Stat);
    let statArray: Stat[] = [];
    for(let i = 0; i < actionList.length; i++) {
        statArray.push(new Stat(address,actionList[i].type,actionList[i].action,sessionId));
    }
    statRepo.persist(statArray).flush();
}

export async function getConfigsFromDb() {
    const configRepo = DI.em.fork().getRepository(ConfigEntity);
    return await configRepo.findAll();
}

export async function getLeaderStats(address: string) {
    const userRepo = DI.em.fork().getRepository(User);
    const user = await userRepo.findOne({address: address});
    if (user)
        return {address: user.address, name: user.name, timer: user.timeLeader, rooms: user.roomLeader, deaths: user.deathLeader};
    else
        return {address: "", name: "", timer: 0, rooms: 0, deaths: 0};
}

export async function getLeaderboard() {
    let leaderboard: {timer: leader[], room: leader[], deaths: leader[]} = {timer: [], room: [], deaths: []};
    const userRepo = DI.em.fork().getRepository(User);
    const usersTime = await userRepo.find({timeLeader: {$ne:-1}});
    const usersRoom = await userRepo.find({roomLeader: {$ne:-1}});
    const usersDeath = await userRepo.find({deathLeader: {$ne:0}});
    const usersSortedTime = usersTime.sort((a,b)=>a.timeLeader-b.timeLeader);
    const usersSortedRoom = usersRoom.sort((a,b)=>b.roomLeader-a.roomLeader);
    const usersSortedDeath = usersDeath.sort((a,b)=>b.deathLeader-a.deathLeader);
    for(let i = 0; i < usersSortedTime.length; i++) {
        leaderboard.timer.push({address: usersSortedTime[i].address, name: usersSortedTime[i].name, timer: usersSortedTime[i].timeLeader, rooms: usersSortedTime[i].roomLeader, deaths: usersSortedTime[i].deathLeader});
    }
    for(let i = 0; i < usersSortedRoom.length; i++) {
        leaderboard.room.push({address: usersSortedRoom[i].address, name: usersSortedRoom[i].name, timer: usersSortedRoom[i].timeLeader, rooms: usersSortedRoom[i].roomLeader, deaths: usersSortedRoom[i].deathLeader});
    }
    for(let i = 0; i < usersSortedDeath.length; i++) {
        leaderboard.deaths.push({address: usersSortedDeath[i].address, name: usersSortedDeath[i].name, timer: usersSortedDeath[i].timeLeader, rooms: usersSortedDeath[i].roomLeader, deaths: usersSortedDeath[i].deathLeader});
    }
    return leaderboard;
}

export async function getUserFromDB(pubicKey: string, projection: any = undefined) {
    const userRepo = DI.em.fork().getRepository(User);
    let user;
    if (projection == undefined)
        user = await userRepo.find({address: pubicKey});
    else
        user = await userRepo.find({address: pubicKey},projection);
    return user[0]
}

export async function saveUserToDB(user: User) {
    const userRepo = DI.em.fork().getRepository(User);
    userRepo.persist(user).flush();
}

export async function saveNewUserToDB(userData: UserData) {
    const userRepo = DI.em.fork().getRepository(User);
    const user = new User(
        userData.publicKey,
        userData.displayName,
        false
    )

    userRepo.persist(user);
    await userRepo.flush();

    return user
}

export async function joinUser(roomObject: any, options: any, client: Client) {
    console.log("User Join", roomObject.roomName, options.userData.publicKey);

    if (options.userData.publicKey) {
        const existingUser = await getUserFromDB(options.userData.publicKey)

        if (existingUser) {
            const user = new Player().assign(existingUser)
            user.connected = true;
            await saveUserToDB(existingUser);
            if (checkAdmin(existingUser.address))
                user.adminStatus = true;
            roomObject.state.users.set(client.sessionId, user);
            console.log(existingUser.name, "joined as old user! => ");
            client.send("userData", {user: existingUser, noWeb3: false})
            return user

        } else {
            const user = await saveNewUserToDB(options.userData)
            const newUser = new Player().assign(user);
            newUser.connected = true;
            if (checkAdmin(user.address))
                newUser.adminStatus = true;
            roomObject.state.users.set(client.sessionId, newUser);
            console.log(newUser.name, "joined as new user! => ");
            client.send("userData", {user: newUser, noWeb3: false})
            return newUser;
        }

    } else {

        console.log("No publicKey. No web3");
        const user = new Player();
        user.noWeb3 = true;
        user.connected = true;
        user.address = options.userData.userId.toLowerCase();
        user.name = options.userData.displayName;
        roomObject.state.users.set(client.sessionId, user);
        console.log(user.name, "joined as no web3 user! => ");
        client.send("userData", {user: user, noWeb3: true});
        return user
    }
}

export async function ban(userDbInstance: any, client: Client, issueString: string) {
    const userRepo = DI.em.fork().getRepository(User);
    console.log("BANNED: ", issueString)
    userDbInstance.banned = true
    await userRepo.persist(userDbInstance).flush();
    client.send("banned");
}