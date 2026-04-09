import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"
import type { Card, Colour } from "../types/game.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()


window.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("token")

    if (token && !window.location.search) {
        const success = await reconnect()
        const page = sessionStorage.getItem("page")

        if (success && page) {
            show(page)
            return
        }
    }
})

function show(viewId: string) {
    // change page view
    document.querySelectorAll("div[id$='_view']").forEach(el => {
        (el as HTMLElement).style.display = "none"
    })

    document.getElementById(viewId)!.style.display = "block"
    sessionStorage.setItem("page", viewId)
}

function getCardAsset(card: Card): string {
    let asset_name
    if (card.type === "number" || card.type == "action") {
        asset_name = `assets/${card.colour}_${card.value}.svg`
    } else {
        asset_name = `assets/${card.value}.svg`
    }
    return asset_name
}





function reconnect(): Promise<boolean> {
    return new Promise((resolve) => {
        const data: Parameters<ClientToServerEvents["reconnect"]>[0] = {
            token: sessionStorage.getItem("token")!,
        }

        socket.emit("reconnect", data)

        const timeout = setTimeout(() => {
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

function addBot() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["add_bot"]>[0] = {
        token: token,
    }
    socket.emit("add_bot", data)
}

function startGame() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["start_game"]>[0] = {
        token: token,
    }
    socket.emit("start_game", data)
}

function placeCard(index: number) {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const colour_choice = (document.getElementById("colour_choice") as HTMLSelectElement).value

    let colour
    colour_choice ? colour = colour_choice as Colour : colour = undefined

    const data: Parameters<ClientToServerEvents["place_card"]>[0] = {
        token: token,
        hand_index: index,
        colour: colour
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
}




document.getElementById("add_bot_btn")?.addEventListener("click", () => {
    // when add bot button pressed
    addBot()
})

document.getElementById("start_game_btn")?.addEventListener("click", () => {
    // when start game button pressed
    startGame()
})


document.getElementById("draw_card_btn")?.addEventListener("click", () => {
    // when draw card button pressed
    drawCard()
})

document.getElementById("back_to_lobby_btn")?.addEventListener("click", () => {
    // when back to lobby button pressed
    resetRoom()
})




socket.on("room_status", (data) => {
    if (data.game_state === "waiting") {
        // room status recieved
        show("lobby_view")
        const code = data.room_code
        document.getElementById("room_code")!.innerHTML = `Room Code: ${code}`

        // update player list
        document.getElementById("user_list")!.innerHTML = ''

        for (const p of data.public_players) {
            const el = document.createElement("p")
            if (p.type === "bot") {
                el.innerHTML = `${p.name} (Bot)`
            } else {
                el.innerHTML = p.name
            }

            document.getElementById("user_list")?.appendChild(el)
        }
    }
})

socket.on("error", (data) => {
    alert(`Error: ${data.message}`)
})

socket.on("auth", (data) => {
    sessionStorage.setItem("token", data.user.token)
    sessionStorage.setItem("name", data.user.name)
    sessionStorage.setItem("id", data.user.id)
})

socket.on("game_status", (data) => {
    if (data.gameState === "playing") {
        // current player
        let curr_name
        let curr_hand_size
        for (const player of data.players) {
            if (player.id === data.currentPlayerId) {
                curr_hand_size = player.hand_size
                curr_name = player.name
                break
            }
        }

        if (data.currentPlayerId === sessionStorage.getItem("id")) {
            document.getElementById("current_player")!.innerHTML = `Your Turn`
        } else {
            document.getElementById("current_player")!.innerHTML = `${curr_name}'s turn (${curr_hand_size})`
        }

        // top card
        const asset_name = getCardAsset(data.topCard)
        const card_element = document.getElementById("top_card")! as HTMLImageElement
        card_element.src = asset_name
        card_element.height = 150

        // colour effect
        if (data.colourEffect) {
            document.getElementById("colour_effect")!.innerHTML = `Wild Colour: ${data.colourEffect}`
        } else {
            document.getElementById("colour_effect")!.innerHTML = ""
        }
        // hand list
        document.getElementById("hand_title")!.innerHTML = `Your Hand (${data.yourHand.length}):`
        document.getElementById("hand")!.innerHTML = ""


        for (let i = 0; i < data.yourHand.length; i++) {
            const asset_name = getCardAsset(data.yourHand[i])

            const card_element = document.createElement("img")
            card_element.src = asset_name
            card_element.height = 150
            card_element.style.cursor = "pointer"

            card_element.addEventListener("click", () => {
                placeCard(i)
            })

            document.getElementById("hand")?.appendChild(card_element)
        }
        if (sessionStorage.getItem("page") !== "game_view") {
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