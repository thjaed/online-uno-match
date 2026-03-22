import type { Game } from "../server/game.js"
import type { Colour } from "./game.js"
import type { PublicUsers } from "./server.js"

export interface ClientToServerEvents {
    reconnect: (data: { token: string }) => void
    create_room: (data: { player_name: string }) => void
    join_room: (data: { room_code: string, player_name: string }) => void
    start_game: (data: { token: string }) => void
    place_card: (data: { token: string, hand_index: number, colour: Colour | undefined }) => void
    draw_card: (data: { token: string }) => void
}

export interface ServerToClientEvents {
    error: (data: { message: string }) => void
    reconnect_error: () => void
    reconnect_success: () => void
    auth: (data: { token: string }) => void
    room_status: (data: {
        room_code: string,
        public_users: PublicUsers[],
        game_state: Game["state"]
    }) => void
    game_status: (data: any) => void
}