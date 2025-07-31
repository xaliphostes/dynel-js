import { Point2D } from "./Point2D"

export interface Contact {
    slaveNodeId: number;
    masterSegment: [number, number];
    normal: Point2D;
    distance: number;
}