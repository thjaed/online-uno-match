import { updateRoom } from "./server.js";
import type { game_event } from "../types/events.js";

export function update(type: game_event, room_code: string, data: any) {
    updateRoom(room_code, type, data)
}