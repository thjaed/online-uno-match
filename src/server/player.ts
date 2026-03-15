import { type Card } from "../shared/card.ts"

export class Player {
    id: number
    hand: Card[]

    constructor(id: number) {
        this.id = id
        this.hand = []
    }
}