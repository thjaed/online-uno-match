import { type Card, type Colour } from "../shared/card.ts";
import { Player } from "./player.ts";
import { createDeck } from "../shared/deck.ts";

export class Game {
    players: Player[]
    deck: Card[]
    discard: Card[]
    currentPlayerIndex: number
    direction: 1 | -1
    colour_effect: Colour | null

    constructor(players: Player[]) {
        this.players = players
        this.deck = []
        this.discard = []
        this.currentPlayerIndex = 0
        this.direction = 1
        this.colour_effect = null
    }

    getTopCard() {
        return this.discard[this.discard.length - 1]!
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

    getNextPlayer(index?: number, increment: number = 1) {
        index ??= this.currentPlayerIndex
        
        const step = increment * this.direction
        const next = (index + step + this.players.length) % this.players.length
        
        return next
    }

    isCardValid(card: Card, top?: Card, check_colour_effect?: boolean) {
        top = top ? top : this.getTopCard()

        if (card.type === "wild" || top.type == "wild") { //is wild card
            return true
        } else if (card.value === top.value) { // is same value
            return true
        } else if (card.colour === (check_colour_effect ? this.colour_effect : top.colour)) { // is same colour as top or as colour effect if being checked
            return true
        } else {
            return false
        }
    }

    placeCard(player_id: number, hand_index: number, chosen_colour?: Colour) {
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

        if (!(this.isCardValid(card))) {
            throw new Error("Card not valid")
        }

        // move card to discard pile
        player.hand.splice(hand_index, 1)
        this.discard.push(card)

        this.useEffect(card, chosen_colour)

        if (card.value === "skip") {
            // skip next player
            console.log(`Skipping ${this.getNextPlayer()}, Next Player: ${this.getNextPlayer(this.getNextPlayer())}`)
            this.currentPlayerIndex = this.getNextPlayer(this.getNextPlayer())
        } else {
            this.currentPlayerIndex = this.getNextPlayer()
        }

        return player.hand
    }

    useEffect(card: Card, chosen_colour?: Colour) {
        // card effects
        if (card.type === "action" && card.value == "reverse") {
            // reverse direction
            this.direction *= -1
            console.log(`Reversed direction to ${this.direction}`)

        } else if (card.value == "draw2" || card.value == "wild_draw4") {
            console.log(`Hand before draw: ${JSON.stringify(this.players[this.getNextPlayer()]!.hand)}`)
            // draw
            const qty = card.value == "draw2" ? 2 : 4 // set draw quantity

            for (let i = 0; i < qty; i++) {
                // give next player a card
                this.players[this.getNextPlayer()]!.hand.push(this.deck.pop()!)
            }

            console.log(`Player ID ${this.players[this.getNextPlayer()]!.id} drew ${qty}`)
            console.log(`Hand after draw: ${JSON.stringify(this.players[this.getNextPlayer()]!.hand)}`)
        }

        if (card.type == "wild") {
            // change colour
            if (chosen_colour) {
                console.log(`Setting colour to ${chosen_colour}`)
                this.colour_effect = chosen_colour
            } else {
                throw new Error("No colour specified")
            }
        }
    }
}