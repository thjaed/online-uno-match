import type { Socket } from "socket.io-client"
declare const io: () => Socket

const socket = io()

const create_room_btn = document.getElementById("create_room_btn")
const join_room_btn = document.getElementById("join_room_btn")

function joinRoom() {
    socket.emit("join_room")
}

function createRoom() {
    socket.emit("create_room")
}


create_room_btn?.addEventListener("click", () => {
    createRoom()
})

join_room_btn?.addEventListener("click", () => {
    joinRoom()
})

socket.on("world", () => {
    console.log("world received")
})