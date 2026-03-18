import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, removeUser, randomRoomCode } from "./roomManager.js";
import { type ClientToServerEvents, type ServerToClientEvents } from "../types/events.js"
import { randomUUID } from "crypto";

const app = express.default();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

const socketUserIdMap = new Map<string, string>()

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    socket.on("create_room", (data) => {
        if (typeof data.player_name === "string" &&
            data.player_name.length < 20 &&
            data.player_name.length >= 3
        ) {
            const code = randomRoomCode()
            const token = randomUUID()
            const id = randomUUID()
            socketUserIdMap.set(socket.id, id)
            const server_data = {
                user_id: id,
                user_token: token,
                room_code: code,
                player_name: data.player_name
            }
            const room = createRoom(server_data)
            socket.join(code)
            console.log(`user ${server_data.player_name} with id ${id} created room ${server_data.room_code}`)
            socket.emit("room_status", { room_code: room.code, users: room.users, game_state: room.game.state })
        } else {
            socket.emit("error", { message: "Invalid input" })
        }
    })

    socket.on("join_room", (data) => {
        if (typeof data.player_name === "string" &&
            data.player_name.length < 20 &&
            data.player_name.length >= 3 &&
            typeof data.room_code == "string"
        ) {
            const room = getRoom(data.room_code)
            if (room) {
                const token = randomUUID()
                const id = randomUUID()
                socketUserIdMap.set(socket.id, id)
                room.addUser(id, data.player_name, token)
                socket.join(data.room_code)
                io.to(data.room_code).emit("room_status", { room_code: room.code, users: room.users, game_state: room.game.state })
            } else {
                socket.emit("error", { message: "Room not found" })
            }

        } else {
            socket.emit("error", { message: "Invalid input" })
        }
    })

    socket.on("disconnect", () => {
        const mapping = socketUserIdMap.get(socket.id)
        if (mapping) {
            const remove = removeUser(mapping)
            if (remove && remove.deleted && remove.users_left) {
                const room = remove.room!
                io.to(room.code).emit("room_status", { room_code: room.code, users: room.users, game_state: room.game.state })
            }
            socketUserIdMap.delete(socket.id)
        }
        console.log(`${socket.id} disconnected`)
    })

});

httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))