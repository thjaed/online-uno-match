import { type Card } from "./game.js"

export type Player = {
    id: string
    name: string
    hand: Card[]
    type: "human" | "bot"
}

export type User = {
    id: string
    token: string
    name: string
}