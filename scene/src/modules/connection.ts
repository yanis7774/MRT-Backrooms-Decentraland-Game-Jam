import { Client, Room } from "colyseus.js"
import { getCurrentRealm, isPreviewMode } from "~system/EnvironmentApi"
import { MAX_HEALTH, backend_wss, globalRooms, setLeaderboardData } from "../globals"
import { getUserData } from "~system/UserIdentity"
import { User } from "./userState"
import { death } from "../ui"

export class NetworkManager {
    client!: Client
    room!: Room
    roomName!: string
    roomId!: string
    options!: any
    userData!: any

    constructor(roomName: string, options: any, userData: any, roomId: string = 'id') {
        this.roomName = roomName
        this.options = options
        this.userData = userData
        this.roomId = roomId
    }

    async start() {
        console.log("GETTING ENDPOINT");
        this.client = new Client(await getEndpoint());
        console.log("GOT CLIENT");
        await this.getUserData()
        await this.connect();


    }

    async getUserData() {
        const realm = await getCurrentRealm({});
        this.options.realm = realm.currentRealm?.displayName;

        if (!this.userData) {
            this.options.userData = (await getUserData({})).data;
        } else {
            this.options.userData = this.userData
        }
    }

    async connect() {
        try {
            if (this.roomName == "lobby_room") {
                console.log("CONNECTING...")                
                const availableRooms = await this.client.getAvailableRooms(this.roomName);

                let roomExist = false
                let connectId = this.options.roomId;
                for (let room of availableRooms) {
                    if (room.roomId == this.options.roomId) {
                        roomExist = true
                    }
                }

                this.room = !roomExist ? await this.client.create<any>(this.roomName, this.options)
                    : await this.client.joinById<any>(connectId, this.options)

                await this.addLobbyListeners();

                console.log("joined successfully to lobby:", this.room);
            }

            return this.room


        } catch (e) {
            console.log("CONNECTING FAILED...")
            console.log("e", e);
        }
    }

    private async addLobbyListeners() {

        this.room.onLeave(async (code) => {
            globalRooms.pop()
            this.client = await new Client(await getEndpoint());
            this.room = await this.client.reconnect(this.room.id, this.room.sessionId);
            await this.addLobbyListeners();

            globalRooms.push(this.room)

        });

        this.room.onMessage("setupUser", (msg) => {
            User[0].adminStatus = msg.adminStatus;
            setLeaderboardData(msg.personal, msg.global);
            globalRooms[0].send("setupUser"); 
        })

        this.room.onMessage("setHealth", (msg) => {
            User[0].healthPoints = msg.health;
        })

        this.room.onMessage("setHealthBuff", (msg) => {
            User[0].healthBuff = msg.buff;
        })

        this.room.onMessage("deadPlayer", (msg) => {
            // death triggers!
            console.log("timer: ", User[0].wholeTimer);
            death()
        })

        this.room.onMessage("updateLeaderboard", (msg) => {
            let personal = {address: User[0].address, name: User[0].name ? User[0].name : "???", timer: 0, rooms: 0, deaths: 0};
            console.log("message", msg)
            for (let i = 0; i < msg.global.room.length; i++)
                
                if (msg.global.room[i].address == User[0].address) {
                    personal = msg.global.room[i];
                    break;
                }
            console.log("PERSONAL: ", personal);
            setLeaderboardData(personal, msg.global);
        })
        
    }
}

export async function connectionColyseus(userData: any) {
    const networkManagerLobby = new NetworkManager("lobby_room", {roomId: userData.publicKey ? userData.publicKey : userData.userId}, userData);
    await networkManagerLobby.start();

    console.log("CONNECTED TO LOBBY", networkManagerLobby.room);

    globalRooms.splice(0, globalRooms.length);
    globalRooms.push(networkManagerLobby.room);
    return networkManagerLobby.room;
}

export async function getEndpoint() {
    const isPreview = await isPreviewMode({});
    let ENDPOINT

    const realm = await getCurrentRealm({})
    console.log("REALM", realm)
    console.log("PREVIEW MODE", isPreview.isPreview);

    ENDPOINT = (isPreview.isPreview)
        ? "ws://localhost:2567" // local environment
        : backend_wss; // production environment

    if (realm.currentRealm?.domain == "https://just-test-homework.herokuapp.com") {
        ENDPOINT = "wss://just-test-homework-server.herokuapp.com"
    }
    console.log("GOT ENDPOINT", ENDPOINT);

    return ENDPOINT

}