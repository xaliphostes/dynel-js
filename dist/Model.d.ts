import { Material } from "./Material";
import { Node } from "./Node";
import { Triangle } from "./Triangle";
import { Point2D } from "./Point2D";
export declare class Model {
    addNode(id: number, x: number, y: number, isFixed?: boolean): void;
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: Material): void;
    setFixedNode(nodeId: number, fixedX?: boolean, fixedY?: boolean): void;
    applyForce(nodeId: number, fx: number, fy: number): void;
    getNodes(): Node[];
    getNode(id: number): Node | undefined;
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
    computeNodalForces(triangle: Triangle): Map<number, Point2D>;
    computeNodalStiffness(nodeId: number): number[][];
    private calculateTriangleArea;
    private computeStrain;
    private getShapeFunctionDerivatives;
    private computeStress;
    private computeElementStiffness;
    private detectContacts;
    private applyContactForces;
    private nodes;
    private triangles;
    private contacts;
}
//# sourceMappingURL=Model.d.ts.map