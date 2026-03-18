import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, randomRoomCode } from "./roomManager.js";
import { type ClientToServerEvents, type ServerToClientEvents } from "../types/events.js"

const app = express.default();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);


io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    socket.on("create_room", (data) => {
        if (typeof data.player_name === "string" &&
            data.player_name.length < 20 &&
            data.player_name.length >= 3
        ) {
            const server_data = {
                user_id: socket.id,
                room_code: randomRoomCode(),
                player_name: data.player_name
            }
            const room = createRoom(server_data)
            console.log(`user ${server_data.player_name} with id ${socket.id} created room ${server_data.room_code}`)
            socket.emit("room_status", { room_code: room.code, users: room.users, game_state: room.game.state })
        } else {
            socket.emit("error", { message: "Invalid input - Player name must be 3 to 20 characters."})
        }
    })

    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`)
    })

});

httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))