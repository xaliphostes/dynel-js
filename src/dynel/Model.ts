import { Material } from "./Material";
import { Node } from "./Node"
import { Triangle } from "./Triangle"
import { Point2D } from "./Point2D"
import { Contact } from "./Contact"

export class Model {
    // Add node to the mesh
    addNode(id: number, x: number, y: number, isFixed: boolean = false): void {
        this.nodes.set(id, {
            id,
            position: { x, y },
            originalPosition: { x, y },
            force: { x: 0, y: 0 },
            displacement: { x: 0, y: 0 },
            isFixed,
            fixedX: isFixed,
            fixedY: isFixed,
            mass: 1.0
        });
    }

    // Add triangle element
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: Material): void {
        const area = this.calculateTriangleArea(nodeIds);
        this.triangles.set(id, {
            id,
            nodeIds,
            materialProps,
            area,
            strain: [0, 0, 0], // εxx, εyy, γxy
            stress: [0, 0, 0]  // σxx, σyy, τxy
        });
    }

    // Set boundary conditions
    setFixedNode(nodeId: number, fixedX: boolean = true, fixedY: boolean = true): void {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.fixedX = fixedX;
            node.fixedY = fixedY;
            node.isFixed = fixedX || fixedY;
        }
    }

    // Apply force to node
    applyForce(nodeId: number, fx: number, fy: number): void {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.force.x += fx;
            node.force.y += fy;
        }
    }

    getNodes(): Node[] {
        return Array.from(this.nodes.values());
    }

    getNode(id: number): Node | undefined {
        return this.nodes.get(id)
    }

    getTriangles(): Triangle[] {
        return Array.from(this.triangles.values());
    }

    getTriangle(id: number): Triangle | undefined {
        return this.triangles.get(id)
    }

    // Calculate maximum Coulomb shear stress for fracture prediction
    calculateMCSS(frictionAngle: number): Map<number, number> {
        const mcssValues = new Map<number, number>();
        const tanPhi = Math.tan(frictionAngle * Math.PI / 180);

        for (const triangle of this.triangles.values()) {
            const [sigmaXX, sigmaYY, tauXY] = triangle.stress;

            // Principal stresses
            const sigmaAvg = (sigmaXX + sigmaYY) / 2;
            const radius = Math.sqrt(Math.pow((sigmaXX - sigmaYY) / 2, 2) + tauXY * tauXY);
            const sigmaMax = sigmaAvg + radius;
            const sigmaMin = sigmaAvg - radius;

            // Maximum Coulomb Shear Stress
            const mcss = (sigmaMax - sigmaMin) / 2 * Math.sqrt(1 + tanPhi * tanPhi)
                - tanPhi * (sigmaMax + sigmaMin) / 2;

            mcssValues.set(triangle.id, mcss);
        }

        return mcssValues;
    }

    // Export results for visualization
    exportResults(): {
        nodes: { id: number; x: number; y: number; fx: number; fy: number }[];
        triangles: { id: number; nodes: number[]; stress: number[]; strain: number[] }[];
    } {
        return {
            nodes: this.getNodes().map(node => ({
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                fx: node.force.x,
                fy: node.force.y
            })),
            triangles: this.getTriangles().map(triangle => ({
                id: triangle.id,
                nodes: [...triangle.nodeIds],
                stress: [...triangle.stress],
                strain: [...triangle.strain]
            }))
        };
    }

    // Methods that need to be accessible by GaussSeidel solver
    computeNodalForces(triangle: Triangle): Map<number, Point2D> {
        const strain = this.computeStrain(triangle);
        const stress = this.computeStress(triangle, strain);
        triangle.strain = strain;
        triangle.stress = stress;

        const area = triangle.area;
        const thickness = 1.0;
        const dN = this.getShapeFunctionDerivatives(triangle);

        // Strain-displacement matrix B
        const B = [
            [dN[0][0], 0, dN[1][0], 0, dN[2][0], 0],
            [0, dN[0][1], 0, dN[1][1], 0, dN[2][1]],
            [dN[0][1], dN[0][0], dN[1][1], dN[1][0], dN[2][1], dN[2][0]]
        ];

        // Nodal forces = B^T * stress * area * thickness
        const forces = Array(6).fill(0);
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                forces[i] += B[j][i] * stress[j] * area * thickness;
            }
        }

        const nodalForces = new Map<number, Point2D>();
        const nodeIds = triangle.nodeIds;

        for (let i = 0; i < 3; i++) {
            nodalForces.set(nodeIds[i], {
                x: forces[2 * i],
                y: forces[2 * i + 1]
            });
        }

        return nodalForces;
    }

    computeNodalStiffness(nodeId: number): number[][] {
        const stiffness = [[0, 0], [0, 0]];

        for (const triangle of this.triangles.values()) {
            const nodeIndex = triangle.nodeIds.indexOf(nodeId);
            if (nodeIndex !== -1) {
                const elementK = this.computeElementStiffness(triangle);
                // Extract nodal contribution (2x2 submatrix)
                const startIdx = nodeIndex * 2;
                stiffness[0][0] += elementK[startIdx][startIdx];
                stiffness[0][1] += elementK[startIdx][startIdx + 1];
                stiffness[1][0] += elementK[startIdx + 1][startIdx];
                stiffness[1][1] += elementK[startIdx + 1][startIdx + 1];
            }
        }

        return stiffness;
    }

    // Private helper methods
    private calculateTriangleArea(nodeIds: [number, number, number]): number {
        const [n1, n2, n3] = nodeIds.map(id => this.nodes.get(id)!.position);
        return 0.5 * Math.abs((n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y));
    }

    private computeStrain(triangle: Triangle): number[] {
        const [id1, id2, id3] = triangle.nodeIds;
        const nodes = [
            this.nodes.get(id1)!,
            this.nodes.get(id2)!,
            this.nodes.get(id3)!
        ];

        // Shape function derivatives (constant strain triangle)
        const area = triangle.area;
        const dN = this.getShapeFunctionDerivatives(triangle);

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

    private getShapeFunctionDerivatives(triangle: Triangle): number[][] {
        const [id1, id2, id3] = triangle.nodeIds;
        const [p1, p2, p3] = [
            this.nodes.get(id1)!.position,
            this.nodes.get(id2)!.position,
            this.nodes.get(id3)!.position
        ];

        const area2 = 2 * triangle.area;

        return [
            [(p2.y - p3.y) / area2, (p3.x - p2.x) / area2],
            [(p3.y - p1.y) / area2, (p1.x - p3.x) / area2],
            [(p1.y - p2.y) / area2, (p2.x - p1.x) / area2]
        ];
    }

    private computeStress(triangle: Triangle, strain: number[]): number[] {
        const { youngModulus: E, poissonRatio: nu } = triangle.materialProps;

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

    private computeElementStiffness(triangle: Triangle): number[][] {
        const { youngModulus: E, poissonRatio: nu } = triangle.materialProps;
        const area = triangle.area;
        const dN = this.getShapeFunctionDerivatives(triangle);

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

    // Detect and handle contact between fault surfaces
    private detectContacts(): void {
        this.contacts = [];
        // Implementation for contact detection would go here
    }

    // Apply contact forces
    private applyContactForces(): void {
        for (const contact of this.contacts) {
            const slaveNode = this.nodes.get(contact.slaveNodeId);
            if (slaveNode && contact.distance < 0) {
                // Apply contact force to prevent penetration
                const contactForce = Math.abs(contact.distance) * 1e6; // Penalty method
                slaveNode.force.x += contactForce * contact.normal.x;
                slaveNode.force.y += contactForce * contact.normal.y;
            }
        }
    }

    private nodes: Map<number, Node> = new Map();
    private triangles: Map<number, Triangle> = new Map();
    private contacts: Contact[] = [];
}