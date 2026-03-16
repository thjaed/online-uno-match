import type { Socket } from "socket.io-client"
import type { ClientToServerEvents } from "../types/events.js"

declare const io: () => Socket<ClientToServerEvents>

const socket = io()

function createRoom(data: Parameters<ClientToServerEvents["create_room"]>[0]) {
    socket.emit("create_room", data)
}

document.getElementById("create_room_page_btn")?.addEventListener("click", () => {
    window.location.href = "create_room.html"
})

document.getElementById("create_room_btn")?.addEventListener("click", () => {
    const player_name = (document.getElementById("player_name") as HTMLInputElement).value

    createRoom({
        player_name: player_name
    })
    
    window.location.href = "index.html"

})