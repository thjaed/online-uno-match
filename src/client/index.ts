import type { ActionValue, Colour, NumberValue } from "../types/game.js"

function randomCardAsset() {
    const colours: Colour[] = ["blue", "green", "red", "yellow"]
    const colour = colours[Math.floor(Math.random() * (colours.length))]!

    const values: (NumberValue | ActionValue)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "draw2", "reverse", "skip"]
    const value = values[Math.floor(Math.random() * (values.length - 1))]!

    return `assets/${colour}_${value}.svg`
}

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const card_count = Math.max(12, Math.round(vw / 100))

// create card elements
for (const edge of ["bottom", "top"]) {
    for (let c = 0; c < card_count; c++) {
        // add random cards to carousel
        const group = document.getElementById(`${edge}-group`)!

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
    const carousel = document.getElementById(`${edge}-carousel`)!
    const group = document.getElementById(`${edge}-group`)!

    const clone = group.cloneNode(true) as HTMLDivElement
    clone.setAttribute("aria-hidden", "true")

    carousel.appendChild(clone);
    carousel.style.display = ""
}


document.getElementById("join-btn")?.addEventListener("click", () => {
    const code_input = (document.getElementById("room-code-input") as HTMLInputElement)
    const code = code_input.value
    const menu_title = (document.getElementById("name-input-menu-title")! as HTMLParagraphElement)
    menu_title.textContent = `Game #${code}`

    document.getElementById("main-menu")!.style.display = "none"
    document.getElementById("name-input-menu")!.style.display = "block";
    code_input.value = ""
})

document.getElementById("back-btn")?.addEventListener("click", () => {
    document.getElementById("main-menu")!.style.display = "flex"
    document.getElementById("name-input-menu")!.style.display = "none"
    
    const menu_title = (document.getElementById("name-input-menu-title")! as HTMLParagraphElement)
    menu_title.textContent = ""
})

document.getElementById("start-btn")?.addEventListener("click", () => {
    const menu_title = (document.getElementById("name-input-menu-title")! as HTMLParagraphElement)
    menu_title.textContent = "Create Game"

    document.getElementById("main-menu")!.style.display = "none"
    document.getElementById("name-input-menu")!.style.display = "block";
})