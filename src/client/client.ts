import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"
import type { Colour } from "../types/game.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()
console.log(socket.id)

function show(viewId: string) {
    // change page view
    document.querySelectorAll("div[id$='_view']").forEach(el => {
        (el as HTMLElement).style.display = "none"
    })

    document.getElementById(viewId)!.style.display = "block"
}

show("home_view")

function createRoom(data: Parameters<ClientToServerEvents["create_room"]>[0]) {
    // create a room on the server
    socket.emit("create_room", data)
}

function joinRoom(data: Parameters<ClientToServerEvents["join_room"]>[0]) {
    // join a room on the server
    socket.emit("join_room", data)
}

function startGame() {
    const data: Parameters<ClientToServerEvents["start_game"]>[0] = {
        token: sessionStorage.getItem("token")!,
    }
    socket.emit("start_game", data)
}

function placeCard(index: number, colour?: Colour) {
    const data: Parameters<ClientToServerEvents["place_card"]>[0] = {
        token: sessionStorage.getItem("token")!,
        hand_index: index,
        colour: colour
    }
    socket.emit("place_card", data)
}

function drawCard() {
    const data: Parameters<ClientToServerEvents["draw_card"]>[0] = {
        token: sessionStorage.getItem("token")!,
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

    if (colour_choice) {
        placeCard(parseInt(index_input.value), colour_choice as Colour)
    } else {
        placeCard(parseInt(index_input.value))
    }


    index_input.value = ""

})

document.getElementById("draw_card_btn")?.addEventListener("click", () => {
    // when draw card button pressed
    drawCard()

})

socket.on("room_status", (data) => {
    console.log(JSON.stringify(data))
    if (data.game_state === "waiting") {
        // room status recieved
        show("lobby_view")
        const code = data.room_code
        document.getElementById("room_code")!.innerHTML = `Room Code: ${code}`

        // update player list
        document.getElementById("user_list")!.innerHTML = ''

        for (const user of data.public_users) {
            sessionStorage.setItem(user.id, user.name)

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
    console.log(`got token ${data.token}`)
    sessionStorage.setItem("token", data.token)
})

socket.on("game_status", (data) => {
    if (data.gameState === "playing") {
        // current player
        let curr_name
        let curr_hand_size
        for (const player of data.players) {
            if (player.id === data.currentPlayerId) {
                curr_hand_size = player.handSize
                curr_name = sessionStorage.getItem(player.id)
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
        show("game_view")
    } else if (data.gameState === "finished" && data.winner) {
        document.getElementById("winner")!.innerHTML = data.winner
    }

    
})