import type { User } from "./player.js"

export type ServerCreateRoomData = {
    user: User
    room_code: string}

export type PublicUsers = {
    id: string
    name: string
}