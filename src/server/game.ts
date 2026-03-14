import { type Card, type Colour } from "../shared/card.ts";
import { Player } from "./player.ts";
import { createDeck } from "../shared/deck.ts";

export class Game {
    players: Player[]
    deck: Card[]
    discard: Card[]
    currentPlayerIndex: number
    direction: 1 | -1

    constructor(players: Player[]) {
        this.players = players
        this.deck = []
        this.discard = []
        this.currentPlayerIndex = 0
        this.direction = 1
    }

    startGame() {
        this.deck = createDeck()
        for (let player of this.players) {
            for (let i = 0; i < 7; i++) {
                player.hand.push(this.deck.pop()!)
            }
        }
        this.discard.push(this.deck.pop()!)
        this.currentPlayerIndex = 0
        this.direction = 1
    }

    nextPlayer() {
        if ((this.currentPlayerIndex + this.direction) <= (this.players.length - 1)) {
            this.currentPlayerIndex += this.direction
        } else {
            this.currentPlayerIndex = 0
        }
    }

    isCardValid(card: Card, top: Card) {
        if (card.type === "wild" || top.type == "wild") { //is wild card
            return true
        } else if (card.value === top.value) { // is same value
            return true
        } else if (card.colour == top.colour) { // is same colour
            return true
        } else {
            return false
        }
    }
    
    placeCard(player_id: number, hand_index: number) {
        const player = this.players.find(x => x.id === player_id)
        if (player === undefined) {
            throw new Error("Player not found")
        }

        if (this.players[this.currentPlayerIndex] !== player) {
            throw new Error("Not player's turn")
        }
        
        if (hand_index < 0 || hand_index >= player.hand.length) {
            throw new Error("Hand index out of bounds")
        }
        const card = player.hand[hand_index]!

        if (!(this.isCardValid(card, this.discard[this.discard.length - 1]!))) {
            throw new Error("Card not valid")

        } else {
            player.hand.splice(hand_index, 1)
            this.discard.push(card)
            this.nextPlayer()
            return player.hand
        }
    }
}