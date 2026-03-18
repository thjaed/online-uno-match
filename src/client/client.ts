import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()

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

document.getElementById("create_room_btn")?.addEventListener("click", () => {
    // when create room (submit) button pressed
    const player_name = (document.getElementById("player_name") as HTMLInputElement).value

    createRoom({
        player_name: player_name
    })

})

document.getElementById("create_room_page_btn")?.addEventListener("click", () => {
    // when create room (page) button pressed
    show("create_room_view")
})

socket.on("room_status", (data) => {
    // room status recieved
    show("lobby_view")
    const code = data.room_code
    document.getElementById("room_code")!.innerHTML = `Room Code: ${code}`
}
)

socket.on("error", (data) => { 
    alert(`Error: ${data.message}`)
})