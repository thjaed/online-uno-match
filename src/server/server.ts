import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, removeUser, randomRoomCode, getPublicRoomStatus, getIdFromToken, getRoomFromUser, Room, resetRoom, getPublicPlayer, getUserbyId, getPublicUser } from "./roomManager.js";
import { type ClientToServerEvents, type game_event, type ServerToClientEvents } from "../types/events.js"
import { randomUUID } from "crypto";
import type { Player, User } from "../types/player.js";

const app = express.default();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    connectionStateRecovery: {}
});

const socketUserIdMap = new Map<string, string>()
const UserSocketIdMap = new Map<string, string>()
const expiringUsersMap = new Map<string, any>()

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

function newUser(player_name: string): User | {"err_message": string} {
    if (typeof player_name === "string" &&
        player_name.length < 20 &&
        player_name.length >= 1) {
        const token = randomUUID()
        const id = randomUUID()

        const user: User = { id: id, name: player_name, token: token }
        return user

    } else if (typeof player_name === "string" &&
        player_name.length >= 20) {
        return { "err_message": "Player name must be less than 20 characters" }
    } else {
        return { "err_message": "Invalid input" }
    }
}

function disconnectUser(socket_id: string) {
    const user_id = socketUserIdMap.get(socket_id)
    if (user_id) {
        const user = getUserbyId(user_id)!
        const remove = removeUser(user_id)
        if (remove && remove.deleted && remove.users_left) {
            // if there are still users in the room, tell them that the user has left
            const room = remove.room!
            updateRoom(room.code, "player_leave_event", { player: getPublicUser(user) })
        }
        expiringUsersMap.delete(user_id)
        UserSocketIdMap.delete(user_id)
    }
    socketUserIdMap.delete(socket_id)
}

export function updateRoom(room_code: string, type: game_event, data: any) {
    // room status
    const room = getRoom(room_code)

    if (!room) {
        return
    }

    io.to(room_code).emit(type, data)

    io.to(room.code).emit("room_status", getPublicRoomStatus(room.code)!)

    if (room.game.state === "playing") {
        // game state
        for (const user of room.users) {
            const socket_id = UserSocketIdMap.get(user.id)
            if (!socket_id) continue

            io.to(socket_id).emit("game_status", room.game.getPublicState(user.id))
        }
    }
}

export function updateUser(user_id: string, socket_id: string) {
    // send data to a specific user when they reconnect
    const room = getRoomFromUser(user_id)
    if (room) {
        const state = room.game.state
        if (state === "playing") {
            const data = room.game.getPublicState(user_id)
            io.to(socket_id).emit("game_status", data)

        } else if (state === "finished") {
            const winner = getPublicPlayer(room.game.winner!)
            io.to(socket_id).emit("game_end_event", { winner: winner })

        } else if (state === "waiting") {
            io.to(socket_id).emit("room_status", getPublicRoomStatus(room.code)!)
        }
    }
}

io.on("connection", (socket) => {
    socket.on("reconnect", (data) => {
        const user_id = auth(data.token, socket.id)
        if (user_id) {
            const expiry = expiringUsersMap.get(user_id)
            if (expiry) {
                // clear expiry
                clearTimeout(expiry)
                expiringUsersMap.delete(user_id)
            }
            const room = getRoomFromUser(user_id)

            if (room) {
                // send data
                socket.join(room.code)
                const user = getUserbyId(user_id)!
                updateSocket(socket.id, user.id)
                updateUser(user.id, socket.id)
                socket.emit("reconnect_success")
            }
        } else {
            socket.emit("reconnect_error")
        }
    })

    socket.on("room_exists", (data) => {
        if (!(typeof data.room_code === "string" &&
            data.room_code.length === 6)) {
            socket.emit("room_existence", ({ room_code: data.room_code, result: false }))
            return
        }

        const room = getRoom(data.room_code)

        if (!room) {
            socket.emit("room_existence", ({ room_code: data.room_code, result: false }))
            return
        }

        socket.emit("room_existence", ({ room_code: data.room_code, result: true }))
    })

    socket.on("reset_room", (data) => {
        const user_id = auth(data.token, socket.id)
        if (!user_id) return
        const room = getRoomFromUser(user_id)
        if (!room) return
        if (room.game.state === "finished") {
            resetRoom(room.code)
        }
        io.to(socket.id).emit("room_status", getPublicRoomStatus(room.code)!)
    })

    socket.on("create_room", (data) => {
        const player_name = data.player_name
        const user = newUser(player_name)

        if ("err_message" in user) {
            socket.emit("error", { err_message: user.err_message })
            return
        }

        socket.emit("auth", ({ user: user }))
        updateSocket(socket.id, user.id)

        const room_code = randomRoomCode()
        const server_data = {
            user: user,
            room_code: room_code
        }
        const room = createRoom(server_data)
        socket.join(room_code)
        console.log(`user ${user.name} created room ${room.code}`)
        updateRoom(room.code, "create_room_event", { code: room.code })
    })

    socket.on("join_room", (data) => {
        const player_name = data.player_name
        const user = newUser(player_name)

        if (!(!("err_message" in user) &&
            typeof data.room_code == "string" &&
            data.room_code.length === 6
        )) {
            socket.emit("error", { err_message: "Invalid input" })
            return
        }

        const room = getRoom(data.room_code)

        if (!room) {
            socket.emit("error", { err_message: "Room not found" })
            return
        }

        if (room.game.state !== "waiting") {
            socket.emit("error", { err_message: "Game already started" })
            return
        }

        if (room.game.players.length + 1 > 10) {
            socket.emit("error", { err_message: "Too many players" })
            return
        }

        for (const u of room.game.players) {
            if (u.name === player_name) {
                socket.emit("error", { err_message: "Name already exists" })
                return
            }
        }

        socket.emit("auth", ({ user: user }))
        updateSocket(socket.id, user.id)
        const player = room.addPlayer(user, "human")
        socket.join(room.code)
        console.log(`user ${user.name} joined room ${room.code}`)
        updateRoom(room.code, "player_join_event", { player: getPublicPlayer(player) })
    })

    socket.on("add_bot", (data) => {
        const user_id = auth(data.token, socket.id)
        if (!user_id) {
            socket.emit("error", { err_message: "Invalid input" })
            return
        }

        const room = getRoomFromUser(user_id)

        if (!room) {
            socket.emit("error", { err_message: "Room not found" })
            return
        }

        if (room.game.state !== "waiting") {
            socket.emit("error", { err_message: "Game already started" })
            return
        }

        if (room.game.players.length + 1 > 10) {
            socket.emit("error", { err_message: "Too many players" })
            return
        }

        let name
        if (data.name) {
            if (!(typeof data.name === "string" &&
                data.name.length < 20 &&
                data.name.length >= 3
            )) {
                socket.emit("error", { err_message: "Invalid input" })
            }

            for (const u of room.game.players) {
                if (u.name === data.name) {
                    socket.emit("error", { err_message: "Name already exists" })
                    return
                }
            }

            name = data.name

        } else {
            name = `bot ${randomRoomCode()}` // temp
        }
        const bot: Player = { id: randomUUID(), name: name, hand: [], type: "bot" }
        room.addBot(bot)
        updateRoom(room.code, "player_join_event", { player: getPublicPlayer(bot) })
    })

    socket.on("start_game", (data) => {
        const user_id = auth(data.token, socket.id)
        if (!user_id) {
            socket.emit("error", { err_message: "Invalid input" })
            return
        }

        const room = getRoomFromUser(user_id)

        if (!room) {
            socket.emit("error", { err_message: "Invalid input" })
            return
        }

        const u_count = room.game.players.length
        if (u_count <= 1 || 10 < u_count) {
            socket.emit("error", { err_message: "At least 2 players are reqired to start the game. You can add a bot to increase player count." })
            return
        }

        room.game.startGame()
        updateRoom(room.code, "game_start_event", {})
    })

    socket.on("place_card", (data) => {
        const user_id = auth(data.token, socket.id)
        if (user_id &&
            typeof data.hand_index == "number" &&
            data.hand_index < 100 &&
            data.hand_index >= 0) {
            const room = getRoomFromUser(user_id)

            if (room) {
                const response = room.game.placeCard(user_id, data.hand_index, data.colour)
                if (!response.success) {
                    socket.emit("error", { err_message: response.message! })
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
                    socket.emit("error", { err_message: response.message! })
                }
            }
        }

    })

    socket.on("disconnect", () => {
        const user_id = socketUserIdMap.get(socket.id)
        if (user_id) {
            // delete in 5 seconds, in case user reconnects
            const userExpiry = setTimeout(disconnectUser, 5000, socket.id)
            expiringUsersMap.set(user_id, userExpiry)
        } else {
            disconnectUser(socket.id)
        }
    })
});

httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))