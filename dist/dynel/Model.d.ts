import { Material } from "./Material";
import { GNode } from "./GNode";
import { Triangle } from "./Triangle";
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