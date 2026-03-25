import type { User } from "./player.js"

export type ServerCreateRoomData = {
    user: User
    room_code: string
}