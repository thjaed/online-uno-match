import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../../types/events.js"
import type { Colour } from "../../types/game.js"
import { getCardAsset } from "../base.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()


window.addEventListener("DOMContentLoaded", async () => {
    sessionStorage.setItem("in_game", "true")
    const token = sessionStorage.getItem("token")

    if (token) {
        const success = await reconnect()

        if (success) {
            socket.once("room_status", (data) => {
                if (data.game_state === "waiting" && window.location.pathname !== "/lobby/") {
                    window.location.href = "/lobby"
                    return
                }
            })

            socket.once("game_status", (data) => {
                if ((data.gameState === "playing" || data.gameState === "finished")
                    && window.location.pathname !== "/game/") {
                    window.location.href = "/game"
                    return
                }
            })
        } else {
            window.location.href = "/"
        }
    }
})

function show(viewId: string) {
    // change page view
    document.querySelectorAll("div[id$='_view']").forEach(el => {
        (el as HTMLElement).style.display = "none"
    })

    let style
    if (viewId === "lobby_view") {
        style = "grid"
    } else {
        style = "block"
    }

    document.getElementById(viewId)!.style.display = style
    sessionStorage.setItem("view_id", viewId)
}

export function waitForSocketEvent(idealResponse: keyof ServerToClientEvents):
    Promise<{ "success": boolean, message?: string, data?: any }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ "success": false, "message": "Timed out" })
        }, 1000)

        socket.once("error", (data) => {
            resolve({ "success": false, message: data.err_message })
        })

        socket.once(idealResponse, (data: any) => {
            resolve({ "success": true, data: data })
        })
    })
}


function reconnect(): Promise<boolean> {
    return new Promise((resolve) => {
        const data: Parameters<ClientToServerEvents["reconnect"]>[0] = {
            token: sessionStorage.getItem("token")!,
        }

        socket.emit("reconnect", data)

        setTimeout(() => {
            resolve(false)
        }, 3000)

        socket.once("reconnect_error", () => {
            resolve(false)
            sessionStorage.removeItem("token")
        })

        socket.once("reconnect_success", () => {
            resolve(true)
        })
    })
}

function waitForColourChoice(): Promise<Colour> {
    return new Promise((resolve) => {
        const colour_picker = document.getElementsByClassName("colour-picker")[0]! as HTMLDivElement
        colour_picker.style.display = "flex"

        const buttons = document.querySelectorAll(".colour-btn")

        for (const btn of buttons) {
            const element = btn as HTMLButtonElement

            const handler = () => {
                colour_picker.style.display = "none"

                // remove listeners so they don't stack
                for (const b of buttons) {
                    (b as HTMLButtonElement).removeEventListener("click", handler)
                }

                resolve(element.id as Colour)
            }

            element.addEventListener("click", handler)
        }
    })
}

async function placeCard(index: number, is_wild_card: boolean): Promise<void> {
    const token = sessionStorage.getItem("token")
    if (!token) return

    let colour_choice: Colour | undefined

    if (is_wild_card) {
        colour_choice = await waitForColourChoice()
    }

    const data: Parameters<ClientToServerEvents["place_card"]>[0] = {
        token,
        hand_index: index,
        colour: colour_choice
    }

    socket.emit("place_card", data)
}
function drawCard() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["draw_card"]>[0] = {
        token: token,
    }
    socket.emit("draw_card", data)
}

function resetRoom() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["draw_card"]>[0] = {
        token: token,
    }
    socket.emit("reset_room", data)
    window.location.href = "/lobby"
}


document.getElementById("draw_card_btn")?.addEventListener("click", () => {
    // when draw card button pressed
    drawCard()
})

document.getElementById("back_to_lobby_btn")?.addEventListener("click", () => {
    // when back to lobby button pressed
    resetRoom()
})



socket.on("error", (data) => {
    console.log(`Error: ${data.err_message}`)
})


socket.on("game_status", (data) => {
    if (data.gameState === "playing" && window.location.pathname === "/game/") {
        // player list
        const player_list = document.getElementsByClassName("player-container")[0]! as HTMLDivElement
        player_list.innerHTML = ""

        for (const player of data.players) {
            if (player.id === data.yourId) {
                continue
            }
            const player_card = document.createElement("div")
            player_card.className = "player-card"

            const player_card_name = document.createElement("p")
            player_card_name.innerText = player.name
            player_card_name.classList.add("player-card-name")
            if (player.is_turn) {
                player_card.classList.add("player-active")
            }
            player_card.appendChild(player_card_name)

            const player_card_count = document.createElement("p")
            player_card_count.className = "player-card-count"
            player_card_count.innerText = player.hand_size
            player_card.appendChild(player_card_count)

            player_list.appendChild(player_card)
        }


        // top card
        const asset_name = getCardAsset(data.topCard)
        const card_element = document.getElementById("top_card")! as HTMLImageElement
        card_element.src = asset_name
        card_element.height = 150
        card_element.className = "card_img"

        // colour effect
        if (data.colourEffect) {
            document.getElementById("colour_effect")!.innerHTML = `Wild Colour: ${data.colourEffect}`
        } else {
            document.getElementById("colour_effect")!.innerHTML = ""
        }

        // hand list
        const hand_el = document.getElementById("hand")!
        hand_el.innerHTML = ""
        const bottom_section = document.querySelector(".bottom")!

        if (data.currentPlayerIndex === data.yourIndex) {
            bottom_section.classList.add("player-active")
        } else {
            bottom_section.classList.remove("player-active")
        }

        for (let i = 0; i < data.yourHand.length; i++) {
            const asset_name = getCardAsset(data.yourHand[i])

            const card_element = document.createElement("img")
            card_element.src = asset_name
            card_element.height = 150
            card_element.style.cursor = "pointer"
            card_element.className = "card_img"

            const is_wild_card = data.yourHand[i].type === "wild"

            card_element.addEventListener("click", () => {
                placeCard(i, is_wild_card)
            })

            document.getElementById("hand")?.appendChild(card_element)
        }
        if (sessionStorage.getItem("view_id") !== "game_view") {
            show("game_view")
        }
    }
})

socket.on("game_end_event", (data) => {
    let text
    if (data.winner.id === sessionStorage.getItem("id")) {
        text = `You won!`
    } else {
        text = `${data.winner.name} won!`
    }
    document.getElementById("winner")!.innerHTML = text
    show("end_game_view")
})