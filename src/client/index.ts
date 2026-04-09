import type { ActionValue, Colour, NumberValue } from "../types/game.js"

function randomCardAsset() {
    const colours: Colour[] = ["blue", "green", "red", "yellow"]
    const colour = colours[Math.floor(Math.random() * (colours.length))]!

    const values: (NumberValue | ActionValue)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "draw2", "reverse", "skip"]
    const value = values[Math.floor(Math.random() * (values.length - 1))]!

    return `assets/${colour}_${value}.svg`
}
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const card_count = Math.max(10, Math.round(vw / 100))

// create card elements
for (const edge of ["bottom", "top"]) {
    for (let c = 0; c < card_count; c++) {
        // add random cards to carousel
        const group = document.getElementById(`${edge}_group`)!

        const card_div = document.createElement("div")
        card_div.className = "card"
        group.appendChild(card_div)

        const asset_name = randomCardAsset()
        const card_element = document.createElement("img")
        card_element.src = asset_name
        card_element.height = 150

        card_div.appendChild(card_element)
    }

    // duplicate group for infinite scroll
    const carousel = document.getElementById(`${edge}_carousel`)!
    const group = document.getElementById(`${edge}_group`)!

    const clone = group.cloneNode(true) as HTMLDivElement
    clone.setAttribute("aria-hidden", "true")

    carousel.appendChild(clone);
    carousel.style=""
}

document.getElementById("join-btn")?.addEventListener("click", () => {
    const code_input = (document.getElementById("room_code_input") as HTMLInputElement)
    window.location.href = 'game.html?action=join'
    code_input.value = ""
    console.log("join button pressed")
})