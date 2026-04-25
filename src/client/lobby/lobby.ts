import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "../../types/events.js"

declare const io: () => Socket<ServerToClientEvents, ClientToServerEvents>

const socket = io()


window.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("token")

    if (token) {
        const success = await reconnect()

        if (success) {
            socket.once("room_status", (data) => {
                if (data.game_state === "waiting" && window.location.pathname !== "/lobby/") {
                    window.location.href = "/lobby"
                    return
                }
            })

            socket.once("game_status", (data) => {
                if ((data.gameState === "playing" || data.gameState === "finished")
                    && window.location.pathname !== "/game/" && sessionStorage.getItem("in_game") === "false") {
                    window.location.href = "/game"
                    return
                }
            })
        } else {
            sessionStorage.getItem("in_game") === "false"
            window.location.href = "/"
        }
    }
})

function showInputError(elementId: string, error: string): void {
    const e = (document.getElementById(elementId)! as HTMLParagraphElement)
    e.textContent = error
    e.style.display = "block"
}

function clearErrors(): void {
    const errors = document.querySelectorAll<HTMLParagraphElement>(".error");

    errors.forEach((error) => {
        error.textContent = "";
        error.style.display = "none";
    });
}


function waitForSocketEvent(idealResponse: keyof ServerToClientEvents):
    Promise<{ "success": boolean, message?: string, data?: any }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ "success": false, "message": "Timed out" })
        }, 1000)

        socket.once("error", (data) => {
            resolve({ "success": false, message: data.err_message })
        })

        socket.once(idealResponse, (data: any) => {
            resolve({ "success": true, data: data })
        })
    })
}

function reconnect(): Promise<boolean> {
    return new Promise((resolve) => {
        const data: Parameters<ClientToServerEvents["reconnect"]>[0] = {
            token: sessionStorage.getItem("token")!,
        }

        socket.emit("reconnect", data)

        const timeout = setTimeout(() => {
            resolve(false)
        }, 3000)

        socket.once("reconnect_error", () => {
            resolve(false)
            sessionStorage.removeItem("token")
        })

        socket.once("reconnect_success", () => {
            resolve(true)
        })
    })
}

async function addBot() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["add_bot"]>[0] = {
        token: token,
    }
    socket.emit("add_bot", data)

    const response = await waitForSocketEvent("room_status")

    if (!response.success) {
        showInputError("lobby-error", response.message!)
        return
    }
}

async function startGame() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["start_game"]>[0] = {
        token: token,
    }
    socket.emit("start_game", data)

    const response = await waitForSocketEvent("room_status")

    if (!response.success) {
        showInputError("lobby-error", response.message!)
        return
    }

    window.location.href = "/game"
}

function resetRoom() {
    const token = sessionStorage.getItem("token")
    if (!token) {
        return false
    }

    const data: Parameters<ClientToServerEvents["draw_card"]>[0] = {
        token: token,
    }
    socket.emit("reset_room", data)
}


document.getElementById("leave-btn")?.addEventListener("click", () => {
    // when leave button pressed
    window.location.href = "/"
})

document.getElementById("add-bot-btn")?.addEventListener("click", () => {
    // when add bot button pressed
    clearErrors()
    addBot()
})

document.getElementById("start-game-btn")?.addEventListener("click", () => {
    // when start game button pressed
    clearErrors()
    startGame()
})

document.getElementById("back_to_lobby_btn")?.addEventListener("click", () => {
    // when back to lobby button pressed
    resetRoom()
})

socket.on("room_status", (data) => {
    console.log("room status")
    if (data.game_state === "waiting") {
        // room status recieved
        const code = data.room_code
        document.getElementsByClassName("code")[0]!.innerHTML = `${code}`

        // update player list
        const table = document.getElementsByClassName("player-list")[0]!
        table.innerHTML = ''

        for (const p of data.public_players) {
            const row = document.createElement("tr")
            const playerEl = document.createElement("td")
            playerEl.className = "player"
            if (p.type === "bot") {
                playerEl.innerHTML = `${p.name} (Bot)`
            } else {
                playerEl.innerHTML = p.name
            }

            row.appendChild(playerEl)
            table.appendChild(row)
        }
    }
})

socket.on("game_status", (data) => {
    if ((data.gameState === "playing" || data.gameState === "finished")
        && window.location.pathname !== "/game/" && sessionStorage.getItem("in_game") === "false") {
        window.location.href = "/game"
        return
    } else {
        window.location.href = "/"
    }
})

socket.on("error", (data) => {
    console.log(`Error: ${data.err_message}`)
})

socket.on("auth", (data) => {
    sessionStorage.setItem("token", data.user.token)
    sessionStorage.setItem("name", data.user.name)
    sessionStorage.setItem("id", data.user.id)
})