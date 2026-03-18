import type { Game } from "../server/game.js"
import type { User } from "../server/player.js"

export interface ClientToServerEvents {
    create_room: (data: { player_name: string }) => void
    join_room: (data: { room_code: string, player_name: string }) => void
}

export interface ServerToClientEvents {
    error: (data: { message: string }) => void
    room_status: (data: {
        room_code: string,
        users: User[],
        game_state: Game["state"]
    }) => void
}