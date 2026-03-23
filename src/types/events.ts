import type { Game } from "../server/game.js"
import type { Colour } from "./game.js"
import type { User } from "./player.js"
import type { PublicPlayers } from "./server.js"

export interface ClientToServerEvents {
    reconnect: (data: { token: string }) => void
    create_room: (data: { player_name: string }) => void
    join_room: (data: { room_code: string, player_name: string }) => void
    add_bot: (data: { token: string, name?: string }) => void
    start_game: (data: { token: string }) => void
    place_card: (data: { token: string, hand_index: number, colour: Colour | undefined }) => void
    draw_card: (data: { token: string }) => void
}

export interface ServerToClientEvents {
    error: (data: { message: string }) => void
    reconnect_error: () => void
    reconnect_success: () => void
    auth: (data: { user: User }) => void
    room_status: (data: {
        room_code: string,
        public_players: PublicPlayers[],
        game_state: Game["state"]
    }) => void
    game_status: (data: any) => void
    game_end: (data: any) => void
}