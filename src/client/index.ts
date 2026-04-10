import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events.js"
import type { ActionValue, Colour, NumberValue } from "../types/game.js"
import type { User } from "../types/player.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()

function clearInput(elementId: string): void {
    const input = (document.getElementById(elementId) as HTMLInputElement)
    input.value = ""
}

function clearText(elementId: string): void {
    const text = (document.getElementById(elementId)! as HTMLParagraphElement)
    text.textContent = ""
}

window.addEventListener("DOMContentLoaded", async () => {
    sessionStorage.removeItem("action")
})

function roomExists(room_code: string): Promise<boolean> {
    return new Promise((resolve) => {
        const data: Parameters<ClientToServerEvents["room_exists"]>[0] = {
            room_code: room_code,
        }

        socket.emit("room_exists", data)

        const timeout = setTimeout(() => {
            resolve(false)
        }, 2000)

        socket.once("room_existence", (data) => {
            if (data.room_code === room_code &&
                data.result === true
            ) {
                resolve(true)
            } else {
                resolve(false)
            }
        })

    })
}

function createRoom(data: Parameters<ClientToServerEvents["create_room"]>[0]) {
    socket.emit("create_room", data)
}

function joinRoom(data: Parameters<ClientToServerEvents["join_room"]>[0]) {
    socket.emit("join_room", data)
}

function waitForAuth(): Promise<{ user: User }> {
    return new Promise((resolve) => {
        socket.once("auth", (data) => {
            resolve(data)
        })
    })
}


function showInputError(elementId: string, error: string): void {
    const e = (document.getElementById(elementId)! as HTMLParagraphElement)
    e.style.color = "#cb190b"
    e.textContent = error
    e.style.display = "block"
}

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


document.getElementById("join-btn")?.addEventListener("click", async () => {
    const code_input = (document.getElementById("room-code-input") as HTMLInputElement)
    const code = code_input.value

    if (code.length !== 6) {
        showInputError("game-code-error", "Error: Game not found")
        return
    }

    const room_exists = await roomExists(code)

    if (!room_exists) {
        showInputError("game-code-error", "Error: Game not found")
        return
    }

    sessionStorage.setItem("action", "join")
    const menu_title = (document.getElementById("name-input-menu-title")! as HTMLParagraphElement)
    menu_title.textContent = `Game #${code}`

    const error_text = (document.getElementById("game-code-error")! as HTMLParagraphElement)
    error_text.textContent = ""
    error_text.style.display = "none"
    document.getElementById("main-menu")!.style.display = "none"
    document.getElementById("name-input-menu")!.style.display = "block"
})

document.getElementById("back-btn")?.addEventListener("click", () => {
    document.getElementById("main-menu")!.style.display = "flex"
    document.getElementById("name-input-menu")!.style.display = "none"

    const error = (document.getElementById("game-code-error")! as HTMLParagraphElement)
    error.textContent = ""
    error.style.display = "none"

    clearInput("room-code-input")
    clearInput("player-name-input")
    clearText("name-input-menu-title")
    sessionStorage.removeItem("action")
})

document.getElementById("start-btn")?.addEventListener("click", () => {
    clearInput("player-name-input")
    const menu_title = (document.getElementById("name-input-menu-title")! as HTMLParagraphElement)
    menu_title.textContent = "Create Game"
    sessionStorage.setItem("action", "create")

    document.getElementById("main-menu")!.style.display = "none"
    document.getElementById("name-input-menu")!.style.display = "block";
})

document.getElementById("submit-btn")?.addEventListener("click", async () => {
    (document.getElementById("submit-btn")! as HTMLButtonElement).disabled = true
    const action = sessionStorage.getItem("action")
    if (action === "create") {
        const input = (document.getElementById("player-name-input") as HTMLInputElement)
        const player_name = input.value

        createRoom({
            player_name: player_name
        })

    } else if (action === "join") {
        const name_input = (document.getElementById("player-name-input") as HTMLInputElement)
        const code_input = (document.getElementById("room-code-input") as HTMLInputElement)

        const player_name = name_input.value
        const room_code = code_input.value

        joinRoom({
            player_name: player_name,
            room_code: room_code
        })
    }

    const data = await waitForAuth()

    sessionStorage.setItem("token", data.user.token)
    window.location.href = "/game.html"
    return
})