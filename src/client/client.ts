import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"
import type { Colour } from "../types/game.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()


window.addEventListener("DOMContentLoaded", async () => {
    const page = sessionStorage.getItem("page")
    const token = sessionStorage.getItem("token")

    if (token && !window.location.search) {
        const success = await reconnect()

        if (success && page) {
            show(page)
            return
        }
    }

    if (window.location.search) {
        show_page_param()
    } else {
        window.location.href = "/"
    }

})

function show_page_param() {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)

    if (urlParams.get("action") === "create") {
        show("create_room_view")
    } else if (urlParams.get("action") === "join") {
        show("join_room_view")
    }
}

function show(viewId: string) {
    // change page view
    document.querySelectorAll("div[id$='_view']").forEach(el => {
        (el as HTMLElement).style.display = "none"
    })

    document.getElementById(viewId)!.style.display = "block"
    sessionStorage.setItem("page", viewId)
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

function createRoom(data: Parameters<ClientToServerEvents["create_room"]>[0]) {
    // create a room on the server
    socket.emit("create_room", data)
}

function joinRoom(data: Parameters<ClientToServerEvents["join_room"]>[0]) {
    // join a room on the server
    socket.emit("join_room", data)
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

function placeCard(index: number, colour?: Colour) {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

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





document.getElementById("create_room_btn")?.addEventListener("click", () => {
    // when create room (submit) button pressed
    const input = (document.getElementById("player_name") as HTMLInputElement)
    const player_name = input.value

    createRoom({
        player_name: player_name
    })
    input.value = ""
    window.history.replaceState({}, "", window.location.pathname)

})

document.getElementById("join_room_btn")?.addEventListener("click", () => {
    // when join room (submit) button pressed
    const name_input = (document.getElementById("player_name_join") as HTMLInputElement)
    const code_input = (document.getElementById("room_code_input") as HTMLInputElement)

    const player_name = name_input.value
    const room_code = code_input.value

    joinRoom({
        player_name: player_name,
        room_code: room_code
    })

    name_input.value = ""
    code_input.value = ""
    window.history.replaceState({}, "", window.location.pathname)

})

document.getElementById("create_room_page_btn")?.addEventListener("click", () => {
    // when create room (page) button pressed
    show("create_room_view")
})

document.getElementById("join_room_page_btn")?.addEventListener("click", () => {
    // when join room (page) button pressed
    show("join_room_view")
})

document.getElementById("start_game_btn")?.addEventListener("click", () => {
    // when start game button pressed
    startGame()
})

document.getElementById("place_card_btn")?.addEventListener("click", () => {
    // when place card button pressed
    const index_input = (document.getElementById("place_card_index") as HTMLInputElement)
    const colour_choice = (document.getElementById("colour_choice") as HTMLSelectElement).value

    const index = parseInt(index_input.value)
    if (isNaN(index)) return

    if (colour_choice) {
        placeCard(index, colour_choice as Colour)
    } else {
        placeCard(index)
    }

    index_input.value = ""

})

document.getElementById("draw_card_btn")?.addEventListener("click", () => {
    // when draw card button pressed
    drawCard()

})

document.getElementById("back_to_lobby_btn")?.addEventListener("click", () => {
    // when back to lobby button pressed
    show("lobby_view")

})




socket.on("room_status", (data) => {
    if (data.game_state === "waiting") {
        // room status recieved
        show("lobby_view")
        const code = data.room_code
        document.getElementById("room_code")!.innerHTML = `Room Code: ${code}`

        // update player list
        document.getElementById("user_list")!.innerHTML = ''

        for (const user of data.public_users) {
            const user_element = document.createElement("p")
            user_element.innerHTML = user.name
            document.getElementById("user_list")?.appendChild(user_element)
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
                curr_hand_size = player.handSize
                curr_name = player.name
                break
            }
        }
        document.getElementById("current_player")!.innerHTML = `${curr_name}'s turn (${curr_hand_size})`

        // top card
        const top_card = data.topCard
        document.getElementById("top_card")!.innerHTML = `Top card: ${JSON.stringify(top_card)}`

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
            const card = data.yourHand[i]
            const card_element = document.createElement("p")
            card_element.innerHTML = `${i}: ${JSON.stringify(card)}`
            document.getElementById("hand")?.appendChild(card_element)
        }
        if (sessionStorage.getItem("page") !== "game_view") {
            show("game_view")
        }
    }
})

socket.on("game_end", (data) => {
    let text
    if (data.winner_id === sessionStorage.getItem("id")) {
        text = `You won!`
    } else {
        text = `${data.winner_name} won!`
    }
    document.getElementById("winner")!.innerHTML = text
    show("end_game_view")
})