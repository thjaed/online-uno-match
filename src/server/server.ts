import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, randomRoomCode } from "./roomManager.js";
import { type ClientToServerEvents } from "../types/events.js"

const app = express.default();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents>(httpServer);


io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    socket.on("create_room", (data) => {
        const server_data = {
            user_id: socket.id,
            room_code: randomRoomCode(),
            player_name: data.player_name
        }
        createRoom(server_data)
        console.log(`user ${server_data.player_name} with id ${socket.id} created room ${server_data.room_code}`)

    })

    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`)
    })

});

httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))