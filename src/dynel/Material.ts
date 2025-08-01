export class Material {
    constructor(y: number, p: number, d: number) {
        this.youngModulus_ = y
        this.poissonRatio_ = p
        this.density_ = d
        this.initialize()
    }

    get youngModulus() {
        return this.youngModulus_
    }

    set youngModulus(v: number) {
        this.youngModulus_ = v
        this.initialize()
    }

    get poissonRatio() {
        return this.poissonRatio_
    }

    set poissonRatio(v: number) {
        this.poissonRatio_ = v
        this.initialize()
    }

    get density() {
        return this.density_
    }

    set density(v: number) {
        this.density_ = v
    }

    get D() { return this.D_ }

    private initialize() {
        // Plane stress constitutive matrix
        const E = this.youngModulus_
        const nu = this.poissonRatio_
        const factor = E / (1 - nu * nu);
        this.D_ = [
            [factor, factor * nu, 0],
            [factor * nu, factor, 0],
            [0, 0, factor * (1 - nu) / 2]
        ];
    }

    private youngModulus_: number = 1;    // E (GPa)
    private poissonRatio_: number = 0.25; // ν
    private density_: number = 1;         // ρ (kg/m³)
    private D_: number[][] = []           // Plane stress constitutive matrix
}