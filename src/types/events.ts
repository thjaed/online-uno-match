import type { Game } from "../server/game.js"
import type { Card, Colour } from "./game.js"
import type { User } from "./player.js"
import type { PublicPlayer } from "./player.js"

export interface ClientToServerEvents {
    reconnect: (data: { token: string }) => void
    reset_room: (data: { token: string }) => void
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
        public_players: PublicPlayer[],
        game_state: Game["state"]
    }) => void
    game_status: (data: any) => void
    create_room_event: (data: { code: string }) => void
    place_card_event: (data: { player: PublicPlayer, card: Card }) => void
    draw_card_event: (data: { player: PublicPlayer }) => void
    game_start_event: (data: {}) => void
    game_end_event: (data: { winner: PublicPlayer }) => void
    player_join_event: (data: { player: PublicPlayer }) => void
    player_leave_event: (data: { player: PublicPlayer }) => void
}

export type game_event = (
    "create_room_event" |
    "player_leave_event" |
    "player_join_event" |
    "place_card_event" |
    "draw_card_event" |
    "game_start_event" |
    "game_end_event"
)