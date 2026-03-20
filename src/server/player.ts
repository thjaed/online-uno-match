import { type Card } from "../types/game.js"

export type Player = {
    id: string
    hand: Card[]
}

export type User = {
    id: string
    token: string
    name: string
}