import { Material } from "./Material";
import { GNode } from "./GNode";
import { Point2D } from "./Point2D";
export declare class Triangle {
    constructor(id: number, n1: GNode, n2: GNode, n3: GNode, material: Material);
    initialize(): void;
    get stiffness(): number[][];
    nodeIds(): number[];
    node(id: number): GNode;
    nodalForces(): Map<number, Point2D>;
    /**
     * Get the strain in the form [εxx, εyy, γxy]
     */
    get strain(): number[];
    /**
     * Get the stress in the form [σxx, σyy, τxy]
     */
    get stress(): number[];
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
    material: Material;
    area: number;
    shapeFunctionDerivatives: number[][];
    B: number[][];
    K: number[][];
}
//# sourceMappingURL=Triangle.d.ts.map