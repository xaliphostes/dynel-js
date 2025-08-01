import { Material } from "./Material";
import { GNode } from "./GNode";
import { Point2D } from "./Point2D";
export declare class Triangle {
    constructor(id: number, n1: GNode, n2: GNode, n3: GNode, materialProps: Material);
    initialize(): void;
    get stiffness(): number[][];
    nodeIds(): number[];
    nodalForces(): Map<number, Point2D>;
    /**
     * Calculate the stiffness matrix for the triangle element.
     * This uses the material properties and shape function derivatives.
     */
    private computeStiffness;
    private computeArea;
    private computeStrain;
    private computeStress;
    private computeShapeFunctionDerivatives;
    id: number;
    nodes: [GNode, GNode, GNode];
    materialProps: Material;
    area: number;
    strain: number[];
    stress: number[];
    shapeFunctionDerivatives: number[][];
    B: number[][];
    K: number[][];
}
//# sourceMappingURL=Triangle.d.ts.map