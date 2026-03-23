import type { Player, User } from "./player.js"

export type ServerCreateRoomData = {
    user: User
    room_code: string}

export type PublicPlayers = {
    id: string
    name: string
    type: Player["type"]
}