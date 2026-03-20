import type { Game } from "../server/game.js"
import type { User } from "../server/player.js"
import type { PublicUsers } from "./server.js"

export interface ClientToServerEvents {
    create_room: (data: { player_name: string }) => void
    join_room: (data: { room_code: string, player_name: string }) => void
    start_game: (data: { token: string }) => void
}

export interface ServerToClientEvents {
    error: (data: { message: string }) => void
    auth: (data: { token: string }) => void
    room_status: (data: {
        room_code: string,
        public_users: PublicUsers[],
        game_state: Game["state"]
    }) => void
    game_status: (data: any) => void
}