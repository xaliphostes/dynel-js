// Geomechanically Based Restoration using Finite Element Method
// Based on Maerten & Maerten (2006) - Chronologic modeling of faulted and fractured reservoirs

export interface Point2D {
    x: number;
    y: number;
}

export interface Node {
    id: number;
    position: Point2D;
    originalPosition: Point2D; // Store original position for reset
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
    youngModulus: number;  // E (GPa)
    poissonRatio: number;  // ν
    density: number;       // ρ (kg/m³)
}

export interface Contact {
    slaveNodeId: number;
    masterSegment: [number, number];
    normal: Point2D;
    distance: number;
}

export class GeomechanicalRestoration {
    private nodes: Map<number, Node> = new Map();
    private triangles: Map<number, Triangle> = new Map();
    private contacts: Contact[] = [];
    private convergenceThreshold: number = 1e-6;
    private maxIterations: number = 10000;
    private damping: number = 0.8;

    private isRunning = false;
    private isPaused = false;
    private currentIteration = 0;
    private currentError = Infinity;

    constructor(convergenceThreshold: number = 1e-6, maxIterations: number = 10000) {
        this.convergenceThreshold = convergenceThreshold;
        this.maxIterations = maxIterations;
    }

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
    addTriangle(id: number, nodeIds: [number, number, number], materialProps: MaterialProperties): void {
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

    // Calculate triangle area
    private calculateTriangleArea(nodeIds: [number, number, number]): number {
        const [n1, n2, n3] = nodeIds.map(id => this.nodes.get(id)!.position);
        return 0.5 * Math.abs((n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y));
    }

    // Compute strain from displacement field
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

    // Get shape function derivatives
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

    // Compute stress from strain using Hooke's law
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

    // Compute element stiffness matrix
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

    // Compute nodal forces from element stress
    private computeNodalForces(triangle: Triangle): Map<number, Point2D> {
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

    // Detect and handle contact between fault surfaces
    private detectContacts(): void {
        this.contacts = [];
        // Implementation for contact detection would go here
        // This is a simplified version - in practice, you'd need sophisticated
        // contact detection algorithms for fault surfaces
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

    // Compute nodal stiffness matrix (sum of connected element contributions)
    private computeNodalStiffness(nodeId: number): number[][] {
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

    /**
     * Restore the geological structure by flattening the top surface to a specified Y level.
     * This method applies constraints to the specified target nodes, 
     * constraining their vertical position to the target Y level.
     * It allows horizontal sliding of the nodes while keeping them fixed vertically.
     */
    restoreGeology(targetNodes: number[], targetY: number): void {
        console.log('Starting geological restoration...');

        // Apply restoration constraints
        for (const nodeId of targetNodes) {
            const node = this.nodes.get(nodeId);
            if (node) {
                // Constrain vertical movement to target level
                node.position.y = targetY;
                node.fixedY = true;
                // Allow horizontal sliding
                node.fixedX = false;
            }
        }

        // Solve the system
        this.startSolver();
        console.log('Geological restoration completed');
    }

    // Get results
    getNodes(): Node[] {
        return Array.from(this.nodes.values());
    }

    getTriangles(): Triangle[] {
        return Array.from(this.triangles.values());
    }

    // ------------------------------

    // Main solution loop
    /*
    solve(): { converged: boolean; iterations: number; error: number } {
        let iteration = 0;
        let error = Infinity;

        // Reset displacements
        for (const node of this.nodes.values()) {
            node.displacement = { x: 0, y: 0 };
        }

        console.log('Starting Gauss-Seidel solver...');

        while (iteration < this.maxIterations && error > this.convergenceThreshold) {
            // Detect contacts
            this.detectContacts();

            // Apply contact forces
            this.applyContactForces();

            // Perform Gauss-Seidel iteration
            error = this.gaussSeidelIteration();

            iteration++;

            if (iteration % 100 === 0) {
                console.log(`Iteration ${iteration}, Error: ${error.toExponential(3)}`);
            }
        }

        const converged = error <= this.convergenceThreshold;
        console.log(`Solver ${converged ? 'converged' : 'did not converge'} after ${iteration} iterations`);
        console.log(`Final error: ${error.toExponential(3)}`);

        return { converged, iterations: iteration, error };
    }
    */

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
     * @example
     * ```typescript
     * const solver = new GeomechanicalRestoration();
     * solver.solve(() => {
     *     // Update mesh visualization here
     * }, (result) => {
     *     // Update status display here
     *     console.log(`Iteration: ${result.iterations}, Error: ${result.error.toExponential(3)}`);
     * });
     * ```
     */
    async solve(updateCallback: () => void, updateStatus: (result: any) => void, animationSpeed: number = 1.0): Promise<void> {
        if (this.isRunning) return;
        
        this.isRunning = true;
        // document.getElementById('solverStatus').textContent = 'Running';
        // document.getElementById('solveBtn').classList.add('running');
        // const animationSpeed = parseFloat(document.getElementById('animationSpeed').value);

        const frameDelay = 16 / animationSpeed; // Base 60fps adjusted by speed
        
        while (this.isRunning) {
            const result = await this.solveStep();
            
            updateCallback();
            updateStatus(result);
            
            if (result && result.converged) {
                // document.getElementById('solverStatus').textContent = 'Converged';
                console.log(`Solver converged after ${result.iterations} iterations with error ${result.error.toExponential(3)}`);
                break;
            }
            
            if (result && result.iterations >= this.maxIterations) {
                // document.getElementById('solverStatus').textContent = 'Max iterations reached';
                console.log(`Solver stopped at max iterations (${result.iterations}) with error ${result.error.toExponential(3)}`);
                break;
            }
            
            // Yield control to browser for animation
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        this.isRunning = false;
        // document.getElementById('solveBtn').classList.remove('running');
        // if (document.getElementById('solverStatus').textContent === 'Running') {
        //     document.getElementById('solverStatus').textContent = 'Ready';
        // }
    }

    // -------------------

    /**
     * Start the solver for geomechanical restoration.
     * This method initializes the solver state, resets node displacements,
     * and prepares the nodes for the iterative solution process.
     * It sets the running and paused states, and resets the iteration and error counters.
     * It also clears any previous displacements to ensure a fresh start.
     * This method should be called before starting the iterative solution process.
     * @example
     * ```typescript
     * solver.startSolver();
     * ```
     */
    startSolver() {
        this.isRunning = true;
        this.isPaused = false;
        this.currentIteration = 0;
        this.currentError = Infinity;

        for (const node of this.nodes.values()) {
            node.displacement = { x: 0, y: 0 };
        }
    }

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
     * @example
     * ```typescript
     * const result = await solver.solveStep();
     * if (result) {
     *     console.log(`Iteration: ${result.iterations}, Error: ${result.error.toExponential(3)}`);
     *     if (result.converged) {
     *         console.log('Solver has converged');
     *     }
     * } else {
     *     console.log('Solver is paused');
     * }
     * ```
     */
    async solveStep() {
        if (!this.isRunning || this.isPaused) return null;

        const error = this.gaussSeidelIteration();
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
     * This method toggles the paused state of the solver.
     * If the solver is running, it will pause; if it is paused, it will resume.
     * This allows for control over the solver's execution, enabling users to pause
     * the iterative process for inspection or other operations.
     * It does not reset the solver state, so it can be resumed from the current position.
     * This method is useful for interactive applications where users may want to pause
     * the solver to inspect results or make adjustments without losing progress.
     * @example
     * ```typescript
     * solver.pauseSolver();
     * // To resume, call the same method again
     * solver.pauseSolver();
     * ```
     * @example
     * ```typescript
     * // Toggle pause state
     * if (solver.isPaused) {
     *     solver.pauseSolver(); // Resume
     * } else {
     *     solver.pauseSolver(); // Pause
     * }
     * ```
     */
    pauseSolver() {
        this.isPaused = !this.isPaused;
    }

    /**
     * Reset the solver to its initial state.
     * This method clears all node displacements, forces, and resets the iteration count and error.
     * It restores each node to its original position and clears any accumulated forces.
     * This is useful for starting a new solution from scratch without needing to recreate the mesh.
     * It can be called after a solution has been completed or if the user wants to start over.
     * It does not affect the mesh structure (nodes and triangles), only the solver state.
     * After calling this method, the solver is ready to be started again with a fresh state.
     */
    resetSolver() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentIteration = 0;
        this.currentError = Infinity;

        for (const node of this.nodes.values()) {
            node.position.x = node.originalPosition.x;
            node.position.y = node.originalPosition.y;
            node.displacement = { x: 0, y: 0 };
            node.force = { x: 0, y: 0 };
        }
    }

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
    private gaussSeidelIteration(): number {
        let maxDisplacement = 0;

        // Process each node
        for (const node of this.nodes.values()) {
            if (node.isFixed) continue;

            // Compute total force on node from connected elements
            let totalForce = { x: node.force.x, y: node.force.y };

            for (const triangle of this.triangles.values()) {
                if (triangle.nodeIds.includes(node.id)) {
                    const elementForces = this.computeNodalForces(triangle);
                    const nodeForce = elementForces.get(node.id);
                    if (nodeForce) {
                        totalForce.x += nodeForce.x;
                        totalForce.y += nodeForce.y;
                    }
                }
            }

            // Get nodal stiffness matrix
            const K = this.computeNodalStiffness(node.id);

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

    // ------------------------------

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
}
