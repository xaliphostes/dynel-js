import { Model } from "./Model";

export interface SolverResult {
    converged: boolean;
    iterations: number;
    error: number;
    running: boolean;
    maxDisplacement: number;
}

export class GaussSeidel {
    constructor(
        convergenceThreshold: number = 1e-6,
        maxIterations: number = 10000,
        damping: number = 0.8
    ) {
        this.convergenceThreshold = convergenceThreshold;
        this.maxIterations = maxIterations;
        this.damping = damping;
    }

    // Getters for solver state
    get running(): boolean { return this.isRunning; }
    get paused(): boolean { return this.isPaused; }
    get iterations(): number { return this.currentIteration; }
    get error(): number { return this.currentError; }

    // Setters for solver parameters
    setConvergenceThreshold(threshold: number): void {
        this.convergenceThreshold = threshold;
    }

    setMaxIterations(maxIter: number): void {
        this.maxIterations = maxIter;
    }

    setDamping(damping: number): void {
        this.damping = damping;
    }

    /**
     * Start the solver for geomechanical restoration.
     * This method initializes the solver state, resets node displacements,
     * and prepares the nodes for the iterative solution process.
     */
    start(model: Model): void {
        this.isRunning = true;
        this.isPaused = false;
        this.currentIteration = 0;
        this.currentError = Infinity;

        for (const node of model.getNodes()) {
            node.displacement = { x: 0, y: 0 };
        }
    }

    /**
     * Perform a single step of the Gauss-Seidel solver.
     * This method is called repeatedly to update the mesh and status.
     * It performs one iteration of the Gauss-Seidel method, updating node positions
     * based on the forces acting on them.
     */
    async step(model: Model): Promise<SolverResult | null> {
        if (!this.isRunning || this.isPaused) return null;

        const error = this.gaussSeidelIteration(model);
        this.currentIteration++;
        this.currentError = error;

        const converged = error <= this.convergenceThreshold;
        const maxReached = this.currentIteration >= this.maxIterations;

        if (converged || maxReached) {
            this.isRunning = false;
        }

        return {
            converged,
            iterations: this.currentIteration,
            error,
            running: this.isRunning,
            maxDisplacement: error
        };
    }

    /**
     * Pause or resume the solver.
     */
    pause(): void {
        this.isPaused = !this.isPaused;
    }

    /**
     * Reset the solver to its initial state.
     */
    reset(model: Model): void {
        this.isRunning = false;
        this.isPaused = false;
        this.currentIteration = 0;
        this.currentError = Infinity;

        for (const node of model.getNodes()) {
            node.position.x = node.originalPosition.x;
            node.position.y = node.originalPosition.y;
            node.displacement = { x: 0, y: 0 };
            node.force = { x: 0, y: 0 };
        }
    }

    /**
     * Solve the geomechanical restoration problem with animation speed control.
     */
    async solve(
        model: Model,
        updateCallback: () => void,
        updateStatus: (result: SolverResult) => void,
        animationSpeed: number = 1.0
    ): Promise<void> {
        if (this.isRunning) return;

        this.start(model);
        const frameDelay = 16 / animationSpeed; // Base 60fps adjusted by speed

        while (this.isRunning) {
            const result = await this.step(model);

            if (result) {
                updateCallback();
                updateStatus(result);

                if (result.converged) {
                    console.log(`Solver converged after ${result.iterations} iterations with error ${result.error.toExponential(3)}`);
                    break;
                }

                if (result.iterations >= this.maxIterations) {
                    console.log(`Solver stopped at max iterations (${result.iterations}) with error ${result.error.toExponential(3)}`);
                    break;
                }
            }

            // Yield control to browser for animation
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }

        this.isRunning = false;
    }

    /**
     * Perform one Gauss-Seidel iteration.
     * This method updates the positions of nodes based on the forces acting on them,
     * using the Gauss-Seidel method to solve the linear system of equations.
     */
    private gaussSeidelIteration(model: Model): number {
        let maxDisplacement = 0;

        // Process each node
        for (const node of model.getNodes()) {
            if (node.isFixed) continue;

            // Compute total force on node from connected elements
            let totalForce = { x: node.force.x, y: node.force.y };

            for (const triangle of model.getTriangles()) {
                if (triangle.nodeIds.includes(node.id)) {
                    const elementForces = model.computeNodalForces(triangle);
                    const nodeForce = elementForces.get(node.id);
                    if (nodeForce) {
                        totalForce.x += nodeForce.x;
                        totalForce.y += nodeForce.y;
                    }
                }
            }

            // Get nodal stiffness matrix
            const K = model.computeNodalStiffness(node.id);

            // Solve for displacement increment: K * Δu = F
            const det = K[0][0] * K[1][1] - K[0][1] * K[1][0];
            if (Math.abs(det) > 1e-12) {
                const invK = [
                    [K[1][1] / det, -K[0][1] / det],
                    [-K[1][0] / det, K[0][0] / det]
                ];

                const deltaU = {
                    x: invK[0][0] * totalForce.x + invK[0][1] * totalForce.y,
                    y: invK[1][0] * totalForce.x + invK[1][1] * totalForce.y
                };

                // Apply damping and boundary conditions
                if (!node.fixedX) {
                    node.position.x += this.damping * deltaU.x;
                    node.displacement.x += this.damping * deltaU.x;
                    maxDisplacement = Math.max(maxDisplacement, Math.abs(deltaU.x));
                }

                if (!node.fixedY) {
                    node.position.y += this.damping * deltaU.y;
                    node.displacement.y += this.damping * deltaU.y;
                    maxDisplacement = Math.max(maxDisplacement, Math.abs(deltaU.y));
                }
            }
        }

        return maxDisplacement;
    }

    private convergenceThreshold: number = 1e-6;
    private maxIterations: number = 10000;
    private damping: number = 0.8;

    private isRunning = false;
    private isPaused = false;
    private currentIteration = 0;
    private currentError = Infinity;
}