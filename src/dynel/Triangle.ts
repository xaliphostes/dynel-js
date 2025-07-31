import { Material } from "./Material";
import { GNode } from "./GNode";
import { Point2D } from "./Point2D";

export class Triangle {
    constructor(id: number, n1: GNode, n2: GNode, n3: GNode, materialProps: Material) {
        this.id = id;
        this.nodes = [n1, n2, n3];
        this.materialProps = materialProps;
        this.area = this.calculateArea();
        this.strain = [0, 0, 0]; // εxx, εyy, γxy
        this.stress = [0, 0, 0]; // σxx, σyy, τxy
        this.shapeFunctionDerivatives = this.computeShapeFunctionDerivatives()
    }

    nodeIds() {
        return this.nodes.map(node => node!.id)
    }

    nodalForces(): Map<number, Point2D> {
        const strain = this.computeStrain()
        const stress = this.computeStress(strain)

        // triangle.strain = strain;
        // triangle.stress = stress;

        const area = this.area;
        const thickness = 1.0;
        const dN = this.shapeFunctionDerivatives // this.getShapeFunctionDerivatives(triangle);

        // Strain-displacement matrix B
        const B = [
            [dN[0][0], 0, dN[1][0], 0, dN[2][0], 0],
            [0, dN[0][1], 0, dN[1][1], 0, dN[2][1]],
            [dN[0][1], dN[0][0], dN[1][1], dN[1][0], dN[2][1], dN[2][0]]
        ];

        const forces = Array(6).fill(0);

        // Nodal forces = B^T * stress * area * thickness
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                forces[i] += B[j][i] * stress[j] * area * thickness;
            }
        }

        const nodalForces = new Map<number, Point2D>();
        this.nodes.map((node, i) => {
            nodalForces.set(node.id, {
                x: forces[2 * i],
                y: forces[2 * i + 1]
            });
        })

        // // Was...
        // for (let i = 0; i < 3; i++) {
        //     nodalForces.set(nodeIds[i], {
        //         x: forces[2 * i],
        //         y: forces[2 * i + 1]
        //     });
        // }

        return nodalForces;
    }

    /**
     * Calculate the stiffness matrix for the triangle element.
     * This uses the material properties and shape function derivatives.
     */
    stiffness(): number[][] {
        const { youngModulus: E, poissonRatio: nu } = this.materialProps;
        const area = this.area;
        const dN = this.shapeFunctionDerivatives

        // Constitutive matrix D (plane stress)
        const factor = E / (1 - nu * nu);
        const D = [
            [factor, factor * nu, 0],
            [factor * nu, factor, 0],
            [0, 0, factor * (1 - nu) / 2]
        ];

        // Strain-displacement matrix B
        const B = [
            [dN[0][0], 0, dN[1][0], 0, dN[2][0], 0],
            [0, dN[0][1], 0, dN[1][1], 0, dN[2][1]],
            [dN[0][1], dN[0][0], dN[1][1], dN[1][0], dN[2][1], dN[2][0]]
        ];

        // Element stiffness matrix K = ∫ B^T * D * B dV = B^T * D * B * area * thickness
        const thickness = 1.0; // Assuming unit thickness for 2D plane stress
        const K = Array(6).fill(0).map(() => Array(6).fill(0));

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                for (let k = 0; k < 3; k++) {
                    for (let l = 0; l < 3; l++) {
                        K[i][j] += B[k][i] * D[k][l] * B[l][j] * area * thickness;
                    }
                }
            }
        }

        return K;
    }

    calculateArea(): number {
        const [n1, n2, n3] = this.nodes.map(n => n!.position);
        return 0.5 * Math.abs((n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y));
    }

    computeStrain(): number[] {
        const [id1, id2, id3] = this.nodes.map(n => n!.id);
        const nodes = this.nodes


        // Shape function derivatives (constant strain triangle)
        const area = this.area;
        const dN = this.shapeFunctionDerivatives

        // Strain-displacement matrix B
        const B = [
            [dN[0][0], 0, dN[1][0], 0, dN[2][0], 0],
            [0, dN[0][1], 0, dN[1][1], 0, dN[2][1]],
            [dN[0][1], dN[0][0], dN[1][1], dN[1][0], dN[2][1], dN[2][0]]
        ];

        // Displacement vector
        const u = [
            nodes[0].displacement.x, nodes[0].displacement.y,
            nodes[1].displacement.x, nodes[1].displacement.y,
            nodes[2].displacement.x, nodes[2].displacement.y
        ];

        // Strain = B * u
        const strain = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 6; j++) {
                strain[i] += B[i][j] * u[j];
            }
        }

        return strain;
    }

    computeStress(strain: number[]): number[] {
        const { youngModulus: E, poissonRatio: nu } = this.materialProps;

        // Plane stress constitutive matrix
        const factor = E / (1 - nu * nu);
        const D = [
            [factor, factor * nu, 0],
            [factor * nu, factor, 0],
            [0, 0, factor * (1 - nu) / 2]
        ];

        // Stress = D * strain
        const stress = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                stress[i] += D[i][j] * strain[j];
            }
        }

        return stress;
    }

    computeShapeFunctionDerivatives(): number[][] {
        const [id1, id2, id3] = this.nodes.map(n => n!.id);
        const [p1, p2, p3] = [
            this.nodes[0]!.position,
            this.nodes[1]!.position,
            this.nodes[2]!.position
        ];

        const area2 = 2 * this.area;

        return [
            [(p2.y - p3.y) / area2, (p3.x - p2.x) / area2],
            [(p3.y - p1.y) / area2, (p1.x - p3.x) / area2],
            [(p1.y - p2.y) / area2, (p2.x - p1.x) / area2]
        ];
    }

    // ------------------------------------------------------------------

    id: number = -1;
    nodes: [GNode, GNode, GNode]
    materialProps: Material = {
        youngModulus: 1.0,
        poissonRatio: 0.3,
        density: 1.0,
    };
    area: number = 0;
    strain: number[] = [0, 0, 0];
    stress: number[] = [0, 0, 0];
    shapeFunctionDerivatives: number[][] = [[0, 0], [0, 0], [0, 0]];
}
