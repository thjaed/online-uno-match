import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"

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
    // create a room on the server
    socket.emit("join_room", data)
}

function startGame(data: Parameters<ClientToServerEvents["start_game"]>[0]) {
    socket.emit("start_game", data)
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
    startGame({ token: localStorage.getItem("token")! })
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
        const user_count = data.public_users.length
        for (let p = 0; p < user_count; p++) {
            const user = document.createElement("p")
            user.innerHTML = data.public_users[p]!.name
            document.getElementById("user_list")?.appendChild(user)
        }
    }
})

socket.on("error", (data) => {
    alert(`Error: ${data.message}`)
})

socket.on("auth", (data) => {
    console.log(`got token ${data.token}`)
    localStorage.setItem("token", data.token)
})

socket.on("game_status", (data) => {
    console.log(JSON.stringify(data))
    show("game_view");
    (document.getElementById("game_data") as HTMLParagraphElement)!.textContent = JSON.stringify(data)
})