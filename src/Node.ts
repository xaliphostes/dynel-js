import { Point2D } from "./Point2D"

export interface Node {
    id: number;
    position: Point2D;
    originalPosition: Point2D; // Store original position for reset
    force: Point2D;
    displacement: Point2D;
    isFixed: boolean;
    fixedX: boolean;
    fixedY: boolean;
    mass: number;
}
