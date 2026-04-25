import type { Card } from "../types/game.js";

export function showInputError(elementId: string, error: string): void {
    const e = (document.getElementById(elementId)! as HTMLParagraphElement)
    e.textContent = error
    e.style.display = "block"
}

export function clearErrors(): void {
    const errors = document.querySelectorAll<HTMLParagraphElement>(".error");

    errors.forEach((error) => {
        error.textContent = "";
        error.style.display = "none";
    });
}

export function getCardAsset(card: Card): string {
    let asset_name
    if (card.type === "number" || card.type == "action") {
        asset_name = `/assets/${card.colour}_${card.value}.svg`
    } else {
        asset_name = `/assets/${card.value}.svg`
    }
    return asset_name
}