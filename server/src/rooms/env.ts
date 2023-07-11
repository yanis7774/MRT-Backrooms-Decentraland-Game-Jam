export const MAX_HEALTH = 10;

export let configMap = new Map<string, any>();
export function updateConfigMap(configs: any[]) {
    configs.forEach((config) => {
        configMap.set(config.configName, config.value);
    })
    if (configMap.has("adminList"))
        adminList = configMap.get("adminList");
}

let adminList: string[] = []

export function checkAdmin(address: string) {
    if (address == undefined)
        return false;
    for(let i = 0; i < adminList.length; i++) {
        if (address.toLowerCase() == adminList[i].toLowerCase())
            return true;
    }
    return false;
}

export let leaderboard: {timer: any[], room: any[], deaths: any[]} = {timer: [], room: [], deaths: []};
export function refreshLeaderboard(input: {timer: any[], room: any[], deaths: any[]}) {
    leaderboard = input;
}