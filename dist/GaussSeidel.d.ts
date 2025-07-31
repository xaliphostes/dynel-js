import { Model } from "./Model";
export interface SolverResult {
    converged: boolean;
    iterations: number;
    error: number;
    running: boolean;
    maxDisplacement: number;
}
export declare class GaussSeidel {
    constructor(convergenceThreshold?: number, maxIterations?: number, damping?: number);
    get running(): boolean;
    get paused(): boolean;
    get iterations(): number;
    get error(): number;
    setConvergenceThreshold(threshold: number): void;
    setMaxIterations(maxIter: number): void;
    setDamping(damping: number): void;
    /**
     * Start the solver for geomechanical restoration.
     * This method initializes the solver state, resets node displacements,
     * and prepares the nodes for the iterative solution process.
     */
    start(model: Model): void;
    /**
     * Perform a single step of the Gauss-Seidel solver.
     * This method is called repeatedly to update the mesh and status.
     * It performs one iteration of the Gauss-Seidel method, updating node positions
     * based on the forces acting on them.
     */
    step(model: Model): Promise<SolverResult | null>;
    /**
     * Pause or resume the solver.
     */
    pause(): void;
    /**
     * Reset the solver to its initial state.
     */
    reset(model: Model): void;
    /**
     * Solve the geomechanical restoration problem with animation speed control.
     */
    solve(model: Model, updateCallback: () => void, updateStatus: (result: SolverResult) => void, animationSpeed?: number): Promise<void>;
    /**
     * Perform one Gauss-Seidel iteration.
     * This method updates the positions of nodes based on the forces acting on them,
     * using the Gauss-Seidel method to solve the linear system of equations.
     */
    private gaussSeidelIteration;
    private convergenceThreshold;
    private maxIterations;
    private damping;
    private isRunning;
    private isPaused;
    private currentIteration;
    private currentError;
}
//# sourceMappingURL=GaussSeidel.d.ts.map