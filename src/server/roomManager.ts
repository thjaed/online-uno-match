import type { ServerToClientEvents } from "../types/events.js"
import type { PublicUsers, ServerCreateRoomData } from "../types/server.js"
import { Game } from "./game.js"
import type { Player, User } from "../types/player.js"

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
        const player: Player = { id: user.id, hand: [], name: user.name }

        this.users.push(user)
        this.game.players.push(player)
    }

    removeUser(id: string) {
        const user = this.users.find(u => u.id === id)
        const player = this.game.players.find(u => u.id === id)

        if (user) {
            this.users.splice(this.users.indexOf(user), 1)
        }

        if (player) {
            this.game.players.splice(this.game.players.indexOf(player), 1)
        }
    }
}

export function getIdFromToken(token: string) {
    for (const r of rooms) {
        for (const u of r.users) {
            if (u.token === token) {
                return u.id
            }
        }
    }
    return undefined

}

export function getRoomFromUser(id: string) {
    for (const r of rooms) {
        for (const u of r.users) {
            if (u.id == id) {
                return r
            }
        }
    }
}

export function removeUser(id: string) {
    // find room that user is in
    let room
    for (const r of rooms) {
        for (const u of r.users) {
            if (u.id == id) {
                room = r
                break
            }
        }
    }
    if (room) {
        if (room && room.users.length === 1) {
            // delete if ther is only 1 user left
            deleteRoom(room.code)
            return { deleted: true, users_left: false }
        } else if (room) {
            // delete the user
            room.removeUser(id)
            return { deleted: true, users_left: true, room: room }
        }
    } else {
        console.log("no user deleted")
        return { deleted: false }
    }
}


export function getRoom(code: string) {
    return (rooms.find(r => r.code === code))
}

export function getPublicRoomStatus(room_code: string) {
    const room = getRoom(room_code)

    if (room) {
        let users: PublicUsers[] = []
        for (const u of room.users) {
            users.push({
                name: u.name,
                id: u.id
            })
        }
            const data: Parameters<ServerToClientEvents["room_status"]>[0] = {
                room_code: room.code,
                public_users: users,
                game_state: room.game.state
            }

            return data
    }
}

export function createRoom(data: ServerCreateRoomData) {
    const room_code = data.room_code

    if (getRoom(room_code)) {
        throw new Error("Room ID already exists")
    }

    const user_id = data.user.id
    const player: Player = { id: user_id, hand: [], name: data.user.name }
    const user: User = { id: user_id, token: data.user.token, name: data.user.name }
    const game = new Game([player])
    const room = new Room(room_code, game, [user])
    rooms.push(room)

    return room
}

export function resetRoom(room_code: string) {
    let room = getRoom(room_code)
    if (room) {
        const game = new Game(room.game.players)
        room.game = game
    }
}

export function deleteRoom(code: string) {
    const room = getRoom(code)

    if (room) {
        rooms.splice(rooms.indexOf(room), 1)
    }
}

export function randomRoomCode() {
    let code: string

    do {
        code = Math.floor(Math.random() * 900000 + 100000).toString()
    } while (getRoom(code))

    return code
}