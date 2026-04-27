import { type Card } from "./game.js"

export type Player = {
    id: string
    name: string
    hand: Card[]
    toDraw: number
    type: "human" | "bot"
}

export type PublicPlayer = {
    id: string
    name: string
    hand_size?: number
    type: Player["type"]
}

export type User = {
    id: string
    token: string
    name: string
}

export type PublicUser = {
    id: string
    name: string
}