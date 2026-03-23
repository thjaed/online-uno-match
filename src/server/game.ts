import { json } from "stream/consumers"
import { type Card, type Colour } from "../types/game.js"
import { type Player } from "../types/player.js"
import { createDeck, shuffle } from "./deck.js"

export class Game {
    players: Player[]
    deck: Card[]
    discard: Card[]
    currentPlayerIndex: number
    direction: 1 | -1
    colour_effect: Colour | null
    state: "waiting" | "playing" | "finished"
    winner: Player | null

    constructor(players?: Player[]) {
        players ? this.players = players : this.players = []
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
            return { type: "error", message: "Game already started" }
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
        this.useEffect(start_card, this.randomColour())

        this.currentPlayerIndex = 0
        this.direction = 1
    }

    randomColour(): Colour {
        const colours: Colour[] = ["blue", "green", "red", "yellow"]
        return colours[Math.floor(Math.random() * (colours.length - 1))]!
    }

    getNextPlayer(index?: number, increment: number = 1) {
        index ??= this.currentPlayerIndex

        const step = increment * this.direction
        const next = (index + step + this.players.length) % this.players.length

        return next
    }

    nextPlayer(skip: boolean): void {
        if (skip) {
            // skip next player
            this.currentPlayerIndex = this.getNextPlayer(this.getNextPlayer())
        } else {
            this.currentPlayerIndex = this.getNextPlayer()
        }

        this.botPlay()

    }

    isCardValid(card: Card) {
        const top = this.getTopCard()

        if (card.type === "wild") { //is wild card
            return true
        } else if (card.value === top.value) { // is same value
            return true
        } else if ((top.type === "wild") && (this.colour_effect === card.colour)) { // is same colour as colour effect
            return true
        } else if ((top.type !== "wild") && (card.colour === top.colour)) { // is same colour as top
            return true
        } else {
            return false
        }
    }

    botPlay(): void {
        const bot = this.players[this.currentPlayerIndex]

        if (bot && bot.type === "bot") {
            const delay = Math.random() * 1200 + 800

            setTimeout(() => {
                let placed_card = false

                for (const c of bot.hand) {
                    if (this.isCardValid(c)) {
                        this.placeCard(bot.id, bot.hand.indexOf(c), this.randomColour())
                        placed_card = true
                        break
                    }
                }

                if (!placed_card) {
                    this.drawForPlayer(bot.id)
                }

            }, delay)
        }
    }

    placeCard(player_id: string, hand_index: number, chosen_colour?: Colour) {
        if (this.state !== "playing") {
            return { type: "error", message: "Game not active" }
        }

        const player = this.players.find(x => x.id === player_id)

        if (player === undefined) {
            return { type: "error", message: "Player not found" }
        }

        if (this.players[this.currentPlayerIndex]?.id !== player_id) {
            return { type: "error", message: "Not turn" }
        }

        if (hand_index < 0 || hand_index >= player.hand.length) {
            return { type: "error", message: "Hand index out of bounds" }
        }

        const card = player.hand[hand_index]!

        if (!(this.isCardValid(card))) {
            return { type: "error", message: "Card not valid" }
        }

        // move card to discard pile
        player.hand.splice(hand_index, 1)
        this.discard.push(card)

        if (player.hand.length === 0) {
            this.endGame(player)
            return { type: "success", data: player.hand }
        }

        const effect_response = this.useEffect(card, chosen_colour)

        if (effect_response.type === "error") {
            return effect_response
        }

        this.nextPlayer(card.value === "skip")

        return { type: "success", data: player.hand }
    }

    useEffect(card: Card, chosen_colour?: Colour) {
        // card effects
        if (card.type === "action" && card.value === "reverse") {
            // reverse direction
            this.direction *= -1

        } else if (card.value === "draw2" || card.value === "wild_draw4") {
            // draw
            const qty = card.value === "draw2" ? 2 : 4 // set draw quantity
            const target = this.players[this.getNextPlayer()]!

            for (let i = 0; i < qty; i++) {
                // give next player a card
                target.hand.push(this.drawCard())
            }
        }

        if (card.type === "wild") {
            // change colour
            if (chosen_colour) {
                this.colour_effect = chosen_colour
            } else {
                return { type: "error", message: "No colour specified" }
            }
        } else {
            this.colour_effect = null
        }

        return { type: "success" }
    }

    endGame(player: Player) {
        this.state = "finished"
        this.winner = player
    }

    drawCard() {
        if (this.deck.length === 0) {
            const top = this.discard.pop()!
            this.deck = shuffle(this.discard)
            this.discard = [top]
        }
        return this.deck.pop()!
    }

    drawForPlayer(player_id: string) {
        if (this.state !== "playing") {
            return { type: "error", message: "Game not active" }
        }

        const player = this.players.find(x => x.id === player_id)

        if (player === undefined) {
            return { type: "error", message: "Player not found" }
        }

        if (this.players[this.currentPlayerIndex] !== player) {
            return { type: "error", message: "Not your turn" }
        }

        player.hand.push(this.drawCard())

        this.nextPlayer(false)

        return { type: "success" }
    }

    getPublicState(viewer_id: string) {
        const viewer = this.players.find(x => x.id === viewer_id)!

        if (!viewer) {
            return { type: "error", message: "User not found" }
        }

        // get info for other players
        let players_public = []
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i]!

            const public_player = {
                "id": player.id,
                "name": player.name,
                "handSize": player.hand.length,
                "index": i
            }
            players_public.push(public_player)
        }

        return {
            "gameState": this.state,
            "players": players_public,
            "yourHand": viewer.hand,
            "yourIndex": this.players.indexOf(viewer),
            "topCard": this.getTopCard(),
            "currentPlayerId": this.players[this.currentPlayerIndex]!.id, // this sometimes breaks if a player leaves
            "direction": this.direction,
            "colourEffect": this.colour_effect
        }
    }

    getEndState() {
        if (this.state === "finished" && this.winner !== null) {
            return {
                "winner": this.winner.id
            }
        } else {
            return { type: "error", message: "Game not finished" }
        }
    }
}