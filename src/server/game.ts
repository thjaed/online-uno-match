import { type Card, type Colour } from "../types/game.js"
import { type Player } from "../types/player.js"
import type { PublicPlayer } from "../types/player.js"
import { getPublicPlayer } from "./roomManager.js"
import { createDeck, shuffle } from "./deck.js"
import { update } from "./gameUpdateManager.js"

export class Game {
    room_code: string
    players: Player[]
    deck: Card[]
    discard: Card[]
    currentPlayerIndex: number
    direction: 1 | -1
    colour_effect: Colour | null
    state: "waiting" | "playing" | "finished"
    winner: Player | null

    constructor(players: Player[], room_code: string) {
        this.room_code = room_code
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
        return colours[Math.floor(Math.random() * (colours.length))]!
    }

    getNextPlayer(increment: number = 1) {
        const index = this.currentPlayerIndex

        const step = increment * this.direction
        const next = (index + step + this.players.length) % this.players.length

        return next
    }

    nextPlayer(skip: boolean): void {
        if (skip) {
            // skip next player
            this.currentPlayerIndex = this.getNextPlayer(2)
        } else {
            this.currentPlayerIndex = this.getNextPlayer(1)
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

    placeCard(player_id: string, hand_index: number, chosen_colour?: Colour): { success: boolean, message: string, hand: Card[], won: boolean } {
        if (this.state !== "playing") {
            return { success: false, message: "Game not active", hand: [], won: false }
        }

        const player = this.players.find(x => x.id === player_id)

        if (player === undefined) {
            return { success: false, message: "Player not found", hand: [], won: false }
        }

        if (this.players[this.currentPlayerIndex]?.id !== player_id) {
            return { success: false, message: "Not turn", hand: [], won: false }
        }

        if (hand_index < 0 || hand_index >= player.hand.length) {
            return { success: false, message: "Hand index out of bounds", hand: [], won: false }
        }

        const card = player.hand[hand_index]!

        if (!(this.isCardValid(card))) {
            return { success: false, message: "Card not valid", hand: [], won: false }
        }

        // move card to discard pile
        player.hand.splice(hand_index, 1)
        this.discard.push(card)

        if (player.hand.length === 0) {
            this.endGame(player, card)
            return { success: true, message: "", won: true, hand: player.hand }
        }

        const effect = this.useEffect(card, chosen_colour)

        if (effect.action === "skipped") {
            this.nextPlayer(true)
        } else {
            this.nextPlayer(false)
        }

        update("place_card_event", this.room_code, { player: getPublicPlayer(player), card: card })
        return { success: true, message: "", won: false, hand: player.hand }
    }

    useEffect(card: Card, chosen_colour?: Colour): { action: "drew" | "skipped" | null, colour_change: boolean } {
        // wild colour
        if (card.type === "wild" && chosen_colour) {
            this.colour_effect = chosen_colour
            if (card.value === "wild") {
                return { action: null, colour_change: true }
            }
        } else {
            this.colour_effect = null
        }
        const colour_changed = this.colour_effect !== null

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

            return { action: "drew", colour_change: colour_changed }

        } else if (card.value === "skip") {
            return { action: "skipped", colour_change: colour_changed }
        }

        return { action: null, colour_change: false }
    }

    endGame(player: Player, card: Card) {

        this.state = "finished"
        this.winner = player
        update("game_end_event", this.room_code, { winner: getPublicPlayer(player), card: card })
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

        const card = this.drawCard()
        player.hand.push(card)

        this.nextPlayer(false)

        update("draw_card_event", this.room_code, { player: getPublicPlayer(player), card: card })

        return { type: "success" }
    }

    getPublicState(viewer_id: string) {
        const viewer = this.players.find(x => x.id === viewer_id)!

        if (!viewer) {
            return { type: "error", message: "User not found" }
        }

        // get info for other players
        let players_public: PublicPlayer[] = []
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i]!

            const public_player = {
                "id": player.id,
                "name": player.name,
                "hand_size": player.hand.length,
                "index": i,
                "type": player.type
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