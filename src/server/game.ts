import { type Card, type Colour } from"../types/game.ts"
import { Player } from "../server/player.ts"
import { createDeck, shuffle } from "./deck.ts"

export class Game {
    players: Player[]
    deck: Card[]
    discard: Card[]
    currentPlayerIndex: number
    direction: 1 | -1
    colour_effect: Colour | null
    state: "waiting" | "playing" | "finished"
    winner: Player | null

    constructor(players: Player[]) {
        this.players = players
        this.deck = []
        this.discard = []
        this.currentPlayerIndex = 0
        this.direction = 1
        this.colour_effect = null
        this.state = "waiting"
        this.winner = null
    }

    getTopCard() {
        return this.discard[this.discard.length - 1]!
    }

    startGame() {
        if (this.state !== "waiting") {
            throw new Error("Game already started")
        }

        this.state = "playing"
        this.deck = createDeck()
        for (let player of this.players) {
            for (let i = 0; i < 7; i++) {
                player.hand.push(this.drawCard())
            }
        }
        const start_card = this.drawCard()
        this.discard.push(start_card)

        // pick a random colour if starting card is a wild card
        const colours: Colour[] = ["blue", "green", "red", "yellow"]
        this.useEffect(start_card, colours[Math.floor(Math.random() * (colours.length - 1))])

        this.currentPlayerIndex = 0
        this.direction = 1
    }

    getNextPlayer(index?: number, increment: number = 1) {
        index ??= this.currentPlayerIndex

        const step = increment * this.direction
        const next = (index + step + this.players.length) % this.players.length

        return next
    }

    isCardValid(card: Card) {
        const top = this.getTopCard()

        if (card.type === "wild") { //is wild card
            return true
        } else if (card.value === top.value) { // is same value
            return true
        } else if ((top.type == "wild") && (this.colour_effect === card.colour)) { // is same colour as colour effect
            return true
        }  else if ((top.type !== "wild") && (card.colour === top.colour)) { // is same colour as top
            return true
        } else {
            return false
        }
    }

    placeCard(player_id: number, hand_index: number, chosen_colour?: Colour) {
        if (this.state !== "playing") {
            throw new Error("Game not active")
        }

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

        if (player.hand.length === 0) {
            this.endGame(player)
            return player.hand
        }

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
            const target = this.players[this.getNextPlayer()]!

            for (let i = 0; i < qty; i++) {
                // give next player a card
                target.hand.push(this.drawCard())
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
        } else {
            this.colour_effect = null
        }
    }

    endGame(player: Player) {
        this.state = "finished"
        this.winner = player
        console.log(`Player ${player.id} won!`)
    }

    drawCard() {
        if (this.deck.length === 0) {
            const top = this.discard.pop()!
            this.deck = shuffle(this.discard)
            this.discard = [top]
        }
        return this.deck.pop()!
    }

    drawForPlayer(player_id: number) {
        if (this.state !== "playing") {
            throw new Error("Game not active")
        }

        const player = this.players.find(x => x.id === player_id)

        if (player === undefined) {
            throw new Error("Player not found")
        }

        if (this.players[this.currentPlayerIndex] !== player) {
            throw new Error("Not player's turn")
        }

        player.hand.push(this.drawCard())

        this.currentPlayerIndex = this.getNextPlayer()
    }

    getPublicState(viewer_id: number) {
        const viewer = this.players.find(x => x.id === viewer_id)!

        if (!viewer) {
            throw new Error("Viewer not found")
        }

        // get info for other players
        let players_public = []
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i]!

            const id = player.id
            const hand_size = player.hand.length
            const index = i

            const public_player = {"id": id, "handSize": hand_size, "index": index}
            players_public.push(public_player)
        }

        return {
            "gameState": this.state,
            "players": players_public,
            "yourHand": viewer.hand,
            "yourIndex": this.players.indexOf(viewer),
            "topCard": this.getTopCard(),
            "currentPlayerId": this.players[this.currentPlayerIndex]!.id,
            "deckSize": this.deck.length,
            "discardSize": this.discard.length,
            "direction": this.direction,
            "winnerId": this.winner?.id ?? null,
            "colourEffect": this.colour_effect
        }

    }
}