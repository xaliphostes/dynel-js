import { Material } from "./Material";

export interface Triangle {
    id: number;
    nodeIds: [number, number, number];
    materialProps: Material;
    area: number;
    strain: number[];
    stress: number[];
}