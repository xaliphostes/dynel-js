// Three.js visualization setup
let scene, camera, renderer, controls;
let model = new dynel.Model();
let solver = new dynel.GaussSeidel()
let currentMode = 'select';
let selectedNodes = new Set();
let nodeObjects = new Map();
let triangleObjects = new Map();
let wireframeObjects = new Map();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isAnimating = false;

// Colors
const COLORS = {
    node: {
        default: 0xffffff,
        selected: 0xf093fb,
        fixed: 0xff5722,          // Red for fully fixed nodes
        restored: 0x9c27b0,       // Purple for restoration target nodes
        force: 0x4caf50
    },
    triangle: {
        default: 0x263238,
        stressed: 0xff9800
    }
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Camera setup
    // camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const aspect = width / height;
    const frustumSize = 50;
    camera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 100);

    camera.position.set(0, 0, 50);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.99);
    scene.add(ambientLight);

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // directionalLight.position.set(50, 50, 50);
    // directionalLight.castShadow = true;
    // scene.add(directionalLight);

    // Simple orbit controls (mouse interaction)
    setupControls();

    // Event listeners
    setupEventListeners();

    // Create initial geometry
    createSimpleFold();

    // Start render loop
    animate();
}

function setupControls() {
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousedown', (event) => {
        if (event.target.id === 'canvas') {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });

    document.addEventListener('mousemove', (event) => {
        if (isMouseDown && event.target.id === 'canvas') {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            const scaleX = (camera.right - camera.left) / window.innerWidth;
            const scaleY = (camera.top - camera.bottom) / window.innerHeight;

            camera.left -= deltaX * scaleX;
            camera.right -= deltaX * scaleX;
            camera.top += deltaY * scaleY;
            camera.bottom += deltaY * scaleY;

            camera.updateProjectionMatrix();

            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    document.addEventListener('wheel', (event) => {
        if (event.target.id === 'canvas') {
            // camera.position.z += event.deltaY * 0.01;
            // camera.position.z = Math.max(10, Math.min(100, camera.position.z));
            const zoomFactor = 1 + (event.deltaY * 0.001);
            const aspect = window.innerWidth / window.innerHeight;

            camera.left *= zoomFactor;
            camera.right *= zoomFactor;
            camera.top *= zoomFactor;
            camera.bottom *= zoomFactor;

            camera.updateProjectionMatrix();
        }
    });
}

function setupEventListeners() {
    // Mode selection
    document.getElementById('modeSelect').addEventListener('change', (e) => setMode(e.target.value));

    // Collapsible sections
    setupCollapsibleSections();

    // Geometry buttons
    document.getElementById('createSimple').addEventListener('click', createSimpleFold);
    document.getElementById('createComplex').addEventListener('click', createComplexFold);
    document.getElementById('clearMesh').addEventListener('click', clearMesh);

    // Solver buttons
    document.getElementById('startSolver').addEventListener('click', startSolver);
    document.getElementById('stepSolver').addEventListener('click', stepSolver);
    document.getElementById('pauseSolver').addEventListener('click', pauseSolver);
    document.getElementById('resetSolver').addEventListener('click', resetSolver);

    // Sliders
    document.getElementById('youngModulus').addEventListener('input', updateMaterialProperties);
    document.getElementById('poissonRatio').addEventListener('input', updateMaterialProperties);
    document.getElementById('density').addEventListener('input', updateMaterialProperties);
    document.getElementById('convergence').addEventListener('input', updateSolverParameters);
    document.getElementById('maxIterations').addEventListener('input', updateSolverParameters);
    document.getElementById('damping').addEventListener('input', updateSolverParameters);

    // Canvas click
    document.getElementById('canvas').addEventListener('click', onCanvasClick);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function setupCollapsibleSections() {
    const sections = document.querySelectorAll('.control-section h3');

    sections.forEach((header, index) => {
        header.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const section = this.parentElement;
            const wasCollapsed = section.classList.contains('collapsed');
            section.classList.toggle('collapsed');

            // Optional: Save collapsed state to localStorage
            const sectionTitle = this.textContent.trim();
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem(`section-${sectionTitle}`, isCollapsed);
        });
    });

    // Optional: Restore collapsed states from localStorage
    sections.forEach(header => {
        const sectionTitle = header.textContent.trim();
        const wasCollapsed = localStorage.getItem(`section-${sectionTitle}`) === 'true';
        if (wasCollapsed) {
            header.parentElement.classList.add('collapsed');
        }
    });
}

function setupEventListeners() {
    // Mode buttons
    document.getElementById('modeSelect').addEventListener('change', (e) => setMode(e.target.value));

    // Collapsible sections
    setupCollapsibleSections();

    // Geometry buttons
    document.getElementById('createSimple').addEventListener('click', createSimpleFold);
    document.getElementById('createComplex').addEventListener('click', createComplexFold);
    document.getElementById('clearMesh').addEventListener('click', clearMesh);

    // Solver buttons
    document.getElementById('startSolver').addEventListener('click', startSolver);
    document.getElementById('stepSolver').addEventListener('click', stepSolver);
    document.getElementById('pauseSolver').addEventListener('click', pauseSolver);
    document.getElementById('resetSolver').addEventListener('click', resetSolver);

    // Sliders
    document.getElementById('youngModulus').addEventListener('input', updateMaterialProperties);
    document.getElementById('poissonRatio').addEventListener('input', updateMaterialProperties);
    document.getElementById('density').addEventListener('input', updateMaterialProperties);
    document.getElementById('convergence').addEventListener('input', updateSolverParameters);
    document.getElementById('maxIterations').addEventListener('input', updateSolverParameters);
    document.getElementById('damping').addEventListener('input', updateSolverParameters);

    // Canvas click
    document.getElementById('canvas').addEventListener('click', onCanvasClick);

    // Display controls
    document.getElementById('showNodes').addEventListener('change', updateDisplayVisibility);
    document.getElementById('showWireframe').addEventListener('change', updateDisplayVisibility);
    document.getElementById('showTriangles').addEventListener('change', updateDisplayVisibility);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function updateDisplayVisibility() {
    const showNodes = document.getElementById('showNodes').checked;
    const showWireframe = document.getElementById('showWireframe').checked;
    const showTriangles = document.getElementById('showTriangles').checked;

    // Update node visibility
    for (const [nodeId, object] of nodeObjects) {
        object.visible = showNodes;
    }

    // Update triangle visibility
    for (const [triangleId, object] of triangleObjects) {
        object.visible = showTriangles;
    }

    // Update wireframe visibility
    for (const [triangleId, object] of wireframeObjects) {
        object.visible = showWireframe;
    }
}

function setMode(mode) {
    currentMode = mode;
    //document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
    //document.getElementById(mode + 'Mode').classList.add('active');

    // Clear selection when changing modes
    selectedNodes.clear();
    updateNodeVisuals();
}

function createSimpleFold() {
    clearMesh();

    const limestone = {
        youngModulus: parseFloat(document.getElementById('youngModulus').value) * 1e9,
        poissonRatio: parseFloat(document.getElementById('poissonRatio').value),
        density: parseFloat(document.getElementById('density').value)
    };

    // Create a simple folded geometry (anticline)
    const width = 20;
    const height = 10;
    const amplitude = 3;

    // Create nodes in a grid with folding
    const NY = 10
    const NX = 30

    let nodeId = 0;
    for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
            const x = (i / NX) * width - width / 2;
            const baseY = (j / NY) * height - height / 2;

            // Add folding - sinusoidal deformation
            const foldY = j > 0 ? amplitude * Math.sin((i / NX) * Math.PI) * (j / NY) : 0;
            const y = baseY + foldY - height;

            // console.log(x,y)

            model.addNode(nodeId, x, y);
            nodeId++;
        }
    }

    // Create triangular elements
    let triangleId = 0;
    for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
            const n1 = j * (NX + 1) + i;
            const n2 = j * (NX + 1) + i + 1;
            const n3 = (j + 1) * (NX + 1) + i;
            const n4 = (j + 1) * (NX + 1) + i + 1;

            // Create two triangles per quad
            model.addTriangle(triangleId++, [n1, n2, n3], limestone);
            model.addTriangle(triangleId++, [n2, n4, n3], limestone);
        }
    }

    // Fix bottom nodes
    for (let i = 0; i <= NX; i++) {
        model.setFixedNode(i, true, true);
    }

    updateVisualization();
}

function createComplexFold() {
    clearMesh();

    const limestone = {
        youngModulus: parseFloat(document.getElementById('youngModulus').value) * 1e9,
        poissonRatio: parseFloat(document.getElementById('poissonRatio').value),
        density: parseFloat(document.getElementById('density').value)
    };

    // Create a more complex folded geometry with fault
    const width = 30;
    const height = 15;
    const amplitude = 4;

    const NY = 20//6
    const NX = 40//15

    let max = Number.NEGATIVE_INFINITY

    let nodeId = 0;
    for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
            const x = (i / NX) * width - width / 2;
            const baseY = (j / NY) * height - height / 2;

            // Complex folding with multiple wavelengths
            let foldY = 0;
            if (j > 0) {
                foldY = amplitude * Math.sin((i / NX) * Math.PI * 2) * (j / NY) * 0.7 +
                    amplitude * 0.3 * Math.sin((i / NX) * Math.PI * 4) * (j / NY);
            }

            // Add fault offset
            let faultOffset = 0;
            // if (i > 7 && j < 4) {
            //     faultOffset = -1.5;
            // }

            const y = baseY + foldY + faultOffset;

            if (y > max) {
                max = y
            }

            model.addNode(nodeId, x, y);
            nodeId++;
        }
    }

    // translate
    model.getNodes().forEach(node => {
        node.position.y -= max + 1;
        node.originalPosition.y = max + 1;
    });

    // Create triangular elements
    let triangleId = 0;
    for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
            const n1 = j * (NX + 1) + i;
            const n2 = j * (NX + 1) + i + 1;
            const n3 = (j + 1) * (NX + 1) + i;
            const n4 = (j + 1) * (NX + 1) + i + 1;

            // Skip elements across the fault
            // if (!(i === 7 && j < 3)) {
            model.addTriangle(triangleId++, [n1, n2, n3], limestone);
            model.addTriangle(triangleId++, [n2, n4, n3], limestone);
            // }
        }
    }

    // Fix bottom and side nodes
    for (let i = 0; i <= NX; i++) {
        model.setFixedNode(i, true, true); // Bottom
    }
    // for (let j = 0; j <= 6; j++) {
    //     model.setFixedNode(j * 16, true, false); // Left side
    //     model.setFixedNode(j * 16 + 15, true, false); // Right side
    // }

    updateVisualization();
}

function clearMesh() {
    model = new dynel.Model();
    selectedNodes.clear();

    // Clear Three.js objects
    nodeObjects.clear();
    triangleObjects.clear();
    wireframeObjects.clear(); // Add this line

    // Remove all mesh objects from scene
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.userData.type === 'node' || child.userData.type === 'triangle' || child.userData.type === 'wireframe') {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));

    updateVisualization();
}

function updateMaterialProperties() {
    const youngValue = document.getElementById('youngModulus').value;
    const poissonValue = document.getElementById('poissonRatio').value;
    const densityValue = document.getElementById('density').value;

    document.getElementById('youngValue').textContent = youngValue;
    document.getElementById('poissonValue').textContent = poissonValue;
    document.getElementById('densityValue').textContent = densityValue;

    // Update all triangle materials
    const newProps = {
        youngModulus: parseFloat(youngValue) * 1e9,
        poissonRatio: parseFloat(poissonValue),
        density: parseFloat(densityValue)
    };

    for (const triangle of model.triangles.values()) {
        triangle.materialProps = newProps;
    }
}

function updateSolverParameters() {
    const convergenceValue = document.getElementById('convergence').value;
    const maxIterValue = document.getElementById('maxIterations').value;
    const dampingValue = document.getElementById('damping').value;

    solver.convergenceThreshold = Math.pow(10, parseFloat(convergenceValue));
    solver.maxIterations = parseInt(maxIterValue);
    solver.damping = parseFloat(dampingValue);

    document.getElementById('convergenceValue').textContent = solver.convergenceThreshold.toExponential(0);
    document.getElementById('maxIterValue').textContent = maxIterValue;
    document.getElementById('dampingValue').textContent = dampingValue;
}

function onCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Find intersected nodes
    const nodeObjectsArray = Array.from(nodeObjects.values());
    const intersects = raycaster.intersectObjects(nodeObjectsArray);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const nodeId = clickedObject.userData.nodeId;

        handleNodeClick(nodeId);
    }
}

function handleNodeClick(nodeId) {
    const node = model.nodes.get(nodeId);
    if (!node) return;

    switch (currentMode) {
        case 'select':
            if (selectedNodes.has(nodeId)) {
                selectedNodes.delete(nodeId);
            } else {
                selectedNodes.add(nodeId);
            }
            break;

        case 'fixity':
            if (selectedNodes.has(nodeId)) {
                model.setFixedNode(nodeId, !node.fixedX, !node.fixedY);
            } else {
                model.setFixedNode(nodeId, !node.fixedX, !node.fixedY);
            }
            break;

        case 'force':
            const forceX = parseFloat(document.getElementById('forceX').value);
            const forceY = parseFloat(document.getElementById('forceY').value);
            model.applyForce(nodeId, forceX, forceY);
            break;

        case 'restore':
            // Set as restoration target (flatten to horizontal)
            const targetY = 0;
            model.setFixedNode(nodeId, false, true);
            node.position.y = targetY;
            break;
    }

    updateNodeVisuals();
}

// TODO: optimization for ONE mesh instead of a soup of triangles
function updateVisualization() {
    // Clear existing objects
    nodeObjects.clear();
    triangleObjects.clear();
    wireframeObjects.clear(); // Add this line

    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.userData.type === 'node' || child.userData.type === 'triangle' || child.userData.type === 'wireframe') {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));

    // Create triangle meshes
    for (const triangle of model.triangles.values()) {
        createTriangleObject(triangle);
    }

    // Create node objects
    for (const node of model.nodes.values()) {
        createNodeObject(node);
    }

    updateNodeVisuals();
    updateDisplayVisibility(); // Add this line
}

// TODO: optimization for ONE mesh instead of a soup of triangles
function createTriangleObject(triangle) {
    const [id1, id2, id3] = triangle.nodeIds;
    const nodes = [
        model.nodes.get(id1),
        model.nodes.get(id2),
        model.nodes.get(id3)
    ];

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        nodes[0].position.x, nodes[0].position.y, 0,
        nodes[1].position.x, nodes[1].position.y, 0,
        nodes[2].position.x, nodes[2].position.y, 0
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
        color: COLORS.triangle.default,
        transparent: false,
        opacity: 0.7,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.type = 'triangle';
    mesh.userData.triangleId = triangle.id;

    scene.add(mesh);
    triangleObjects.set(triangle.id, mesh);

    // Add wireframe as separate object
    const wireframe = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: false,
        opacity: 0.3
    });
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
    wireframeMesh.userData.type = 'wireframe';
    wireframeMesh.userData.triangleId = triangle.id;
    
    scene.add(wireframeMesh);
    wireframeObjects.set(triangle.id, wireframeMesh);
}

function createNodeObject(node) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshLambertMaterial({
        color: COLORS.node.default
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(node.position.x, node.position.y, 0.1);
    sphere.userData.type = 'node';
    sphere.userData.nodeId = node.id;

    scene.add(sphere);
    nodeObjects.set(node.id, sphere);
}

function updateNodeVisuals() {
    for (const [nodeId, object] of nodeObjects) {
        const node = model.nodes.get(nodeId);
        if (!node) continue;

        // Update position
        object.position.set(node.position.x, node.position.y, 0.1);

        // Update color based on state
        let color = COLORS.node.default;

        if (selectedNodes.has(nodeId)) {
            color = COLORS.node.selected;
        } else if (node.fixedY && Math.abs(node.position.y - node.originalPosition.y) > 0.1) {
            // Restoration target (Y-fixed but moved from original position)
            color = COLORS.node.restored;
        } else if (node.isFixed) {
            // Fully fixed nodes
            color = COLORS.node.fixed;
        } else if (node.force.x !== 0 || node.force.y !== 0) {
            color = COLORS.node.force;
        }

        object.material.color.setHex(color);

        // Scale based on force magnitude
        const forceMagnitude = Math.sqrt(node.force.x * node.force.x + node.force.y * node.force.y);
        const scale = 1 + forceMagnitude / 50000;
        object.scale.setScalar(Math.min(scale, 3));
    }

    // Update triangle positions and colors
    for (const [triangleId, object] of triangleObjects) {
        const triangle = model.triangles.get(triangleId);
        if (!triangle) continue;

        // Update vertex positions
        const [id1, id2, id3] = triangle.nodeIds;
        const nodes = [
            model.nodes.get(id1),
            model.nodes.get(id2),
            model.nodes.get(id3)
        ];

        const positions = object.geometry.attributes.position.array;
        positions[0] = nodes[0].position.x;
        positions[1] = nodes[0].position.y;
        positions[3] = nodes[1].position.x;
        positions[4] = nodes[1].position.y;
        positions[6] = nodes[2].position.x;
        positions[7] = nodes[2].position.y;

        object.geometry.attributes.position.needsUpdate = true;
        object.geometry.computeVertexNormals();

        // Color based on stress
        const stressMagnitude = Math.sqrt(
            triangle.stress[0] * triangle.stress[0] +
            triangle.stress[1] * triangle.stress[1] +
            triangle.stress[2] * triangle.stress[2]
        );

        if (stressMagnitude > 1000) {
            const intensity = Math.min(stressMagnitude / 10000, 1);
            object.material.color.setRGB(intensity, 0.5 * (1 - intensity), 0);
        } else {
            object.material.color.setHex(COLORS.triangle.default);
        }
    }

    // Update wireframe positions
    for (const [triangleId, wireframeObject] of wireframeObjects) {
        const triangle = model.triangles.get(triangleId);
        if (!triangle) continue;

        const [id1, id2, id3] = triangle.nodeIds;
        const nodes = [
            model.nodes.get(id1),
            model.nodes.get(id2),
            model.nodes.get(id3)
        ];

        // Create new geometry for wireframe with updated positions
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            nodes[0].position.x, nodes[0].position.y, 0,
            nodes[1].position.x, nodes[1].position.y, 0,
            nodes[2].position.x, nodes[2].position.y, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const wireframe = new THREE.WireframeGeometry(geometry);
        wireframeObject.geometry.dispose();
        wireframeObject.geometry = wireframe;
    }
}

function startSolver() {
    solver.start(model);
    isAnimating = true;
    updateStatus();
    solverLoop();
}

function stepSolver() {
    if (!solver.isRunning) {
        solver.start(model);
    }
    solver.isPaused = false;
    solver.step(model).then(result => {
        if (result) {
            updateVisualization();
            updateStatus(result);
        }
        solver.isPaused = true;
    });
}

function pauseSolver() {
    solver.pause();
    updateStatus();
}

function resetSolver() {
    solver.reset(model);
    isAnimating = false;
    updateVisualization();
    updateStatus();
}

async function solverLoop() {
    if (!isAnimating || !solver.isRunning) return;

    const result = await solver.step(model);

    if (result) {
        updateVisualization();
        updateStatus(result);

        if (result.running && !solver.isPaused) {
            // Continue solving with animation
            requestAnimationFrame(solverLoop);
        }
    }
}

function updateStatus(result = null) {
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    const iterationCount = document.getElementById('iterationCount');
    const errorValue = document.getElementById('errorValue');
    const maxDisp = document.getElementById('maxDisp');

    if (result) {
        iterationCount.textContent = result.iterations;
        errorValue.textContent = result.error.toExponential(2);
        maxDisp.textContent = result.maxDisplacement.toFixed(6);

        const progress = Math.min((result.iterations / solver.maxIterations) * 100, 100);
        progressFill.style.width = progress + '%';

        if (result.converged) {
            statusText.textContent = 'Converged!';
            statusText.style.color = '#4caf50';
        } else if (!result.running) {
            statusText.textContent = 'Max iterations reached';
            statusText.style.color = '#ff9800';
        } else if (solver.isPaused) {
            statusText.textContent = 'Paused';
            statusText.style.color = '#2196f3';
        } else {
            statusText.textContent = 'Solving...';
            statusText.style.color = '#fff';
        }
    } else {
        if (solver.isRunning && solver.isPaused) {
            statusText.textContent = 'Paused';
            statusText.style.color = '#2196f3';
        } else if (!solver.isRunning) {
            statusText.textContent = 'Ready';
            statusText.style.color = '#fff';
            iterationCount.textContent = solver.currentIteration;
            errorValue.textContent = solver.currentError === Infinity ? '∞' : solver.currentError.toExponential(2);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Camera look at center
    // camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    // Preserve current center position
    const centerX = (camera.left + camera.right) / 2;
    const centerY = (camera.top + camera.bottom) / 2;

    const frustumHeight = camera.top - camera.bottom;
    const frustumWidth = frustumHeight * aspect;

    // Apply the new frustum size while preserving the center
    camera.left = centerX - frustumWidth / 2;
    camera.right = centerX + frustumWidth / 2;
    camera.top = centerY + frustumHeight / 2;
    camera.bottom = centerY - frustumHeight / 2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the application
init();

// Update initial slider values
updateMaterialProperties();
updateSolverParameters();