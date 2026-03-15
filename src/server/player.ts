import { type Card } from "../types/game.js"

export class Player {
    id: number
    hand: Card[]

    constructor(id: number) {
        this.id = id
        this.hand = []
    }
}