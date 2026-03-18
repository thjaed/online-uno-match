import { type Card } from "../types/game.js"

export class Player {
    id: string
    hand: Card[]

    constructor(id: string) {
        this.id = id
        this.hand = []
    }
}

export class User {
    id: string
    token: string
    name: string

    constructor(id: string, name: string, token: string) {
        this.id = id
        this.name = name
        this.token = token
    }
}