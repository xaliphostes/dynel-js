// Three.js visualization setup
let scene, camera, renderer, controls;
let model = new dynel.Model();
let solver = new dynel.GaussSeidel()
let currentMode = 'select';
let selectedNodes = new Set();
let nodeObjects = new Map();
let triangleObjects = new Map();
let wireframeObjects = new Map();
let displacementVectors = new Map(); // New: store displacement vector objects
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isAnimating = false;

// Mouse interaction state for node dragging
let isDraggingNode = false;
let draggedNodeId = null;
let dragStartMouse = new THREE.Vector2();
let dragStartNodePos = new THREE.Vector2();

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
    },
    displacement: 0x00ff00  // Green for displacement vectors
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Camera setup
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

            // Handle node dragging for move mode
            if (currentMode === 'move') {
                handleNodeDragStart(event);
            }
        }
    });

    document.addEventListener('mousemove', (event) => {
        if (event.target.id === 'canvas') {
            if (isDraggingNode && currentMode === 'move') {
                handleNodeDrag(event);
            } else if (isMouseDown && !isDraggingNode) {
                // Camera panning
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
        }
    });

    document.addEventListener('mouseup', (event) => {
        if (isDraggingNode && currentMode === 'move') {
            handleNodeDragEnd(event);
        }
        isMouseDown = false;
    });

    document.addEventListener('wheel', (event) => {
        if (event.target.id === 'canvas') {
            const zoomFactor = 1 + (event.deltaY * 0.001);

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

    // Display checkboxes - Updated to include displacement vectors
    document.getElementById('showNodes').addEventListener('change', updateDisplayVisibility);
    document.getElementById('showWireframe').addEventListener('change', updateDisplayVisibility);
    document.getElementById('showTriangles').addEventListener('change', updateDisplayVisibility);
    document.getElementById('showDisplacements').addEventListener('change', updateDisplayVisibility); // New

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

function updateDisplayVisibility() {
    const showNodes = document.getElementById('showNodes').checked;
    const showWireframe = document.getElementById('showWireframe').checked;
    const showTriangles = document.getElementById('showTriangles').checked;
    const showDisplacements = document.getElementById('showDisplacements').checked; // New

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

    // New: Update displacement vector visibility
    for (const [nodeId, object] of displacementVectors) {
        object.visible = showDisplacements;
    }
}

function setMode(mode) {
    currentMode = mode;

    // Clear selection when changing modes
    selectedNodes.clear();

    // Reset any dragging state
    isDraggingNode = false;
    draggedNodeId = null;
    document.body.style.cursor = 'default';

    // Update cursor style based on mode
    const canvas = document.getElementById('canvas');
    switch (mode) {
        case 'move':
            canvas.style.cursor = 'grab';
            break;
        case 'select':
            canvas.style.cursor = 'pointer';
            break;
        case 'fixity':
            canvas.style.cursor = 'crosshair';
            break;
        case 'force':
            canvas.style.cursor = 'crosshair';
            break;
        case 'restore':
            canvas.style.cursor = 'crosshair';
            break;
        default:
            canvas.style.cursor = 'default';
    }

    updateNodeVisuals();
}

function createSimpleFold() {
    clearMesh();

    const limestone = new dynel.Material(
        parseFloat(document.getElementById('youngModulus').value) * 1e9,
        parseFloat(document.getElementById('poissonRatio').value),
        parseFloat(document.getElementById('density').value)
    )

    // Create a simple folded geometry (anticline)
    const width = 20;
    const height = 10;
    const amplitude = 3;

    // Create nodes in a grid with folding
    const NY = 10
    const NX = 30

    model.beginConstruction(); {
        model.beginNodes(); {


            let nodeId = 0;
            for (let j = 0; j <= NY; j++) {
                for (let i = 0; i <= NX; i++) {
                    const x = (i / NX) * width - width / 2;
                    const baseY = (j / NY) * height - height / 2;

                    // Add folding - sinusoidal deformation
                    const foldY = j > 0 ? amplitude * Math.sin((i / NX) * Math.PI) * (j / NY) : 0;
                    const y = baseY + foldY - height;

                    model.addNode(nodeId, x, y);
                    nodeId++;
                }
            }
        }
        model.endNodes()
        model.beginTriangles(); {

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
        }
        model.endTriangles()
    }
    model.endConstruction()

    // Fix bottom nodes
    for (let i = 0; i <= NX; i++) {
        model.setFixedNode(i, true, true);
    }

    updateVisualization();
}

function createComplexFold() {
    clearMesh();

    const limestone = new dynel.Material(
        parseFloat(document.getElementById('youngModulus').value) * 1e9,
        parseFloat(document.getElementById('poissonRatio').value),
        parseFloat(document.getElementById('density').value)
    )

    // Create a more complex folded geometry with fault
    const width = 30;
    const height = 15;
    const amplitude = 4;

    const NY = 20
    const NX = 40

    let max = Number.NEGATIVE_INFINITY

    model.beginConstruction(); {
        model.beginNodes(); {

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

                    const y = baseY + foldY;

                    if (y > max) {
                        max = y
                    }

                    model.addNode(nodeId, x, y);
                    nodeId++;
                }
            }
        }
        model.endNodes()
        model.beginTriangles(); {

            // Create triangular elements
            let triangleId = 0;
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const n1 = j * (NX + 1) + i;
                    const n2 = j * (NX + 1) + i + 1;
                    const n3 = (j + 1) * (NX + 1) + i;
                    const n4 = (j + 1) * (NX + 1) + i + 1;

                    model.addTriangle(triangleId++, [n1, n2, n3], limestone);
                    model.addTriangle(triangleId++, [n2, n4, n3], limestone);
                }
            }

        }
        model.endTriangles()

        // Translate nodes
        model.getNodes().forEach(node => {
            node.position.y -= max + 1;
            node.originalPosition.y = max + 1;
        });
        // Fix bottom and side nodes
        for (let i = 0; i <= NX; i++) {
            model.setFixedNode(i, true, true); // Bottom
        }
    }
    model.endConstruction()

    updateVisualization();
}

function clearMesh() {
    model = new dynel.Model();
    selectedNodes.clear();

    // Clear Three.js objects
    nodeObjects.clear();
    triangleObjects.clear();
    wireframeObjects.clear();
    displacementVectors.clear(); // New: clear displacement vectors

    // Remove all mesh objects from scene
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.userData.type === 'node' || child.userData.type === 'triangle' ||
            child.userData.type === 'wireframe' || child.userData.type === 'displacement') { // Updated
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
    // Skip click handling if we just finished dragging a node
    if (currentMode === 'move' && isDraggingNode) {
        return;
    }

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

        case 'move':
            // Node moving is handled by drag events, not clicks
            break;
    }

    updateNodeVisuals();
}

// New function to create displacement vector visualization
function createDisplacementVector(node) {
    const displacement = node.displacement;
    const magnitude = Math.sqrt(displacement.x * displacement.x + displacement.y * displacement.y);

    // Only create vector if displacement is significant
    if (magnitude < 0.01) {
        return;
    }

    // Scale factor for visualization (adjust as needed)
    const scaleFactor = 1.0;

    // Create arrow geometry
    const direction = new THREE.Vector3(displacement.x, displacement.y, 0).normalize();
    const origin = new THREE.Vector3(node.originalPosition.x, node.originalPosition.y, 0.1);
    const length = magnitude * scaleFactor;

    const arrowHelper = new THREE.ArrowHelper(direction, origin, length, COLORS.displacement, length * 0.2, length * 0.1);
    arrowHelper.userData.type = 'displacement';
    arrowHelper.userData.nodeId = node.id;

    scene.add(arrowHelper);
    displacementVectors.set(node.id, arrowHelper);
}

// Node dragging functions for move mode
function handleNodeDragStart(event) {
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
        const node = model.getNode(nodeId);

        if (node && !node.isFixed) {
            isDraggingNode = true;
            draggedNodeId = nodeId;

            // Store initial mouse position
            dragStartMouse.set(mouse.x, mouse.y);

            // Store initial node position
            dragStartNodePos.set(node.position.x, node.position.y);

            // Change cursor to indicate dragging
            document.body.style.cursor = 'grabbing';

            // Prevent camera panning while dragging
            event.preventDefault();
        }
    }
}

function handleNodeDrag(event) {
    if (!isDraggingNode || !draggedNodeId) return;

    // Calculate current mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    const currentMouse = new THREE.Vector2();
    currentMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    currentMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Calculate mouse movement in normalized coordinates
    const mouseDelta = new THREE.Vector2();
    mouseDelta.subVectors(currentMouse, dragStartMouse);

    // Convert mouse movement to world coordinates
    const worldDelta = new THREE.Vector2();
    worldDelta.x = mouseDelta.x * (camera.right - camera.left) / 2;
    worldDelta.y = mouseDelta.y * (camera.top - camera.bottom) / 2;

    // Update node position
    const node = model.getNode(draggedNodeId);
    if (node) {
        const newX = dragStartNodePos.x + worldDelta.x;
        const newY = dragStartNodePos.y + worldDelta.y;

        // Only move if not fixed in that direction
        if (!node.fixedX) {
            node.position.x = newX;
            // Update displacement relative to original position
            node.displacement.x = node.position.x - node.originalPosition.x;
        }
        if (!node.fixedY) {
            node.position.y = newY;
            // Update displacement relative to original position
            node.displacement.y = node.position.y - node.originalPosition.y;
        }

        // Update visualization
        updateNodeVisuals();
    }
}

function handleNodeDragEnd(event) {
    if (isDraggingNode) {
        isDraggingNode = false;
        draggedNodeId = null;

        // Reset cursor
        document.body.style.cursor = 'default';

        // Log the final position for debugging
        const node = model.getNode(draggedNodeId);
        if (node) {
            console.log(`Node ${draggedNodeId} moved to (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)})`);
            console.log(`Displacement: (${node.displacement.x.toFixed(2)}, ${node.displacement.y.toFixed(2)})`);
        }
    }
}

// Updated function to update displacement vectors
function updateDisplacementVectors() {
    // Clear existing displacement vectors
    for (const [nodeId, vector] of displacementVectors) {
        scene.remove(vector);
    }
    displacementVectors.clear();

    // Create new displacement vectors for all nodes
    for (const node of model.getNodes()) {
        createDisplacementVector(node);
    }
}

function updateVisualization() {
    // Clear existing objects
    nodeObjects.clear();
    triangleObjects.clear();
    wireframeObjects.clear();

    // Clear displacement vectors
    for (const [nodeId, vector] of displacementVectors) {
        scene.remove(vector);
    }
    displacementVectors.clear();

    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.userData.type === 'node' || child.userData.type === 'triangle' ||
            child.userData.type === 'wireframe' || child.userData.type === 'displacement') {
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

    // Create displacement vectors
    updateDisplacementVectors();

    updateNodeVisuals();
    updateDisplayVisibility();
}

function createTriangleObject(triangle) {
    const [id1, id2, id3] = triangle.nodes.map(node => node.id);
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
            color = COLORS.node.restored;
        } else if (node.isFixed) {
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
        const [id1, id2, id3] = triangle.nodes.map(node => node.id);
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

        const [id1, id2, id3] = triangle.nodeIds()
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

    // Update displacement vectors
    updateDisplacementVectors();
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