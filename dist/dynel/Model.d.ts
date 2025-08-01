import { Material } from "./Material";
import { GNode } from "./GNode";
import { Triangle } from "./Triangle";
/**
 * @example
 * Construction of a model
 * ```ts
 * const model = new dynel.Model()
 * const material = new dynel.Material(1, 0.25, 1)
 *
 * model.beginConstruction() {
 *     model.beginNodes() {
 *         model.addNode(0, 1.1, 1.2)
 *         ...
 *     }
 *     model.endNodes()
 *     model.beginTriangles() {
 *         model.addTriangles(0, [0,1,2], material)
 *         ...
 *     }
 *     model.endTriangles()
 * }
 * model.endConstruction()
 * ```
 */
export declare class Model {
    private beginC_;
    private isNode_;
    private isTriangle_;
    beginConstruction(): void;
    beginNodes(): void;
    addNode(id: number, x: number, y: number, isFixed?: boolean): void;
    endNodes(): void;
    beginTriangles(): void;
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: Material): void;
    endTriangles(): void;
    endConstruction(): void;
    setFixedNode(nodeId: number, fixedX?: boolean, fixedY?: boolean): void;
    applyForce(nodeId: number, fx: number, fy: number): void;
    getNodes(): GNode[];
    getNode(id: number): GNode | undefined;
    getTriangles(): Triangle[];
    getTriangle(id: number): Triangle | undefined;
    calculateMCSS(frictionAngle: number): Map<number, number>;
    exportResults(): {
        nodes: {
            id: number;
            x: number;
            y: number;
            fx: number;
            fy: number;
        }[];
        triangles: {
            id: number;
            nodes: number[];
            stress: number[];
            strain: number[];
        }[];
    };
    private detectContacts;
    private applyContactForces;
    private nodes;
    private triangles;
    private contacts;
}
//# sourceMappingURL=Model.d.ts.map