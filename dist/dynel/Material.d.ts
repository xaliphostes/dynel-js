export declare class Material {
    constructor(y: number, p: number, d: number);
    get youngModulus(): number;
    set youngModulus(v: number);
    get poissonRatio(): number;
    set poissonRatio(v: number);
    get density(): number;
    set density(v: number);
    get D(): number[][];
    private initialize;
    private youngModulus_;
    private poissonRatio_;
    private density_;
    private D_;
}
//# sourceMappingURL=Material.d.ts.map