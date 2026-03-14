import { Game } from "./game.ts";
import { Player } from "./player.ts";

function placeCardDemo() {
    const player_count = 5
    let players: Player[] = []

    for (let i = 1; i < player_count + 1; i++) {
        players.push(new Player(i, `Player ${i}`))
    }

    const game = new Game(players)

    game.startGame()

    console.log(`\n\nPlacing ${JSON.stringify(game.players[0]!.hand[0])} on pile ${JSON.stringify(game.discard)}`)
    try {
        game.placeCard(1, 0)
        console.log("Succeeded")
    } catch {
        console.log("Rejected")
    }
    console.log(`\n Discard Pile: ${JSON.stringify(game.discard)}\n`)
}