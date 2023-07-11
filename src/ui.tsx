import {Color4, Vector3} from '@dcl/sdk/math'
import ReactEcs, {Callback, Label, ReactEcsRenderer, UiEntity} from '@dcl/sdk/react-ecs'
import {User} from './modules/userState'
import {globalRooms, inventoryItems, leaderList, leaderStats, MAX_HEALTH} from './globals'
import {invIcons, useItem} from './objects/inventory'
import {changeFog, currentFog} from './modules/fog'
import {engine, GltfContainer, Transform, UiCanvasInformation, VisibilityComponent} from '@dcl/sdk/ecs'
import {
    removeAllEntities,
    resetDungeon,
    TurnOnPower
} from './modules/mapgen/levelgeneration'
import {
    prompt,
    uiHealth,
    uiQuitButton,
    uiStatWindow,
    uiArrowLeft,
    uiArrowRight,
    uiButton,
    uiButtonBig,
    uiButtonLeft,
    uiButtonRight,
    uiButtonSmall,
    uiLeaderBack,
    uiLeaderboardButton,
    uiLine,
    uiStartButton,
    uiTitleBack,
    uiTitleCard, liftRedModel, uiHealthUndeath
} from './resources/resources'
import {movePlayerTo} from '~system/RestrictedActions'
import * as utils from '@dcl-sdk/utils'

export enum ui_type {
    title,
    leaderboard,
    game,
    endlessPrompt,
    promt
}

export enum leader_type {
    rooms,
    timer,
    deaths,
}

let prompt_object = {
    visible: false,
    text: "",
    left_button_text: "",
    right_button_text: "",
    left_button_vis: false,
    right_button_vis: false,
    left_button: () => {
    },
    right_button: () => {
    }
}
let leaderModeTitles = ['FLOORS', 'FASTEST', 'MOST DEATHS']
let currentLeaderList: any[] = [];
let leaderboard_page = 0;
let leaderboard_max_page = 0;
let leaderMode = leader_type.rooms;
let currentUi: ui_type = ui_type.title;
export let currentHint = ""
export let heightRoot = "100%"


export const setCurrentHint = (newHint: string) => {
    currentHint = newHint
}

const mainUi = () => {
    let res;
    switch (currentUi) {
        case ui_type.title:
            heightRoot = "100%"
            res = <TitleScreen/>;
            break;
        case ui_type.leaderboard:
            heightRoot = "100%"
            res = <LeaderboardUI/>;
            break;
        case ui_type.game:
            heightRoot = "15%"
            res = <UiEntity
                uiTransform={{
                    width: '100%',
                    height: prompt_object.visible ? 350 : 200,
                }}
            >
                <GameComponent/>
                <GameComponentInventory/>
            </UiEntity>;
            break;
        case ui_type.endlessPrompt:
            res = <ConfirmEndless/>;
            break;
        case ui_type.promt:
            res = <PromtComponent/>
            heightRoot = "15%"
            break;
    }

    return <UiEntity key={0}
        uiTransform={{
            width: '100%',
            // @ts-ignore
            height: `${heightRoot}`,
        }}
        // uiBackground={{color: Color4.White()}}

    >
        {res}
    </UiEntity>;


}

function LeaderboardUI() {
    return <UiEntity
        uiTransform={{
            width: '100%',
            minHeight: '100%',
            flexDirection: 'column',
            alignItems: 'center',
        }}
        uiBackground={{textureMode: 'stretch', texture: {src: uiLeaderBack}}}
    >
        <UiEntity // leaderboard change button
            onMouseDown={() => {
                loadLeaderboard(leaderMode + 1 > leader_type.deaths ? leader_type.rooms : leaderMode + 1)
            }}
            uiTransform={{
                width: '20%',
                height: '10%',
                margin: {left: 0, top: "5%", right: 0, bottom: 0}
            }}
            uiBackground={{
                textureMode: 'stretch',
                texture: {
                    src: uiButtonBig,
                },
            }}
            uiText={{value: leaderModeTitles[leaderMode], fontSize: 20, color: Color4.Black()}}

        ></UiEntity>

        {generateText([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1])}

        <UiEntity // buttons left,  right, page indicator
            uiTransform={{
                width: '20%',
                height: '8%',
                flexDirection: 'row',
                margin: {bottom: 0, left: 0, right: 0, top: 5},
                alignItems: 'center',
                alignContent: 'center'
            }}
        >
            <UiEntity // button left
                uiTransform={{
                    width: '20%',
                    height: '90%'
                }}
                uiBackground={{
                    textureMode: 'center',
                    texture: {src: uiArrowLeft}
                }}
                onMouseDown={() => {
                    pageLeaderboard(true)
                }}
            >
            </UiEntity>


            <UiEntity // page indicator
                uiTransform={{
                    width: '60%',
                    height: '90%',
                    alignItems: 'center',
                    alignContent: 'center'
                }}
                uiBackground={{texture: {src: uiButtonSmall}}}
                uiText={{
                    value: `${leaderboard_page + 1}/${leaderboard_max_page + 1}`,
                    fontSize: 22,
                    color: Color4.Black()
                }}
            >
            </UiEntity>

            <UiEntity // button right
                uiTransform={{
                    width: '20%',
                    height: '90%'
                }}
                uiBackground={{
                    textureMode: 'center',
                    texture: {src: uiArrowRight}
                }}
                onMouseDown={() => {
                    pageLeaderboard(true)
                }}
            >
            </UiEntity>

        </UiEntity>


        <UiEntity // Back button
            uiTransform={{
                width: '20%',
                height: '10%',
                margin: {left: 0, top: 20, right: 0, bottom: 0}
            }}
            uiBackground={{
                textureMode: 'stretch',
                texture: {
                    src: uiButtonBig,
                },
            }}
            uiText={{value: `BACK`, fontSize: 20, color: Color4.Black()}}
            onMouseDown={() => {
                setupUi(ui_type.title)
            }}
        ></UiEntity>
    </UiEntity>
}

function TitleScreen() {
    return (
        <UiEntity
            uiTransform={{
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            uiBackground={{texture: {src: uiTitleBack}, textureMode: 'stretch'}}
        >
            <UiEntity
                uiTransform={{
                    width: '30%',
                    height: '30%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: "center"
                }}
                uiBackground={{texture: {src: uiTitleCard}, textureMode: 'stretch'}}>
            </UiEntity>
            <UiEntity
                uiTransform={{
                    width: '35%',
                    height: '8%',
                    flexDirection: "row",
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <UiEntity // Start game Button
                    onMouseDown={() => {

                        startGame()
                    }}
                    uiTransform={{
                        width: '40%',
                        height: '100%',
                        margin: {left: 0, top: "1%", right: 0, bottom: 0}
                    }}
                    uiBackground={{
                        texture: {
                            src: uiStartButton,
                        }, textureMode: 'stretch'
                    }}

                ></UiEntity>

                <UiEntity // Leaderboard button
                    onMouseDown={() => {
                        openLeaderboard(leaderMode)
                    }}
                    uiTransform={{
                        width: '40%',
                        height: '40%',
                        margin: {left: 0, top: "1%", right: 0, bottom: 0}
                    }}
                    uiBackground={{
                        texture: {
                            src: uiLeaderboardButton,
                        }, textureMode: 'stretch'
                    }}
                ></UiEntity>
            </UiEntity>
        </UiEntity>)
}

const ConfirmEndless = () => (
    <UiEntity
        uiTransform={{
            width: '175%',
            height: 240,
            //margin: { left: 200, right: 15, top: 20, bottom: 8 },
            //padding: 4,
        }}
    ></UiEntity>
)

const PromtComponent = () => (
    <UiEntity
        uiTransform={{
            width: '100%',
            height: "10%",
            alignSelf: "flex-start",
            justifyContent: "center"

        }}
    >
        {generatePrompt()}
    </UiEntity>
)

const GameComponent = () => (
    <UiEntity
        uiTransform={{
            width: '100%',
            height: prompt_object.visible ? 350 : 120,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: 'center',
            position: {left: "8.5%", top: "15%"}
        }}>
        <UiEntity
            uiTransform={{
                height: "50%",
                width: "50%",
                position: {left: "20%", top: 0}

            }}

            uiBackground={{
                textureMode: 'stretch',
                texture: {src: uiQuitButton}
            }}
            onMouseDown={() => {
                quitGame()
            }}
        ></UiEntity>
        <UiEntity
            uiTransform={{
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                alignItems: 'flex-start',
                margin: {left: '50%', right: 0, bottom: 0, top: 0}
            }}
            // uiBackground={{textureMode: 'stretch', texture: {src: uiStatWindow}}}
        >
            <UiEntity
                uiTransform={{
                    width: `${getPlayerHealthBar()}%`,
                    height: '13%',

                    // margin: {top: 0, bottom: 0, left: 0, right: 0},
                    // flexDirection: 'row',
                    // alignItems: 'center',
                    // justifyContent: 'flex-start'
                }}
                uiBackground={{
                    texture: {src: `${User[0].invincibleMode ? uiHealthUndeath : uiHealth}`},
                    textureMode: 'nine-slices'
                }}
            ></UiEntity>
            <UiEntity
                uiTransform={{
                    width: '100%',
                    margin: {top: '5%', bottom: 0, right: 0, left: 0}
                }}
            >
                <UiEntity
                    uiTransform={{
                        margin: {top: 0, bottom: 0, right: 0, left: '10%'}
                    }}
                    uiText={{value: `0`, fontSize: 20}}>
                </UiEntity>
                <UiEntity
                    uiTransform={{
                        margin: {top: 0, bottom: 0, right: 0, left: '80%'}
                    }}
                    uiText={{value: `${getPlayerHealth()}`, fontSize: 20}}>
                </UiEntity>
            </UiEntity>
            <UiEntity
                uiTransform={{
                    width: `100%`,
                    height: `30%`,
                    margin: {top: '5%', bottom: 0, right: 0, left: '3%'}
                }}
                uiText={{value: `LEVEL OF DREAM: ${getPlayerFloor()}`, fontSize: 16}}
            ></UiEntity>

            {/*<UiEntity*/}
            {/*    uiTransform={{*/}
            {/*        width: `100%`,*/}
            {/*        height: `30%`,*/}
            {/*        margin: {top: '5%', bottom: 0, right: 0, left: '3%'}*/}
            {/*    }}*/}
            {/*    uiText={{value: `Find Toggler and go Back to Elevator. Avoid Enemies. Grab Items.`, fontSize: 16}}*/}
            {/*></UiEntity>*/}

            <UiEntity
                uiTransform={{
                    width: `100%`,
                    height: `30%`,
                    margin: {top: '5%', bottom: 0, right: 0, left: '3%'}
                }}
                uiText={{value: `${currentHint}`, fontSize: 16}}
            ></UiEntity>

        </UiEntity>
        {/*{generatePrompt()}*/}
    </UiEntity>
)

const GameComponentInventory = () => (
    <UiEntity
        uiTransform={{
            width: '100%',
            height: '200%',
            flexDirection: "column",
            position: {left: "42%", top: "150%"}

        }}
        // uiBackground={{color: Color4.White()}}

    >
        <UiEntity
            uiTransform={{
                width: `100%`,
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center'
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 120,
                    height: 120,
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: invIcons[inventoryItems.HEALTH_KIT],
                        filterMode: 'tri-linear'
                    },

                }}
                onMouseDown={() => {
                    useItem(inventoryItems.HEALTH_KIT)
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: {bottom: 0, top: '-15%', left: 0, right: 0}
                }}
                uiText={{value: `${User[0].inventory[inventoryItems.HEALTH_KIT]}`, fontSize: 18}}
            ></UiEntity>
        </UiEntity>
        <UiEntity
            uiTransform={{
                width: `100%`,
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center'
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 120,
                    height: 120,
                    margin: '4px 0'
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: invIcons[inventoryItems.GAS_MASK]
                    },
                }}
                onMouseDown={() => {
                    useItem(inventoryItems.GAS_MASK)
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: {bottom: 0, top: '-15%', left: 0, right: 0}
                }}
                uiText={{value: `${User[0].inventory[inventoryItems.GAS_MASK]}`, fontSize: 18}}
            ></UiEntity>

        </UiEntity>
        <UiEntity
            uiTransform={{
                width: `100%`,
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center'
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 120,
                    height: 120,
                    margin: '4px 0'
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: invIcons[inventoryItems.WALL_TRAP]
                    },
                }}
                onMouseDown={() => {
                    useItem(inventoryItems.WALL_TRAP)
                }}
            >
            </UiEntity>
            <UiEntity
                uiTransform={{
                    position: {bottom: 0, top: '-15%', left: 0, right: 0}
                }}
                uiText={{value: `${User[0].inventory[inventoryItems.WALL_TRAP]}`, fontSize: 18}}
            ></UiEntity>
        </UiEntity>
    </UiEntity>
)

function startGame() {
    // start game init
    setupUi(ui_type.game);
    User[0].resetPlayer();


    movePlayerTo({newRelativePosition: Vector3.create(25, 1, 30)})

    // AudioSource2.getMutable(liftButton).playing = true;

    resetDungeon(User[0]?.currentFloor + 1 || 1);
}

function openLeaderboard(type: leader_type) {
    setupUi(ui_type.leaderboard);
    loadLeaderboard(type);
}

function loadLeaderboard(type: leader_type) {
    leaderMode = type;
    switch (type) {
        case leader_type.deaths:
            currentLeaderList = leaderList.deaths;
            break;
        case leader_type.rooms:
            currentLeaderList = leaderList.room;
            break;
        case leader_type.timer:
            currentLeaderList = leaderList.timer;
            break;
    }
    leaderboard_max_page = Math.floor(currentLeaderList.length / 10);
    leaderboard_page = 0;
}

function pageLeaderboard(plus: boolean) {
    if (plus) {
        leaderboard_page++;
        if (leaderboard_page > leaderboard_max_page)
            leaderboard_page = 0;
    } else {
        leaderboard_page--;
        if (leaderboard_page < 0)
            leaderboard_page = leaderboard_max_page;
    }
}

function getLeaderData(index: number, type: number) {
    if (index == -1) {
        let result;
        switch (type) {
            case 0:
                result = leaderStats.address;
                break;

            case 1:
                result = leaderStats.name;
                break;

            case 2:
                switch (leaderMode) {
                    case leader_type.timer:
                        result = timerFormat(leaderStats.timer);
                        break;
                    case leader_type.deaths:
                        result = `${leaderStats.deaths}`
                        break;
                    case leader_type.rooms:
                        result = `${leaderStats.rooms}`
                        break;
                }
                break;
        }
        return result
    }
    let tmp_index = leaderboard_page * 10 + index;
    // let leader;
    if (tmp_index < currentLeaderList.length) {
        // leader = currentLeaderList[tmp_index];
        let result;
        switch (type) {
            case 0:
                result = currentLeaderList[tmp_index].address;
                break;

            case 1:
                result = currentLeaderList[tmp_index].name;
                break;

            case 2:
                switch (leaderMode) {
                    case leader_type.timer:
                        result = timerFormat(currentLeaderList[tmp_index].timer);
                        break;
                    case leader_type.deaths:
                        result = `${currentLeaderList[tmp_index].deaths}`
                        break;
                    case leader_type.rooms:
                        result = `${currentLeaderList[tmp_index].rooms}`
                        break;
                }
                break;
        }
        return result
    } else {
        return "-"
    }
}

function getPlayerHealth() {
    return `${MAX_HEALTH + User[0].healthBuff}`
}

function getPlayerHealthBar() {
    return User[0].healthPoints * (100 / (MAX_HEALTH + User[0].healthBuff));
}

function getPlayerFloor() {
    return `${User[0].currentFloor}`
}

function ToggleInvincibility() {
    User[0].invincibleMode = !User[0].invincibleMode;
    TurnOnPower()
}

export function initUi() {
    ReactEcsRenderer.setUiRenderer(mainUi);

}

export function setupUi(type: ui_type) {
    currentUi = type;
}

export function ToggleFog() {
    let fog_vc = VisibilityComponent.get(currentFog)

    if (fog_vc.visible) {
        VisibilityComponent.createOrReplace(currentFog, {visible: false})
    } else {
        VisibilityComponent.createOrReplace(currentFog, {visible: true})
    }

}


// loop for data
function generateText(leaderData: Number[]) {
    // @ts-ignore
    return leaderData.map((entity) => <TextComponent value={entity.toString()} key={entity}/>)
}

function generatePrompt() {
    return (
        <UiEntity
            uiTransform={{
                display: prompt_object.visible ? 'flex' : 'none',
                // margin: {bottom: 0, top: 20, left: 0, right: 0},
                alignItems: 'center',
                width: '600',
                height: '300',
            }}
            // uiBackground={{color: Color4.White()}}
        >
            <UiEntity
                uiTransform={{
                    margin: {bottom: 2, top: 2, left: 2, right: 2},
                    width: '100%',
                    height: '95%',
                    flexDirection: 'column',
                    flexWrap: 'wrap'
                }}
                uiBackground={{
                    texture: {
                        src: prompt,
                    },
                    textureMode: "stretch"
                }}
            >
                <Label
                    value={`${prompt_object.text}`}
                    fontSize={12}
                    color={Color4.White()}
                    uiTransform={{
                        width: '95%', margin: {left: '3%', right: 0, bottom: 0, top: 0},
                        height: `${95 - (prompt_object.left_button_vis || prompt_object.right_button_vis ? 20 : 0)}%`
                    }}
                ></Label>

                <UiEntity
                    uiTransform={{
                        flexDirection: 'row',
                        // alignContent: 'center',
                        width: '100%',
                        height: '20%',
                        justifyContent: "center",
                        position: {top: -40}
                        // margin: {top: 20},
                    }}
                >
                    <UiEntity // Right game Button
                        onMouseDown={() => {
                            rightButton()
                        }}
                        uiTransform={{
                            width: '15%',
                            height: '50%',
                            margin: {left: '5%', top: "1%", right: 0, bottom: 0},
                            display: prompt_object.right_button_vis ? 'flex' : 'none'
                        }}
                        // uiBackground={{
                        //     texture: {
                        //         src: uiButtonSmall,
                        //     },
                        //     textureMode: "stretch"
                        // }}
                        uiText={{value: prompt_object.right_button_text, fontSize: 16, color: Color4.White()}}
                    >

                    </UiEntity>

                    <UiEntity // Left prompt button
                        onMouseDown={() => {
                            leftButton()
                        }}
                        uiTransform={{
                            width: '15%',
                            height: '50%',
                            margin: {left: '5%', top: "1%", right: 0, bottom: 0},
                            display: prompt_object.left_button_vis ? 'flex' : 'none'
                        }}
                        uiBackground={{
                            texture: {
                                src: uiButtonBig,
                            },
                            textureMode: "stretch"

                        }}
                        uiText={{value: prompt_object.left_button_text, fontSize: 16, color: Color4.Black()}}
                    >

                    </UiEntity>


                </UiEntity>
            </UiEntity>
        </UiEntity>
    );
}

function TextComponent(props: { value: string; key: number }) {
    if (Number(props.value) == -1)
        return (
            <UiEntity
                uiTransform={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '20%',
                }}
            >
                <UiEntity
                    uiTransform={{
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 0, top: 0, bottom: 0, right: 0}}}
                        uiText={{font: 'sans-serif', value: "-", textAlign: 'middle-center', fontSize: 16}}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{
                            font: 'sans-serif',
                            value: getLeaderData(-1, 1),
                            textAlign: 'middle-center',
                            fontSize: 16
                        }}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{
                            font: 'sans-serif',
                            value: getLeaderData(-1, 2),
                            textAlign: 'middle-center',
                            fontSize: 16
                        }}
                    />
                </UiEntity>
                <UiEntity
                    uiTransform={{width: '100%', height: 3}}
                    uiBackground={{texture: {src: uiLine}, textureMode: 'stretch'}}
                ></UiEntity>
            </UiEntity>)
    else if (Number(props.value) + leaderboard_page * 10 < currentLeaderList.length)
        return (
            <UiEntity
                uiTransform={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '20%',
                }}
            >
                <UiEntity
                    uiTransform={{
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 0, top: 0, bottom: 0, right: 0}}}
                        uiText={{
                            font: 'sans-serif',
                            value: `${1 + Number(props.value) + leaderboard_page * 10}`,
                            textAlign: 'middle-center',
                            fontSize: 16
                        }}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{
                            font: 'sans-serif',
                            value: getLeaderData(Number(props.value) + leaderboard_page * 10, 1),
                            textAlign: 'middle-center',
                            fontSize: 16
                        }}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{
                            font: 'sans-serif',
                            value: getLeaderData(Number(props.value) + leaderboard_page * 10, 2),
                            textAlign: 'middle-center',
                            fontSize: 16
                        }}
                    />
                </UiEntity>
                <UiEntity
                    uiTransform={{width: '100%', height: 2}}
                    uiBackground={{texture: {src: uiLine}, textureMode: 'stretch'}}
                ></UiEntity>
            </UiEntity>
        )
    else return (
            <UiEntity
                uiTransform={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '20%',
                }}
            >
                <UiEntity
                    uiTransform={{
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 0, top: 0, bottom: 0, right: 0}}}
                        uiText={{font: 'sans-serif', value: "-", textAlign: 'middle-center', fontSize: 16}}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{font: 'sans-serif', value: "-", textAlign: 'middle-center', fontSize: 16}}
                    />
                    <UiEntity
                        uiTransform={{width: '100%', height: 30, margin: {left: 80, top: 0, bottom: 0, right: 0}}}
                        uiText={{font: 'sans-serif', value: "-", textAlign: 'middle-center', fontSize: 16}}
                    />
                </UiEntity>
                <UiEntity
                    uiTransform={{width: '100%', height: 3}}
                    uiBackground={{texture: {src: uiLine}, textureMode: 'stretch'}}
                ></UiEntity>
            </UiEntity>
        )
}


let prompt_timer: any;
let prompt_timer_set = false;

export function callPrompt(text: string, timer: number, left_text: string = "", left_func: Callback = () => {
}, right_text = "", right_func: Callback = () => {
}) {
    // timer - amount of seconds before self closing prompt
    // set timer to 0 or less to disable timer
    if (prompt_timer_set) {
        prompt_timer_set = false;
        utils.timers.clearTimeout(prompt_timer);
    }
    if (timer > 0) {
        prompt_timer = utils.timers.setTimeout(() => {
            prompt_object.visible = false;
            prompt_timer_set = false
            setupUi(ui_type.game)
        }, timer * 1000);
        prompt_timer_set = true;
    }
    prompt_object.visible = true;
    prompt_object.text = text;
    if (left_text != "") {
        prompt_object.left_button_vis = true;
        prompt_object.left_button_text = left_text;
        prompt_object.left_button = left_func;
    } else {
        prompt_object.left_button_vis = false;
    }
    if (right_text != "") {
        prompt_object.right_button_vis = true;
        prompt_object.right_button_text = right_text;
        prompt_object.right_button = right_func;
    } else {
        prompt_object.right_button_vis = false;
    }
}

const leftButton = () => {
    prompt_object.visible = false;
    prompt_object.left_button();
} 
const rightButton = () => {
    prompt_object.visible = false;
    prompt_object.right_button();
}

function timerFormat(time: number) {
    return `${Math.floor(time / 60).toLocaleString(undefined, {minimumIntegerDigits: 2})}:${(time % 60).toLocaleString(undefined, {minimumIntegerDigits: 2})}`
}

function quitGame() {
    // ADD QUIT GAME FUNCTION HERE (OR RESTART)
    setupUi(ui_type.promt)
    callPrompt("Do you want to quit?", 0,

        "Yes", () => {
            death()

        },

        "No", () => {
            setupUi(ui_type.game)
        });
}

export function death() {
    let timeLeader = -1
    let roomLeader =  User[0].currentFloor-1
    if(User[0].currentFloor == 10)
    {
        timeLeader = User[0].wholeTimer
        roomLeader =  User[0].currentFloor
    }
    globalRooms[0].send("setLeader",{
        deathLeader: 1,
        roomLeader: roomLeader,
        timeLeader: timeLeader 
    })
    //console.log(User[0].currentFloor-1)
    //console.log(User[0].wholeTimer)
    removeAllEntities();
    setupUi(ui_type.leaderboard)
    User[0].resetPlayer();
}


