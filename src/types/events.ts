export interface ClientToServerEvents {
    create_room: (data: { player_name: string }) => void
}