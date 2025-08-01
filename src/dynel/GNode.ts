import { Triangle } from "./Triangle";
import { isNull, Point2D } from "./Point2D"

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

    initialize() {
        this.K_ = this.computeStiffness()
        const K = this.K_

        const det = K[0][0] * K[1][1] - K[0][1] * K[1][0];

        if (Math.abs(det) > 1e-12) {
            this.iK_ = [
                [K[1][1] / det, -K[0][1] / det],
                [-K[1][0] / det, K[0][0] / det]
            ];
            this.isSingular = false
        }
        else {
            this.isSingular = true
        }
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
        if (this.isFixed || this.isSingular) {
            return undefined
        }

        // Compute total force on node from connected elements
        const totalForce = this.nodalForce()
        if (isNull(totalForce)) {
            return undefined
        }

        return {
            x: this.iK_[0][0] * totalForce.x + this.iK_[0][1] * totalForce.y,
            y: this.iK_[1][0] * totalForce.x + this.iK_[1][1] * totalForce.y
        }
    }

    // --------------------------------------------------

    private extractIdFromTriangle(triangle: Triangle): number {
        if (triangle.node(0) === this) return 0
        if (triangle.node(1) === this) return 1
        return 2
    }

    // TODO: precompute the striffness K and k^{-1}
    private computeStiffness(): number[][] {
        const stiff = [[0, 0], [0, 0]];

        this.triangles.forEach(triangle => {
            const elementK = triangle.stiffness;
            // Extract nodal contribution (2x2 submatrix)
            const startIdx = this.extractIdFromTriangle(triangle) * 2;
            stiff[0][0] += elementK[startIdx][startIdx];
            stiff[0][1] += elementK[startIdx][startIdx + 1];
            stiff[1][0] += elementK[startIdx + 1][startIdx];
            stiff[1][1] += elementK[startIdx + 1][startIdx + 1];
        })

        return stiff;
    }

    id: number = -1;
    position: Point2D = { x: 0, y: 0 };
    originalPosition: Point2D = { x: 0, y: 0 }; // Store original position for reset
    force: Point2D = { x: 0, y: 0 };
    displacement: Point2D = { x: 0, y: 0 };
    isFixed: boolean = false;
    fixedX: boolean = false;
    fixedY: boolean = false;
    mass: number = 1;
    private triangles_: Triangle[] = []; // List of triangles this node belongs to
    private K_: number[][] = []
    private iK_: number[][] = []
    private isSingular = false
}
