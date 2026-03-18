import type { ServerCreateRoomData } from "../types/server.js"
import { Game } from "./game.js"
import { Player, User } from "./player.js"

let rooms: Room[] = []

export class Room {
    code: string
    game: Game
    users: User[]

    constructor(code: string, game: Game, users?: User[]) {
        this.code = code
        this.game = game
        users ? this.users = users : this.users = []
    }

    addUser(user: User) {
        this.users.push(user)
    }

    removeUser(user: User) {
        this.users.splice(this.users.indexOf(user), 1)
    }
}

export function getRoom(code: string) {
    return (rooms.find(r => r.code === code))
}

export function createRoom(data: ServerCreateRoomData) {
    const room_code = data.room_code

    if (getRoom(room_code)) {
        throw new Error("Room ID already exists")
    }
    const user_id = data.user_id
    const player_name = data.player_name

    const player = new Player(data.user_id)
    const user = { id: user_id, name: player_name }
    const game = new Game([player])

    const room = new Room(room_code, game, [user])
    rooms.push(room)

    return room
}

export function randomRoomCode() {
    let code: string

    do {
        code = Math.floor(Math.random() * 900000 + 100000).toString()
    } while (getRoom(code))

    return code
}