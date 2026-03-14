import { type Card } from "../shared/card.ts"

export class Player {
    id: number
    name: string
    hand: Card[]

    constructor(id: number, name: string) {
        this.id = id
        this.name = name
        this.hand = []
    }
}