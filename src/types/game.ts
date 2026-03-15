export type Colour = "red" | "blue" | "green" | "yellow"
export type NumberValue = 0|1|2|3|4|5|6|7|8|9
export type ActionValue = "draw2" | "skip" | "reverse"
export type WildValue = "wild" | "wild_draw4"

export interface NumberCard {
    type: "number"
    colour: Colour
    value: NumberValue
}

export interface ActionCard {
    type: "action"
    colour: Colour
    value: ActionValue
}

export interface WildCard {
    type: "wild"
    value: WildValue
}

export type Card = NumberCard | ActionCard | WildCard