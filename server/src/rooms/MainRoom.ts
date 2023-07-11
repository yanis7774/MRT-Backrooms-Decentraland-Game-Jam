import {Client, Room} from "colyseus";
import {MainRoomState} from "./schema/MainRoomState";
import {
    addActionList,
    getConfigsFromDb,
    getLeaderStats,
    getLeaderboard,
    getUserFromDB,
    joinUser,
    saveUserToDB
} from "./dbUtils";
import {ethers} from "ethers";
import {
    MAX_HEALTH,
    leaderboard,
    refreshLeaderboard,
    updateConfigMap,
} from "./env";

setTimeout(async ()=>{
    updateLeaderboard();
    console.log("UPDATED LEADERBOARD")
}, 15000)
export class MainRoom extends Room<MainRoomState> {

    onCreate(options: any) {
        this.setState(new MainRoomState());
        this.roomId = options.roomId;

        this.setUp(this);
        console.log("Room created! ", this.roomId);

        setInterval(async ()=>{
            this.broadcast("updateLeaderboard",{global: leaderboard});
        }, 15000)

        this.onMessage("setLeader", async (client: Client, message) => {
            const user = this.state.users.get(client.sessionId);
            const userDb = await getUserFromDB(user.address);
            console.log(message)
            let editFlag = false;
            if (message.timeLeader != undefined && (userDb?.timeLeader == -1 || message.timeLeader < userDb.timeLeader)) {
                userDb.timeLeader = message.timeLeader;
                editFlag = true;
            }
            if (message.deathLeader != undefined) {
                userDb.deathLeader++;
                editFlag = true;
            }
            if (message.roomLeader != undefined && (userDb.roomLeader == -1 || message.roomLeader > userDb.roomLeader)) {
                userDb.roomLeader = message.roomLeader;
                editFlag = true;
            }
            if (editFlag) {
                console.log("saving user " + user)
                await saveUserToDB(userDb);
                await updateLeaderboard();
                this.broadcast("updateLeaderboard",{global: leaderboard})
            }
        })

        this.onMessage("damageReceived", async (client: Client, message) => {
            const user = this.state.users.get(client.sessionId)
            if (user.healthPoints) {
                user.healthPoints -= message.amount;
                client.send("setHealth", {health: user.healthPoints});
            }
            if (!user.healthPoints) {
                user.healthPoints = MAX_HEALTH;
                client.send("deadPlayer", {});
            }
        })

        this.onMessage("healingReceived", async (client: Client, message) => {
            const user = this.state.users.get(client.sessionId)
            user.healthPoints += message.amount;
            if(user.healthPoints>MAX_HEALTH + user.healthBuff){
                user.healthPoints = MAX_HEALTH + user.healthBuff
            }
            client.send("setHealth", {health: user.healthPoints});
        })

        this.onMessage("healthBuffing", async (client: Client, message) => {
            const user = this.state.users.get(client.sessionId)
            user.healthBuff += message.amount;
            client.send("setHealthBuff", {buff: user.healthBuff});
        })

        this.onMessage("statAction", async (client: Client, message) => {
            const user = this.state.users.get(client.sessionId)
            if (!user.noWeb3) {
                user.statAction(message.type,message.action);
            }
        })

        this.onMessage("setupUser", async (client, message) => {
            if (this.state.users.has(client.sessionId)) {
                try {
                    let newUser = this.state.users.get(client.sessionId);
                    if (!newUser.noWeb3) {
                        // potential setup
                    } else {
                        // no Web3 setup
                    }
                } catch (e) {
                    console.log("Error: ", e)
                }
            } else {
                console.log("Setup user failed, no user in state");
            }
        })

        // endregion

        this.onMessage("disconnect", (client) => {
            console.log("disconnect")
            client.send("disconnect");
        });
    }

    async setUp(room: Room) {
        updateConfigMap(await getConfigsFromDb());
    }

    async onJoin(client: Client, options: any) {
        // client.send("deadPlayer", {});

        console.log("JOINING")
        const address = options.userData.publicKey
        const userDbInstance = await getUserFromDB(address, {banned: 1})

        if (userDbInstance && userDbInstance?.banned) {
            client.send("banned")
            this.onLeave(client, true)
        } else {
            let result = await joinUser(this, options, client)
            if (result == undefined) {
                this.onLeave(client, true)
            } else {
                if (result.noWeb3)
                    client.send("noWeb3");
                client.send("setupUser",{adminStatus: result.adminStatus, global: leaderboard, personal: await getLeaderStats(address)});
            }
        }

    }

    async onLeave(client: Client, consented: boolean) {
        const user = this.state.users.get(client.sessionId);
        if (this.state.users.has(client.sessionId)) {
            user.connected = false;
        }
        console.log("OnLeave Lobby, consented: ", consented)

        try {
            if (consented) {
                if (this.state.users.has(client.sessionId)) {
                    await addActionList(user.address,user.statActionList,client.sessionId);
                    this.state.users.delete(client.sessionId);
                    console.log(user?.name, "left!");
                } else {
                    console.log("No such user in the state!");
                }
            } else {
                const reconnected = await this.allowReconnection(client, 20);
                console.log("reconnected", reconnected.id)
                reconnected.send(`ping`, reconnected);
                user.connected = true;
            }


        } catch (e) {
            if (this.state.users.has(client.sessionId)) {
                await addActionList(user.address,user.statActionList,client.sessionId);
                this.state.users.delete(client.sessionId);
            }
            console.log("catch 20 seconds expired.", e)
            // 20 seconds expired. let's remove the client.
        }

    }

    onDispose() {
        console.log("Disposing lobby room...");
    }

    /*async mainRoomSend(func: string, args: any[]) {
        let mainRooms = await matchMaker.query({name: "lobby_room"});
        mainRooms.forEach(async (roomObj)=>{
            if (this.roomId != roomObj.roomId)
                await matchMaker.remoteRoomCall(roomObj.roomId, func, args);
        })
    }*/

}

async function updateLeaderboard() {
    refreshLeaderboard(await getLeaderboard()); 
}

async function getProvider(rpc_address: string) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpc_address)
        return provider
    } catch (e) {
        console.log("Check NFT Error", e)
        return undefined
    }
}

function getSigner(privateKey: string, rpc_address: string) {
    const walletPrivateKey = new ethers.Wallet(privateKey)
    const provider = new ethers.providers.JsonRpcProvider(rpc_address)
    const signer = walletPrivateKey.connect(provider)

    return {signer, provider}
}