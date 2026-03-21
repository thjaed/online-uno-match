import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, removeUser, randomRoomCode, getPublicRoomStatus, getIdFromToken, getRoomFromUser } from "./roomManager.js";
import { type ClientToServerEvents, type ServerToClientEvents } from "../types/events.js"
import { randomUUID } from "crypto";
import type { User } from "./player.js";
import { resolve } from "dns";
import { error } from "console";

const app = express.default();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

const socketUserIdMap = new Map<string, string>()
const UserSocketIdMap = new Map<string, string>()

function updateSocket(socket_id: string, user_id: string) {
    socketUserIdMap.set(socket_id, user_id)
    UserSocketIdMap.set(user_id, socket_id)
}

function auth(token: string, socket_id: string) {
    if (typeof token === "string") {
        const user_id = getIdFromToken(token)
        if (user_id) {
            updateSocket(socket_id, user_id)
            return user_id

        } else {
            return undefined
        }
    }
}

function newUser(player_name: string) {
    if (typeof player_name === "string" &&
        player_name.length < 20 &&
        player_name.length >= 3
    ) {
        const token = randomUUID()
        const id = randomUUID()

        const user: User = { id: id, name: player_name, token: token }

        return user

    } else {
        return undefined
    }
}

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    socket.on("create_room", (data) => {
        const player_name = data.player_name
        const user = newUser(player_name)
        if (user) {
            socket.emit("auth", ({ token: user.token }))
            updateSocket(socket.id, user.id)

            const room_code = randomRoomCode()
            const server_data = {
                user: user,
                room_code: room_code
            }
            createRoom(server_data)
            socket.join(room_code)

            console.log(`user ${user.name} with id ${user.id} created room ${room_code}`)
            io.to((room_code)).emit("room_status", getPublicRoomStatus(room_code)!)

        } else {
            socket.emit("error", { message: "Invalid input" })
        }
    })

    socket.on("join_room", (data) => {
        const player_name = data.player_name
        const user = newUser(player_name)
        if (user &&
            typeof data.room_code == "string" &&
            data.room_code.length === 6
        ) {
            const room = getRoom(data.room_code)
            if (room) {
                socket.emit("auth", ({ token: user.token }))
                updateSocket(socket.id, user.id)

                room.addUser(user)
                socket.join(room.code)
                io.to((room.code)).emit("room_status", getPublicRoomStatus(room.code)!)
                console.log(`user ${user.name} with id ${user.id} joined room ${room.code}`)

            } else {
                socket.emit("error", { message: "Room not found" })
            }

        } else {
            socket.emit("error", { message: "Invalid input" })
        }
    })

    socket.on("start_game", (data) => {
        const user_id = auth(data.token, socket.id)
        if (user_id) {
            const room = getRoomFromUser(user_id)

            if (room) {
                room.game.startGame()
                console.log(`started game ${room.code}`)

                for (const user of room.users) {
                    const socket_id = UserSocketIdMap.get(user.id)
                    if (!socket_id) return

                    io.to(socket_id).emit("game_status", room.game.getPublicState(user.id))
                }
            }
        } else {
            socket.emit("error", { message: "Invalid input" })
        }
    })

    socket.on("place_card", (data) => {
        const user_id = auth(data.token, socket.id)
        if (user_id &&
            typeof data.hand_index == "number" &&
            data.hand_index < 100 &&
            data.hand_index >= 0) {
            const room = getRoomFromUser(user_id)

            if (room) {
                let response
                if (data.colour) {
                    response = room.game.placeCard(user_id, data.hand_index, data.colour)
                } else {
                    response = room.game.placeCard(user_id, data.hand_index)
                }
                if (response.type == "error") {
                    socket.emit("error", { message: response.message! })
                } else {
                    for (const user of room.users) {
                        const socket_id = UserSocketIdMap.get(user.id)
                        if (!socket_id) return

                        io.to(socket_id).emit("game_status", room.game.getPublicState(user.id))
                    }
                }

            }
        }
    })

    socket.on("draw_card", (data) => {
        const user_id = auth(data.token, socket.id)
        if (user_id) {
            const room = getRoomFromUser(user_id)

            if (room) {
                const response = room.game.drawForPlayer(user_id)
                if (response.type == "error") {
                    socket.emit("error", { message: response.message! })
                } else {
                    for (const user of room.users) {
                        const socket_id = UserSocketIdMap.get(user.id)
                        if (!socket_id) return

                        io.to(socket_id).emit("game_status", room.game.getPublicState(user.id))
                    }
                }

            }
        }

    })

    socket.on("disconnect", () => {
        const mapping = socketUserIdMap.get(socket.id)
        if (mapping) {
            const remove = removeUser(mapping)
            if (remove && remove.deleted && remove.users_left) {
                const room = remove.room!
                io.to(room.code).emit("room_status", getPublicRoomStatus(room.code)!)
            }
            socketUserIdMap.delete(socket.id)
        }
        console.log(`${socket.id} disconnected`)
    })

});

httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))