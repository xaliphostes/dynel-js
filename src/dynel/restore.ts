import { GaussSeidel } from "./GaussSeidel";
import { Model } from "./Model";

/**
 * Restore the geological structure by flattening the top surface to a specified Y level.
 */
export function restore(model: Model, solver: GaussSeidel, targetNodes: number[], targetY: number): void {
    console.log('Starting geological restoration...');

    // Apply restoration constraints
    for (const nodeId of targetNodes) {
        const node = model.getNode(nodeId);
        if (node) {
            // Constrain vertical movement to target level
            node.position.y = targetY;
            node.fixedY = true;
            // Allow horizontal sliding
            node.fixedX = false;
        }
    }

    // Solve the system
    solver.start(model);
    console.log('Geological restoration completed');
}