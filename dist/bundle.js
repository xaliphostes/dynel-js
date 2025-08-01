/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dynel"] = factory();
	else
		root["dynel"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/dynel/Contact.ts":
/*!******************************!*\
  !*** ./src/dynel/Contact.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/Contact.ts?\n}");

/***/ }),

/***/ "./src/dynel/GNode.ts":
/*!****************************!*\
  !*** ./src/dynel/GNode.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GNode: () => (/* binding */ GNode)\n/* harmony export */ });\n/* harmony import */ var _Point2D__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Point2D */ \"./src/dynel/Point2D.ts\");\n\r\nclass GNode {\r\n    constructor(id, position, isFixed = false) {\r\n        this.id = -1;\r\n        this.position = { x: 0, y: 0 };\r\n        this.originalPosition = { x: 0, y: 0 }; // Store original position for reset\r\n        this.force = { x: 0, y: 0 };\r\n        this.displacement = { x: 0, y: 0 };\r\n        this.isFixed = false;\r\n        this.fixedX = false;\r\n        this.fixedY = false;\r\n        this.mass = 1;\r\n        this.triangles_ = []; // List of triangles this node belongs to\r\n        this.K_ = [];\r\n        this.iK_ = [];\r\n        this.isSingular = false;\r\n        this.id = id;\r\n        this.position = position;\r\n        this.originalPosition = position;\r\n        this.isFixed = isFixed;\r\n    }\r\n    addTriangle(triangle) {\r\n        this.triangles_.push(triangle);\r\n    }\r\n    get triangles() {\r\n        return this.triangles_;\r\n    }\r\n    initialize() {\r\n        this.K_ = this.computeStiffness();\r\n        const K = this.K_;\r\n        const det = K[0][0] * K[1][1] - K[0][1] * K[1][0];\r\n        if (Math.abs(det) > 1e-12) {\r\n            this.iK_ = [\r\n                [K[1][1] / det, -K[0][1] / det],\r\n                [-K[1][0] / det, K[0][0] / det]\r\n            ];\r\n            this.isSingular = false;\r\n        }\r\n        else {\r\n            this.isSingular = true;\r\n        }\r\n    }\r\n    nodalForce() {\r\n        let totalForce = { x: this.force.x, y: this.force.y };\r\n        this.triangles.forEach(triangle => {\r\n            const elementForces = triangle.nodalForces();\r\n            const nodeForce = elementForces.get(this.id); // since we are sure it is defined\r\n            totalForce.x += nodeForce.x;\r\n            totalForce.y += nodeForce.y;\r\n        });\r\n        return totalForce;\r\n    }\r\n    nodalDisplacement() {\r\n        if (this.isFixed || this.isSingular) {\r\n            return undefined;\r\n        }\r\n        // Compute total force on node from connected elements\r\n        const totalForce = this.nodalForce();\r\n        if ((0,_Point2D__WEBPACK_IMPORTED_MODULE_0__.isNull)(totalForce)) {\r\n            return undefined;\r\n        }\r\n        return {\r\n            x: this.iK_[0][0] * totalForce.x + this.iK_[0][1] * totalForce.y,\r\n            y: this.iK_[1][0] * totalForce.x + this.iK_[1][1] * totalForce.y\r\n        };\r\n    }\r\n    // --------------------------------------------------\r\n    // TODO: precompute the striffness K and k^{-1}\r\n    computeStiffness() {\r\n        const stiff = [[0, 0], [0, 0]];\r\n        this.triangles.forEach(triangle => {\r\n            const elementK = triangle.stiffness;\r\n            // Extract nodal contribution (2x2 submatrix)\r\n            const startIdx = this.id * 2;\r\n            stiff[0][0] += elementK[startIdx][startIdx];\r\n            stiff[0][1] += elementK[startIdx][startIdx + 1];\r\n            stiff[1][0] += elementK[startIdx + 1][startIdx];\r\n            stiff[1][1] += elementK[startIdx + 1][startIdx + 1];\r\n        });\r\n        return stiff;\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/GNode.ts?\n}");

/***/ }),

/***/ "./src/dynel/GaussSeidel.ts":
/*!**********************************!*\
  !*** ./src/dynel/GaussSeidel.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GaussSeidel: () => (/* binding */ GaussSeidel)\n/* harmony export */ });\nclass GaussSeidel {\r\n    constructor(convergenceThreshold = 1e-6, maxIterations = 10000, damping = 0.8) {\r\n        this.convergenceThreshold = 1e-7;\r\n        this.maxIterations = 50000;\r\n        this.damping = 0.8;\r\n        this.isRunning = false;\r\n        this.isPaused = false;\r\n        this.currentIteration = 0;\r\n        this.currentError = Infinity;\r\n        this.convergenceThreshold = convergenceThreshold;\r\n        this.maxIterations = maxIterations;\r\n        this.damping = damping;\r\n    }\r\n    // Getters for solver state\r\n    get running() { return this.isRunning; }\r\n    get paused() { return this.isPaused; }\r\n    get iterations() { return this.currentIteration; }\r\n    get error() { return this.currentError; }\r\n    // Setters for solver parameters\r\n    setConvergenceThreshold(threshold) {\r\n        this.convergenceThreshold = threshold;\r\n    }\r\n    setMaxIterations(maxIter) {\r\n        this.maxIterations = maxIter;\r\n    }\r\n    setDamping(damping) {\r\n        this.damping = damping;\r\n    }\r\n    /**\r\n     * Start the solver for geomechanical restoration.\r\n     * This method initializes the solver state, resets node displacements,\r\n     * and prepares the nodes for the iterative solution process.\r\n     */\r\n    start(model) {\r\n        this.isRunning = true;\r\n        this.isPaused = false;\r\n        this.currentIteration = 0;\r\n        this.currentError = Infinity;\r\n        for (const node of model.getNodes()) {\r\n            node.displacement = { x: 0, y: 0 };\r\n        }\r\n    }\r\n    /**\r\n     * Perform a single step of the Gauss-Seidel solver.\r\n     * This method is called repeatedly to update the mesh and status.\r\n     * It performs one iteration of the Gauss-Seidel method, updating node positions\r\n     * based on the forces acting on them.\r\n     */\r\n    async step(model) {\r\n        if (!this.isRunning || this.isPaused)\r\n            return null;\r\n        const error = this.iteration(model);\r\n        this.currentIteration++;\r\n        this.currentError = error;\r\n        const converged = error <= this.convergenceThreshold;\r\n        const maxReached = this.currentIteration >= this.maxIterations;\r\n        if (converged || maxReached) {\r\n            this.isRunning = false;\r\n        }\r\n        return {\r\n            converged,\r\n            iterations: this.currentIteration,\r\n            error,\r\n            running: this.isRunning,\r\n            maxDisplacement: error\r\n        };\r\n    }\r\n    /**\r\n     * Pause or resume the solver.\r\n     */\r\n    pause() {\r\n        this.isPaused = !this.isPaused;\r\n    }\r\n    /**\r\n     * Reset the solver to its initial state.\r\n     */\r\n    reset(model) {\r\n        this.isRunning = false;\r\n        this.isPaused = false;\r\n        this.currentIteration = 0;\r\n        this.currentError = Infinity;\r\n        for (const node of model.getNodes()) {\r\n            node.position.x = node.originalPosition.x;\r\n            node.position.y = node.originalPosition.y;\r\n            node.displacement = { x: 0, y: 0 };\r\n            node.force = { x: 0, y: 0 };\r\n        }\r\n    }\r\n    /**\r\n     * Solve the geomechanical restoration problem with animation speed control.\r\n     */\r\n    async solve(model, updateCallback, updateStatus, animationSpeed = 1.0) {\r\n        if (this.isRunning)\r\n            return;\r\n        this.start(model);\r\n        const frameDelay = 16 / animationSpeed; // Base 60fps adjusted by speed\r\n        while (this.isRunning) {\r\n            const result = await this.step(model);\r\n            if (result) {\r\n                updateCallback();\r\n                updateStatus(result);\r\n                if (result.converged) {\r\n                    console.log(`Solver converged after ${result.iterations} iterations with error ${result.error.toExponential(3)}`);\r\n                    break;\r\n                }\r\n                if (result.iterations >= this.maxIterations) {\r\n                    console.log(`Solver stopped at max iterations (${result.iterations}) with error ${result.error.toExponential(3)}`);\r\n                    break;\r\n                }\r\n            }\r\n            // Yield control to browser for animation\r\n            await new Promise(resolve => setTimeout(resolve, frameDelay));\r\n        }\r\n        this.isRunning = false;\r\n    }\r\n    /**\r\n     * Perform **one** Gauss-Seidel iteration.\r\n     * This method updates the positions of nodes based on the forces acting on them,\r\n     * using the Gauss-Seidel method to solve the linear system of equations.\r\n     */\r\n    iteration(model) {\r\n        let maxDisplacement = 0;\r\n        // Process each node\r\n        for (const node of model.getNodes()) {\r\n            const displ = node.nodalDisplacement();\r\n            // displ is undef if node is fixed or node compliance is singular\r\n            if (displ) {\r\n                if (!node.fixedX) {\r\n                    node.position.x += this.damping * displ.x;\r\n                    node.displacement.x += this.damping * displ.x;\r\n                    maxDisplacement = Math.max(maxDisplacement, Math.abs(displ.x));\r\n                }\r\n                if (!node.fixedY) {\r\n                    node.position.y += this.damping * displ.y;\r\n                    node.displacement.y += this.damping * displ.y;\r\n                    maxDisplacement = Math.max(maxDisplacement, Math.abs(displ.y));\r\n                }\r\n            }\r\n        }\r\n        return maxDisplacement;\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/GaussSeidel.ts?\n}");

/***/ }),

/***/ "./src/dynel/Material.ts":
/*!*******************************!*\
  !*** ./src/dynel/Material.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Material: () => (/* binding */ Material)\n/* harmony export */ });\nclass Material {\r\n    constructor(y, p, d) {\r\n        this.youngModulus_ = 1; // E (GPa)\r\n        this.poissonRatio_ = 0.25; // ν\r\n        this.density_ = 1; // ρ (kg/m³)\r\n        this.D_ = []; // Plane stress constitutive matrix\r\n        this.youngModulus_ = y;\r\n        this.poissonRatio_ = p;\r\n        this.density_ = d;\r\n        this.initialize();\r\n    }\r\n    get youngModulus() {\r\n        return this.youngModulus_;\r\n    }\r\n    set youngModulus(v) {\r\n        this.youngModulus_ = v;\r\n        this.initialize();\r\n    }\r\n    get poissonRatio() {\r\n        return this.poissonRatio_;\r\n    }\r\n    set poissonRatio(v) {\r\n        this.poissonRatio_ = v;\r\n        this.initialize();\r\n    }\r\n    get density() {\r\n        return this.density_;\r\n    }\r\n    set density(v) {\r\n        this.density_ = v;\r\n    }\r\n    get D() { return this.D_; }\r\n    initialize() {\r\n        // Plane stress constitutive matrix\r\n        const E = this.youngModulus_;\r\n        const nu = this.poissonRatio_;\r\n        const factor = E / (1 - nu * nu);\r\n        this.D_ = [\r\n            [factor, factor * nu, 0],\r\n            [factor * nu, factor, 0],\r\n            [0, 0, factor * (1 - nu) / 2]\r\n        ];\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/Material.ts?\n}");

/***/ }),

/***/ "./src/dynel/Model.ts":
/*!****************************!*\
  !*** ./src/dynel/Model.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Model: () => (/* binding */ Model)\n/* harmony export */ });\n/* harmony import */ var _GNode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GNode */ \"./src/dynel/GNode.ts\");\n/* harmony import */ var _Triangle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Triangle */ \"./src/dynel/Triangle.ts\");\n\r\n\r\nclass Model {\r\n    constructor() {\r\n        this.beginC_ = false;\r\n        this.isNode_ = false;\r\n        this.isTriangle_ = false;\r\n        this.nodes = new Map();\r\n        this.triangles = new Map();\r\n        this.contacts = [];\r\n    }\r\n    beginConstruction() {\r\n        if (this.beginC_) {\r\n            throw \"Already in construction mode\";\r\n        }\r\n        this.beginC_ = true;\r\n        this.isNode_ = false;\r\n        this.isTriangle_ = false;\r\n    }\r\n    beginNodes() {\r\n        if (!this.beginC_)\r\n            throw \"You must call beginConstruction first\";\r\n        this.isNode_ = true;\r\n    }\r\n    // Add node to the mesh\r\n    addNode(id, x, y, isFixed = false) {\r\n        if (!this.beginC_) {\r\n            throw \"You must call beginConstruction before adding nodes\";\r\n        }\r\n        if (!this.isNode_) {\r\n            throw \"you must call beginNodes first\";\r\n        }\r\n        this.nodes.set(id, new _GNode__WEBPACK_IMPORTED_MODULE_0__.GNode(id, { x, y }, isFixed));\r\n    }\r\n    endNodes() {\r\n        if (!this.isNode_)\r\n            throw \"You must call beginNode first and add the nodes\";\r\n        this.isNode_ = false;\r\n    }\r\n    beginTriangles() {\r\n        if (this.isNode_)\r\n            throw \"You must call endNodes\";\r\n        this.isTriangle_ = true;\r\n    }\r\n    // Add triangle element\r\n    addTriangle(id, nodeIds, materialProps) {\r\n        if (!this.isTriangle_) {\r\n            throw \"You must call beginTraingles before adding triangles\";\r\n        }\r\n        const n0 = this.nodes.get(nodeIds[0]);\r\n        const n1 = this.nodes.get(nodeIds[1]);\r\n        const n2 = this.nodes.get(nodeIds[2]);\r\n        if (!n0 || !n1 || !n2) {\r\n            throw new Error(`Nodes with IDs ${nodeIds.join(\", \")} not found`);\r\n        }\r\n        this.triangles.set(id, new _Triangle__WEBPACK_IMPORTED_MODULE_1__.Triangle(id, n0, n1, n2, materialProps));\r\n    }\r\n    endTriangles() {\r\n        if (!this.isTriangle_)\r\n            throw \"You must call beginTriangles first and add the triangles\";\r\n        this.isTriangle_ = false;\r\n    }\r\n    endConstruction() {\r\n        if (!this.beginC_) {\r\n            throw \"You must begin a construction before calling endConstruction\";\r\n        }\r\n        if (this.isTriangle_) {\r\n            throw \"You must call endTriangles\";\r\n        }\r\n        this.beginC_ = false;\r\n        this.isNode_ = false;\r\n        this.isTriangle_ = false;\r\n        // Init triangles and nodes if necessary\r\n        this.triangles.forEach(triangle => triangle.initialize());\r\n        this.nodes.forEach(node => node.initialize());\r\n    }\r\n    // Set boundary conditions\r\n    setFixedNode(nodeId, fixedX = true, fixedY = true) {\r\n        const node = this.nodes.get(nodeId);\r\n        if (node) {\r\n            node.fixedX = fixedX;\r\n            node.fixedY = fixedY;\r\n            node.isFixed = fixedX || fixedY;\r\n        }\r\n    }\r\n    // Apply force to node\r\n    applyForce(nodeId, fx, fy) {\r\n        const node = this.nodes.get(nodeId);\r\n        if (node) {\r\n            node.force.x += fx;\r\n            node.force.y += fy;\r\n        }\r\n    }\r\n    getNodes() {\r\n        return Array.from(this.nodes.values());\r\n    }\r\n    getNode(id) {\r\n        return this.nodes.get(id);\r\n    }\r\n    getTriangles() {\r\n        return Array.from(this.triangles.values());\r\n    }\r\n    getTriangle(id) {\r\n        return this.triangles.get(id);\r\n    }\r\n    // Calculate maximum Coulomb shear stress for fracture prediction\r\n    // TODO: to me moved somewhere else in a near future\r\n    calculateMCSS(frictionAngle) {\r\n        const mcssValues = new Map();\r\n        const tanPhi = Math.tan(frictionAngle * Math.PI / 180);\r\n        for (const triangle of this.triangles.values()) {\r\n            const [sigmaXX, sigmaYY, tauXY] = triangle.stress;\r\n            // Principal stresses\r\n            const sigmaAvg = (sigmaXX + sigmaYY) / 2;\r\n            const radius = Math.sqrt(Math.pow((sigmaXX - sigmaYY) / 2, 2) + tauXY * tauXY);\r\n            const sigmaMax = sigmaAvg + radius;\r\n            const sigmaMin = sigmaAvg - radius;\r\n            // Maximum Coulomb Shear Stress\r\n            const mcss = (sigmaMax - sigmaMin) / 2 * Math.sqrt(1 + tanPhi * tanPhi)\r\n                - tanPhi * (sigmaMax + sigmaMin) / 2;\r\n            mcssValues.set(triangle.id, mcss);\r\n        }\r\n        return mcssValues;\r\n    }\r\n    // Export results for visualization\r\n    // TODO: to me moved somewhere else in a near future\r\n    exportResults() {\r\n        return {\r\n            nodes: this.getNodes().map(node => ({\r\n                id: node.id,\r\n                x: node.position.x,\r\n                y: node.position.y,\r\n                fx: node.force.x,\r\n                fy: node.force.y\r\n            })),\r\n            triangles: this.getTriangles().map(triangle => ({\r\n                id: triangle.id,\r\n                nodes: [...triangle.nodes.map((n) => n.id)],\r\n                stress: [...triangle.stress],\r\n                strain: [...triangle.strain]\r\n            }))\r\n        };\r\n    }\r\n    // Detect and handle contact between fault surfaces\r\n    detectContacts() {\r\n        this.contacts = [];\r\n        // Implementation for contact detection would go here\r\n    }\r\n    // Apply contact forces\r\n    applyContactForces() {\r\n        for (const contact of this.contacts) {\r\n            const slaveNode = this.nodes.get(contact.slaveNodeId);\r\n            if (slaveNode && contact.distance < 0) {\r\n                // Apply contact force to prevent penetration\r\n                const contactForce = Math.abs(contact.distance) * 1e6; // Penalty method\r\n                slaveNode.force.x += contactForce * contact.normal.x;\r\n                slaveNode.force.y += contactForce * contact.normal.y;\r\n            }\r\n        }\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/Model.ts?\n}");

/***/ }),

/***/ "./src/dynel/Point2D.ts":
/*!******************************!*\
  !*** ./src/dynel/Point2D.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   isNull: () => (/* binding */ isNull)\n/* harmony export */ });\nfunction isNull(p) {\r\n    return p.x === 0 && p.y === 0;\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/Point2D.ts?\n}");

/***/ }),

/***/ "./src/dynel/Triangle.ts":
/*!*******************************!*\
  !*** ./src/dynel/Triangle.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Triangle: () => (/* binding */ Triangle)\n/* harmony export */ });\n/* harmony import */ var _Material__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Material */ \"./src/dynel/Material.ts\");\n\r\nclass Triangle {\r\n    constructor(id, n1, n2, n3, materialProps) {\r\n        // ------------------------------------------------------------------\r\n        this.id = -1;\r\n        this.materialProps = new _Material__WEBPACK_IMPORTED_MODULE_0__.Material(1.0, 0.3, 1.0);\r\n        this.area = 0;\r\n        this.strain = [0, 0, 0];\r\n        this.stress = [0, 0, 0];\r\n        this.shapeFunctionDerivatives = [[0, 0], [0, 0], [0, 0]];\r\n        this.B = []; // Strain-displacement matrix\r\n        this.K = []; // Stiffness matrix\r\n        this.id = id;\r\n        this.nodes = [n1, n2, n3];\r\n        this.materialProps = materialProps;\r\n        this.area = this.computeArea();\r\n        this.strain = [0, 0, 0]; // εxx, εyy, γxy\r\n        this.stress = [0, 0, 0]; // σxx, σyy, τxy\r\n        this.shapeFunctionDerivatives = this.computeShapeFunctionDerivatives();\r\n    }\r\n    initialize() {\r\n        this.area = this.computeArea();\r\n        this.shapeFunctionDerivatives = this.computeShapeFunctionDerivatives();\r\n        // Strain-displacement matrix B\r\n        const dN = this.shapeFunctionDerivatives;\r\n        this.B = [\r\n            [dN[0][0], 0, dN[1][0], 0, dN[2][0], 0],\r\n            [0, dN[0][1], 0, dN[1][1], 0, dN[2][1]],\r\n            [dN[0][1], dN[0][0], dN[1][1], dN[1][0], dN[2][1], dN[2][0]]\r\n        ];\r\n        this.K = this.computeStiffness();\r\n    }\r\n    get stiffness() { return this.K; }\r\n    nodeIds() { return this.nodes.map(node => node.id); }\r\n    nodalForces() {\r\n        const strain = this.computeStrain();\r\n        const stress = this.computeStress(strain);\r\n        // triangle.strain = strain;\r\n        // triangle.stress = stress;\r\n        const area = this.area;\r\n        const thickness = 1.0;\r\n        // Nodal forces = B^T * stress * area * thickness\r\n        const forces = Array(6).fill(0);\r\n        for (let i = 0; i < 6; i++) {\r\n            for (let j = 0; j < 3; j++) {\r\n                forces[i] += this.B[j][i] * stress[j] * area * thickness;\r\n            }\r\n        }\r\n        const nodalForces = new Map();\r\n        this.nodes.map((node, i) => {\r\n            nodalForces.set(node.id, {\r\n                x: forces[2 * i],\r\n                y: forces[2 * i + 1]\r\n            });\r\n        });\r\n        return nodalForces;\r\n    }\r\n    // ---------------------------------------------------------------------\r\n    /**\r\n     * Calculate the stiffness matrix for the triangle element.\r\n     * This uses the material properties and shape function derivatives.\r\n     */\r\n    computeStiffness() {\r\n        const { youngModulus: E, poissonRatio: nu } = this.materialProps;\r\n        const area = this.area;\r\n        const dN = this.shapeFunctionDerivatives;\r\n        // Constitutive matrix D (plane stress)\r\n        const factor = E / (1 - nu * nu);\r\n        const D = [\r\n            [factor, factor * nu, 0],\r\n            [factor * nu, factor, 0],\r\n            [0, 0, factor * (1 - nu) / 2]\r\n        ];\r\n        // Element stiffness matrix K = ∫ B^T * D * B dV = B^T * D * B * area * thickness\r\n        const thickness = 1.0; // Assuming unit thickness for 2D plane stress\r\n        const K = Array(6).fill(0).map(() => Array(6).fill(0));\r\n        for (let i = 0; i < 6; i++) {\r\n            for (let j = 0; j < 6; j++) {\r\n                for (let k = 0; k < 3; k++) {\r\n                    for (let l = 0; l < 3; l++) {\r\n                        K[i][j] += this.B[k][i] * D[k][l] * this.B[l][j] * area * thickness;\r\n                    }\r\n                }\r\n            }\r\n        }\r\n        return K;\r\n    }\r\n    computeArea() {\r\n        const [n1, n2, n3] = this.nodes.map(n => n.position);\r\n        return 0.5 * Math.abs((n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y));\r\n    }\r\n    computeStrain() {\r\n        const nodes = this.nodes;\r\n        const u = [\r\n            nodes[0].displacement.x, nodes[0].displacement.y,\r\n            nodes[1].displacement.x, nodes[1].displacement.y,\r\n            nodes[2].displacement.x, nodes[2].displacement.y\r\n        ];\r\n        // Strain = B * u\r\n        const strain = [0, 0, 0];\r\n        for (let i = 0; i < 3; i++) {\r\n            for (let j = 0; j < 6; j++) {\r\n                strain[i] += this.B[i][j] * u[j];\r\n            }\r\n        }\r\n        return strain;\r\n    }\r\n    computeStress(strain) {\r\n        const D = this.materialProps.D;\r\n        // Stress = D * strain\r\n        const stress = [0, 0, 0];\r\n        for (let i = 0; i < 3; i++) {\r\n            for (let j = 0; j < 3; j++) {\r\n                stress[i] += D[i][j] * strain[j];\r\n            }\r\n        }\r\n        return stress;\r\n    }\r\n    computeShapeFunctionDerivatives() {\r\n        const [p1, p2, p3] = [\r\n            this.nodes[0].position,\r\n            this.nodes[1].position,\r\n            this.nodes[2].position\r\n        ];\r\n        const area2 = 2 * this.area;\r\n        return [\r\n            [(p2.y - p3.y) / area2, (p3.x - p2.x) / area2],\r\n            [(p3.y - p1.y) / area2, (p1.x - p3.x) / area2],\r\n            [(p1.y - p2.y) / area2, (p2.x - p1.x) / area2]\r\n        ];\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/Triangle.ts?\n}");

/***/ }),

/***/ "./src/dynel/index.ts":
/*!****************************!*\
  !*** ./src/dynel/index.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GNode: () => (/* reexport safe */ _GNode__WEBPACK_IMPORTED_MODULE_1__.GNode),\n/* harmony export */   GaussSeidel: () => (/* reexport safe */ _GaussSeidel__WEBPACK_IMPORTED_MODULE_4__.GaussSeidel),\n/* harmony export */   Model: () => (/* reexport safe */ _Model__WEBPACK_IMPORTED_MODULE_5__.Model),\n/* harmony export */   Triangle: () => (/* reexport safe */ _Triangle__WEBPACK_IMPORTED_MODULE_2__.Triangle),\n/* harmony export */   isNull: () => (/* reexport safe */ _Point2D__WEBPACK_IMPORTED_MODULE_3__.isNull),\n/* harmony export */   restore: () => (/* reexport safe */ _restore__WEBPACK_IMPORTED_MODULE_6__.restore)\n/* harmony export */ });\n/* harmony import */ var _Contact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Contact */ \"./src/dynel/Contact.ts\");\n/* harmony import */ var _GNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GNode */ \"./src/dynel/GNode.ts\");\n/* harmony import */ var _Triangle__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Triangle */ \"./src/dynel/Triangle.ts\");\n/* harmony import */ var _Point2D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Point2D */ \"./src/dynel/Point2D.ts\");\n/* harmony import */ var _GaussSeidel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./GaussSeidel */ \"./src/dynel/GaussSeidel.ts\");\n/* harmony import */ var _Model__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Model */ \"./src/dynel/Model.ts\");\n/* harmony import */ var _restore__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./restore */ \"./src/dynel/restore.ts\");\n// Geomechanically Based Restoration using Finite Element Method\r\n// Based on Maerten & Maerten (2006) - Chronologic modeling of faulted and fractured reservoirs\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/index.ts?\n}");

/***/ }),

/***/ "./src/dynel/restore.ts":
/*!******************************!*\
  !*** ./src/dynel/restore.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   restore: () => (/* binding */ restore)\n/* harmony export */ });\n/**\r\n * Restore the geological structure by flattening the top surface to a specified Y level.\r\n */\r\nfunction restore(model, solver, targetNodes, targetY) {\r\n    console.log('Starting geological restoration...');\r\n    // Apply restoration constraints\r\n    for (const nodeId of targetNodes) {\r\n        const node = model.getNode(nodeId);\r\n        if (node) {\r\n            // Constrain vertical movement to target level\r\n            node.position.y = targetY;\r\n            node.fixedY = true;\r\n            // Allow horizontal sliding\r\n            node.fixedX = false;\r\n        }\r\n    }\r\n    // Solve the system\r\n    solver.start(model);\r\n    console.log('Geological restoration completed');\r\n}\r\n\n\n//# sourceURL=webpack://dynel/./src/dynel/restore.ts?\n}");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GNode: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.GNode),\n/* harmony export */   GaussSeidel: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.GaussSeidel),\n/* harmony export */   Model: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.Model),\n/* harmony export */   Triangle: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.Triangle),\n/* harmony export */   isNull: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.isNull),\n/* harmony export */   restore: () => (/* reexport safe */ _dynel__WEBPACK_IMPORTED_MODULE_0__.restore)\n/* harmony export */ });\n/* harmony import */ var _dynel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dynel */ \"./src/dynel/index.ts\");\n\r\n\n\n//# sourceURL=webpack://dynel/./src/index.ts?\n}");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});