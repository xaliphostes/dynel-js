import { Material } from "./Material";
import { GNode } from "./GNode";
import { Point2D } from "./Point2D";
export declare class Triangle {
    constructor(id: number, n1: GNode, n2: GNode, n3: GNode, materialProps: Material);
    nodeIds(): number[];
    nodalForces(): Map<number, Point2D>;
    /**
     * Calculate the stiffness matrix for the triangle element.
     * This uses the material properties and shape function derivatives.
     */
    stiffness(): number[][];
    calculateArea(): number;
    computeStrain(): number[];
    computeStress(strain: number[]): number[];
    computeShapeFunctionDerivatives(): number[][];
    id: number;
    nodes: [GNode, GNode, GNode];
    materialProps: Material;
    area: number;
    strain: number[];
    stress: number[];
    shapeFunctionDerivatives: number[][];
}
//# sourceMappingURL=Triangle.d.ts.map