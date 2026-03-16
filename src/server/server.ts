import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express.default();
const httpServer = createServer(app);
export const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`)

  socket.on("create_room", () => {
    console.log(`${socket.id}: create_room`)
  })

  socket.on("join_room", () => {
    console.log(`${socket.id}: join_room`)
  })
});


httpServer.listen(8080);
app.use(express.static("src/client"))
app.use(express.static("dist/client"))