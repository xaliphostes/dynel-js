import { Material } from "./Material";
import { GNode } from "./GNode"
import { Triangle } from "./Triangle"
import { Contact } from "./Contact"

export class Model {
    private beginC_ = false
    private isNode_ = false
    private isTriangle_ = false

    beginConstruction() {
        if (this.beginC_) {
            throw "Already in construction mode"
        }
        this.beginC_ = true
        this.isNode_ = false
        this.isTriangle_ = false
    }

    beginNodes() {
        if (!this.beginC_) throw "You must call beginConstruction first"
        this.isNode_ = true
    }

    // Add node to the mesh
    addNode(id: number, x: number, y: number, isFixed: boolean = false): void {
        if (!this.beginC_) {
            throw "You must call beginConstruction before adding nodes"
        }
        if (!this.isNode_) {
            throw "you must call beginNodes first"
        }
        this.nodes.set(id, new GNode(id, { x, y }, isFixed));
    }

    endNodes() {
        if (!this.isNode_) throw "You must call beginNode first and add the nodes"
        this.isNode_ = false
    }

    beginTriangles() {
        if (this.isNode_) throw "You must call endNodes"
        this.isTriangle_ = true
    }

    // Add triangle element
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: Material): void {
        if (!this.isTriangle_) {
            throw "You must call beginTraingles before adding triangles"
        }
        const n0 = this.nodes.get(nodeIds[0])
        const n1 = this.nodes.get(nodeIds[1])
        const n2 = this.nodes.get(nodeIds[2])

        if (!n0 || !n1 || !n2) {
            throw new Error(`Nodes with IDs ${nodeIds.join(", ")} not found`);
        }

        this.triangles.set(id, new Triangle(id, n0, n1, n2, materialProps));
    }

    endTriangles() {
        if (!this.isTriangle_) throw "You must call beginTriangles first and add the triangles"
        this.isTriangle_ = false
    }

    endConstruction() {
        if (!this.beginC_) {
            throw "You must begin a construction before calling endConstruction"
        }
        if (this.isTriangle_) {
            throw "You must call endTriangles"
        }
        this.beginC_ = false
        this.isNode_ = false
        this.isTriangle_ = false

        // Init triangles and nodes if necessary
        this.triangles.forEach(triangle => triangle.initialize())
        this.nodes.forEach(node => node.initialize())
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

    getNodes(): GNode[] {
        return Array.from(this.nodes.values());
    }

    getNode(id: number): GNode | undefined {
        return this.nodes.get(id)
    }

    getTriangles(): Triangle[] {
        return Array.from(this.triangles.values());
    }

    getTriangle(id: number): Triangle | undefined {
        return this.triangles.get(id)
    }

    // Calculate maximum Coulomb shear stress for fracture prediction
    // TODO: to me moved somewhere else in a near future
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
    // TODO: to me moved somewhere else in a near future
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
                nodes: [...triangle.nodes.map((n: GNode) => n.id)],
                stress: [...triangle.stress],
                strain: [...triangle.strain]
            }))
        };
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

    private nodes: Map<number, GNode> = new Map();
    private triangles: Map<number, Triangle> = new Map();
    private contacts: Contact[] = [];
}