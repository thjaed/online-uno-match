import { type Card, type NumberCard, type Colour, type NumberValue, type ActionValue, type WildValue } from "../types/game.js"

export function shuffle(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i]!, deck[j]!] = [deck[j]!, deck[i]!]
    }
    return deck
}

export function createDeck(): Card[] {
    let deck: Card[] = []
    const colours: Colour[] = ["red", "blue", "green", "yellow"]
    const numbers: NumberValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const actions: ActionValue[] = ["draw2", "reverse", "skip"]
    const wilds: WildValue[] = ["wild", "wild_draw4"]

    // Colour cards
    for (const colour of colours) {

        // number cards 1-9
        for (const num of numbers) {
            for (let i = 0; i < 2; i++) {
                deck.push({
                    type: "number",
                    colour: colour,
                    value: num
                })
            }
        }

        // 0 cards
        deck.push({
            type: "number",
            colour: colour,
            value: 0
        })

        // action cards
        for (const action of actions) {
            for (let i = 0; i < 2; i++) {
                deck.push({
                    type: "action",
                    colour: colour,
                    value: action
                })
            }
        }
    }
    // wild cards
    for (const wild of wilds) {
        for (let i = 0; i < 4; i++) {
            deck.push({
                type: "wild",
                value: wild
            })
        }
    }

    return shuffle(deck)
}
