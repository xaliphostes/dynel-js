export interface Point2D {
    x: number;
    y: number;
}
export interface Node {
    id: number;
    position: Point2D;
    originalPosition: Point2D;
    force: Point2D;
    displacement: Point2D;
    isFixed: boolean;
    fixedX: boolean;
    fixedY: boolean;
    mass: number;
}
export interface Triangle {
    id: number;
    nodeIds: [number, number, number];
    materialProps: MaterialProperties;
    area: number;
    strain: number[];
    stress: number[];
}
export interface MaterialProperties {
    youngModulus: number;
    poissonRatio: number;
    density: number;
}
export interface Contact {
    slaveNodeId: number;
    masterSegment: [number, number];
    normal: Point2D;
    distance: number;
}
export declare class GeomechanicalRestoration {
    private nodes;
    private triangles;
    private contacts;
    private convergenceThreshold;
    private maxIterations;
    private damping;
    private isRunning;
    private isPaused;
    private currentIteration;
    private currentError;
    constructor(convergenceThreshold?: number, maxIterations?: number);
    addNode(id: number, x: number, y: number, isFixed?: boolean): void;
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: MaterialProperties): void;
    setFixedNode(nodeId: number, fixedX?: boolean, fixedY?: boolean): void;
    applyForce(nodeId: number, fx: number, fy: number): void;
    private calculateTriangleArea;
    private computeStrain;
    private getShapeFunctionDerivatives;
    private computeStress;
    private computeElementStiffness;
    private computeNodalForces;
    private detectContacts;
    private applyContactForces;
    private computeNodalStiffness;
    restoreGeology(targetNodes: number[], targetY: number): void;
    getNodes(): Node[];
    getTriangles(): Triangle[];
    /**
     * Solve the geomechanical restoration problem with animation speed control.
     * This method runs the solver in a loop, updating the mesh and status at each step.
     * It allows for real-time updates to the mesh and status, suitable for visualization.
     * It uses a frame delay based on the specified animation speed to control the update rate.
     * The method will run until the solver converges or reaches the maximum number of iterations.
     * It also provides a callback for updating the mesh and another for updating the status.
     * If the solver is already running, it will not start a new instance.
     * @param animationSpeed min="0.1", max="5.0", value="1.0", step="0.1"
     * @param updateCallback
     * @param updateStatus
     */
    solve(updateCallback: () => void, updateStatus: (result: any) => void, animationSpeed?: number): Promise<void>;
    /**
     * Perform a single step of the Gauss-Seidel solver.
     * This method is called repeatedly to update the mesh and status.
     * It performs one iteration of the Gauss-Seidel method, updating node positions
     * based on the forces acting on them.
     * It checks for convergence and updates the current iteration count and error.
     * @returns An object containing convergence status, number of iterations, current error,
     *          whether the solver is still running, and the maximum displacement in this iteration.
     *          If the solver has converged or reached max iterations, it stops running.
     *          If the solver is paused, it returns null.
     */
    solveStep(): Promise<{
        converged: boolean;
        iterations: number;
        error: number;
        running: boolean;
        maxDisplacement: number;
    } | null>;
    /**
     * Perform one Gauss-Seidel iteration.
     * This method updates the positions of nodes based on the forces acting on them,
     * using the Gauss-Seidel method to solve the linear system of equations.
     * It calculates the total force on each node, applies the nodal stiffness matrix,
     * and updates the node positions accordingly.
     * @returns The maximum displacement of any node in this iteration.
     * This value is used to determine convergence of the solver.
     * If the maximum displacement is below the convergence threshold, the solver converges.
     * If the maximum displacement exceeds the threshold, the solver continues iterating.
     */
    private gaussSeidelIteration;
    /**
     * Start the solver for geomechanical restoration.
     * This method initializes the solver state, resets node displacements,
     * and prepares the nodes for the iterative solution process.
     * It sets the running and paused states, and resets the iteration and error counters.
     * It also clears any previous displacements to ensure a fresh start.
     * This method should be called before starting the iterative solution process.
     */
    startSolver(): void;
    /**
     * Pause or resume the solver.
     * This method toggles the paused state of the solver.
     * If the solver is running, it will pause; if it is paused, it will resume.
     * This allows for control over the solver's execution, enabling users to pause
     * the iterative process for inspection or other operations.
     * It does not reset the solver state, so it can be resumed from the current position.
     * This method is useful for interactive applications where users may want to pause
     * the solver to inspect results or make adjustments without losing progress.
     */
    pauseSolver(): void;
    /**
     * Reset the solver to its initial state.
     * This method clears all node displacements, forces, and resets the iteration count and error.
     * It restores each node to its original position and clears any accumulated forces.
     * This is useful for starting a new solution from scratch without needing to recreate the mesh.
     * It can be called after a solution has been completed or if the user wants to start over.
     * It does not affect the mesh structure (nodes and triangles), only the solver state.
     * After calling this method, the solver is ready to be started again with a fresh state.
     */
    resetSolver(): void;
    calculateMCSS(frictionAngle: number): Map<number, number>;
    exportResults(): {
        nodes: {
            id: number;
            x: number;
            y: number;
            fx: number;
            fy: number;
        }[];
        triangles: {
            id: number;
            nodes: number[];
            stress: number[];
            strain: number[];
        }[];
    };
}
//# sourceMappingURL=index.d.ts.map