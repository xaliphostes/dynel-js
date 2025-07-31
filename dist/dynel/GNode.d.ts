import { Triangle } from "./Triangle";
import { Point2D } from "./Point2D";
export declare class GNode {
    constructor(id: number, position: Point2D, isFixed?: boolean);
    addTriangle(triangle: Triangle): void;
    get triangles(): Triangle[];
    stiffness(): number[][];
    nodalForce(): Point2D;
    nodalDisplacement(): Point2D | undefined;
    id: number;
    position: Point2D;
    originalPosition: Point2D;
    force: Point2D;
    displacement: Point2D;
    isFixed: boolean;
    fixedX: boolean;
    fixedY: boolean;
    mass: number;
    private triangles_;
}
//# sourceMappingURL=GNode.d.ts.map