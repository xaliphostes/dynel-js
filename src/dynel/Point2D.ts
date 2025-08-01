export interface Point2D {
    x: number;
    y: number;
}

export function isNull(p: Point2D): boolean {
    return p.x === 0 && p.y === 0
}