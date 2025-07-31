import { Triangle } from "./Triangle";
import { Point2D } from "./Point2D"

export class GNode {

    constructor(
        id: number,
        position: Point2D,
        isFixed: boolean = false,
    ) {
        this.id = id;
        this.position = position;
        this.originalPosition = position;
        this.isFixed = isFixed;

    }

    addTriangle(triangle: Triangle): void {
        this.triangles_.push(triangle);
    }

    get triangles(): Triangle[] {
        return this.triangles_;
    }

    // TODO: precompute the striffness K and k^{-1}
    stiffness(): number[][] {
        const stiff = [[0, 0], [0, 0]];

        this.triangles.forEach(triangle => {
            const elementK = triangle.stiffness();
            // Extract nodal contribution (2x2 submatrix)
            const startIdx = this.id * 2;
            stiff[0][0] += elementK[startIdx][startIdx];
            stiff[0][1] += elementK[startIdx][startIdx + 1];
            stiff[1][0] += elementK[startIdx + 1][startIdx];
            stiff[1][1] += elementK[startIdx + 1][startIdx + 1];
        })

        return stiff;
    }

    nodalForce(): Point2D {
        let totalForce = { x: this.force.x, y: this.force.y };

        this.triangles.forEach(triangle => {
            const elementForces = triangle.nodalForces()
            const nodeForce = elementForces.get(this.id) as Point2D // since we are sure it is defined
            totalForce.x += nodeForce.x
            totalForce.y += nodeForce.y
        })

        return totalForce
    }

    nodalDisplacement(): Point2D | undefined {
        if (this.isFixed) {
            return undefined
        }

        // Compute total force on node from connected elements
        const totalForce = this.nodalForce()

        // Get nodal stiffness matrix
        const K = this.stiffness()

        // Solve for displacement increment: K * Δu = F
        const det = K[0][0] * K[1][1] - K[0][1] * K[1][0];

        if (Math.abs(det) > 1e-12) {
            const invK = [
                [K[1][1] / det, -K[0][1] / det],
                [-K[1][0] / det, K[0][0] / det]
            ];

            return {
                x: invK[0][0] * totalForce.x + invK[0][1] * totalForce.y,
                y: invK[1][0] * totalForce.x + invK[1][1] * totalForce.y
            }
        }
        else {
            return undefined
        }
    }

    // --------------------------------------------------

    id: number = -1;
    position: Point2D = { x: 0, y: 0 };
    originalPosition: Point2D = { x: 0, y: 0 }; // Store original position for reset
    force: Point2D = { x: 0, y: 0 };
    displacement: Point2D = { x: 0, y: 0 };
    isFixed: boolean = false;
    fixedX: boolean = false;
    fixedY: boolean = false;
    mass: number = 0;
    private triangles_: Triangle[] = []; // List of triangles this node belongs to
}
