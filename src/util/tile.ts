export class Tile {
    id: number;
    
    constructor(id: number) {
        this.id = id;
    }
}

export class Container {
    split: "Horizontal" | "Vertical"
    // offset from center
    constraint?: number;

    constructor(split: "Horizontal" | "Vertical") {
        this.split = split;
    }
}