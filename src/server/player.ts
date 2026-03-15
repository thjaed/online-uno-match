import { type Card } from "../types/game.ts"

export class Player {
    id: number
    hand: Card[]

    constructor(id: number) {
        this.id = id
        this.hand = []
    }
}