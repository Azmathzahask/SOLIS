// Space Habitat Designer - Main JavaScript File

class SpaceHabitatDesigner {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.habitatGroup = null;
        this.systemsGroup = null;
        this.gridHelper = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight = null;
        this.habitatMaterial = null;
        this.wireframeMaterial = null;
        this.currentShape = 'cylinder';
        this.currentRadius = 10;
        this.currentHeight = 15;
        this.systems = [];
        this.autoLayoutActive = false;
        
        this.init();
        this.setupEventListeners();
        this.createHabitat();
        // Apply theme to Three.js scene once everything exists
        this.applyThemeToWorkspace(this.getCurrentTheme());
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c0c0c);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(30, 30, 30);

        // Create renderer
        const canvas = document.getElementById('habitat-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Create groups
        this.habitatGroup = new THREE.Group();
        this.systemsGroup = new THREE.Group();
        this.scene.add(this.habitatGroup);
        this.scene.add(this.systemsGroup);

        // Add lighting
        this.setupLighting();

        // Add grid
        this.addGrid();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);

        // Directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 50, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(this.directionalLight);

        // Point light for accent
        this.pointLight = new THREE.PointLight(0x00d4ff, 0.5, 100);
        this.pointLight.position.set(-20, 20, -20);
        this.scene.add(this.pointLight);
    }

    addGrid() {
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        this.gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
        this.gridHelper.position.y = -this.currentHeight / 2;
        this.scene.add(this.gridHelper);
    }

    createHabitat() {
        // Clear existing habitat
        this.habitatGroup.clear();

        let geometry, material, mesh;

        switch (this.currentShape) {
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    this.currentRadius,
                    this.currentRadius,
                    this.currentHeight,
                    32
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(this.currentRadius, 32, 32);
                break;
            case 'cube':
                geometry = new THREE.BoxGeometry(
                    this.currentRadius * 2,
                    this.currentHeight,
                    this.currentRadius * 2
                );
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(
                    this.currentRadius,
                    this.currentRadius * 0.3,
                    16,
                100
                );
                break;
        }

        // Create material with transparency
        material = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add wireframe
        const wireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 })
        );

        this.habitatGroup.add(mesh);
        this.habitatGroup.add(wireframe);

        // Store materials for theme updates
        this.habitatMaterial = material;
        this.wireframeMaterial = wireframe.material;

        // Ensure colors match current theme
        this.applyThemeToWorkspace(this.getCurrentTheme());

        // Update info display
        this.updateHabitatInfo();
    }

    createSystem(systemType, position) {
        const systemColors = {
            'life-support': 0xff6b6b,
            'power': 0xffd93d,
            'waste': 0x6bcf7f,
            'thermal': 0x4d96ff,
            'communications': 0x9b59b6,
            'medical': 0xe74c3c,
            'sleep': 0x3498db,
            'exercise': 0xf39c12,
            'food': 0x1abc9c,
            'stowage': 0x95a5a6
        };

        const systemIcons = {
            'life-support': '🫁',
            'power': '⚡',
            'waste': '♻️',
            'thermal': '🌡️',
            'communications': '📡',
            'medical': '🏥',
            'sleep': '🛏️',
            'exercise': '💪',
            'food': '🍽️',
            'stowage': '📦'
        };

        // Create system geometry
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({
            color: systemColors[systemType],
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add system label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(systemIcons[systemType] + ' ' + systemType.replace('-', ' '), canvas.width / 2, canvas.height / 2 + 8);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(labelMaterial);
        sprite.position.set(position.x, position.y + 2, position.z);
        sprite.scale.set(4, 1, 1);

        const systemGroup = new THREE.Group();
        systemGroup.add(mesh);
        systemGroup.add(sprite);
        systemGroup.userData = { type: systemType };

        return systemGroup;
    }

    autoLayout() {
        this.clearSystems();
        
        const enabledSystems = this.getEnabledSystems();
        if (enabledSystems.length === 0) return;

        const radius = this.currentRadius * 0.8;
        const height = this.currentHeight * 0.8;
        const angleStep = (2 * Math.PI) / enabledSystems.length;

        enabledSystems.forEach((systemType, index) => {
            const angle = index * angleStep;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * height * 0.5;

            const system = this.createSystem(systemType, new THREE.Vector3(x, y, z));
            this.systemsGroup.add(system);
            this.systems.push(system);
        });

        this.updateSystemsCount();
    }

    clearSystems() {
        this.systemsGroup.clear();
        this.systems = [];
        this.updateSystemsCount();
    }

    getEnabledSystems() {
        const systemIds = [
            'life-support', 'power', 'waste', 'thermal', 'communications',
            'medical', 'sleep', 'exercise', 'food', 'stowage'
        ];

        return systemIds.filter(id => document.getElementById(id).checked);
    }

    updateHabitatInfo() {
        let volume, surfaceArea;

        switch (this.currentShape) {
            case 'cylinder':
                volume = Math.PI * this.currentRadius * this.currentRadius * this.currentHeight;
                surfaceArea = 2 * Math.PI * this.currentRadius * this.currentHeight + 
                             2 * Math.PI * this.currentRadius * this.currentRadius;
                break;
            case 'sphere':
                volume = (4/3) * Math.PI * this.currentRadius * this.currentRadius * this.currentRadius;
                surfaceArea = 4 * Math.PI * this.currentRadius * this.currentRadius;
                break;
            case 'cube':
                volume = this.currentRadius * 2 * this.currentHeight * this.currentRadius * 2;
                surfaceArea = 2 * (this.currentRadius * 2 * this.currentHeight + 
                                 this.currentRadius * 2 * this.currentRadius * 2 + 
                                 this.currentHeight * this.currentRadius * 2);
                break;
            case 'torus':
                const R = this.currentRadius;
                const r = this.currentRadius * 0.3;
                volume = 2 * Math.PI * Math.PI * R * r * r;
                surfaceArea = 4 * Math.PI * Math.PI * R * r;
                break;
        }

        // Calculate crew capacity (rough estimate: 20m³ per person)
        const crewCapacity = Math.floor(volume / 20);

        document.getElementById('volume-display').textContent = Math.round(volume);
        document.getElementById('surface-display').textContent = Math.round(surfaceArea);
        document.getElementById('crew-display').textContent = crewCapacity;
    }

    updateSystemsCount() {
        document.getElementById('systems-count').textContent = this.systems.length;
    }

    setupEventListeners() {
        // Shape controls
        document.getElementById('shape-type').addEventListener('change', (e) => {
            this.currentShape = e.target.value;
            this.createHabitat();
        });

        document.getElementById('radius').addEventListener('input', (e) => {
            this.currentRadius = parseFloat(e.target.value);
            document.getElementById('radius-value').textContent = this.currentRadius;
            this.createHabitat();
        });

        document.getElementById('height').addEventListener('input', (e) => {
            this.currentHeight = parseFloat(e.target.value);
            document.getElementById('height-value').textContent = this.currentHeight;
            this.createHabitat();
        });

        // Layout controls
        document.getElementById('auto-layout').addEventListener('click', () => {
            this.autoLayout();
        });

        document.getElementById('clear-layout').addEventListener('click', () => {
            this.clearSystems();
        });

        document.getElementById('save-layout').addEventListener('click', () => {
            this.saveLayout();
        });

        document.getElementById('load-layout').addEventListener('click', () => {
            this.loadLayout();
        });

        // View controls
        document.getElementById('top-view').addEventListener('click', () => {
            this.setView('top');
        });

        document.getElementById('side-view').addEventListener('click', () => {
            this.setView('side');
        });

        document.getElementById('front-view').addEventListener('click', () => {
            this.setView('front');
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            this.setView('reset');
        });

        // System checkboxes
        const systemCheckboxes = document.querySelectorAll('.system-item input[type="checkbox"]');
        systemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSystemsCount();
            });
        });

        // Listen for theme changes from UI toggle
        document.addEventListener('themechange', (e) => {
            const theme = e.detail && e.detail.theme ? e.detail.theme : this.getCurrentTheme();
            this.applyThemeToWorkspace(theme);
        });
    }

    setView(viewType) {
        const distance = 50;
        
        switch (viewType) {
            case 'top':
                this.camera.position.set(0, distance, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'side':
                this.camera.position.set(distance, 0, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'front':
                this.camera.position.set(0, 0, distance);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'reset':
                this.camera.position.set(30, 30, 30);
                this.camera.lookAt(0, 0, 0);
                break;
        }
    }

    saveLayout() {
        const layout = {
            shape: this.currentShape,
            radius: this.currentRadius,
            height: this.currentHeight,
            systems: this.getEnabledSystems(),
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(layout, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `space-habitat-layout-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    loadLayout() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const layout = JSON.parse(e.target.result);
                        this.loadLayoutData(layout);
                    } catch (error) {
                        alert('Error loading layout file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    loadLayoutData(layout) {
        // Update shape and dimensions
        document.getElementById('shape-type').value = layout.shape;
        document.getElementById('radius').value = layout.radius;
        document.getElementById('height').value = layout.height;
        document.getElementById('radius-value').textContent = layout.radius;
        document.getElementById('height-value').textContent = layout.height;
        
        this.currentShape = layout.shape;
        this.currentRadius = layout.radius;
        this.currentHeight = layout.height;
        
        // Update systems
        const systemIds = [
            'life-support', 'power', 'waste', 'thermal', 'communications',
            'medical', 'sleep', 'exercise', 'food', 'stowage'
        ];
        
        systemIds.forEach(id => {
            document.getElementById(id).checked = layout.systems.includes(id);
        });
        
        // Recreate habitat and layout
        this.createHabitat();
        this.autoLayout();
    }

    onWindowResize() {
        const canvas = document.getElementById('habitat-canvas');
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate habitat slowly
        this.habitatGroup.rotation.y += 0.005;
        
        // Update controls
        this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    getCurrentTheme() {
        const attr = document.documentElement.getAttribute('data-theme');
        return attr === 'dark' ? 'dark' : 'light';
    }

    applyThemeToWorkspace(theme) {
        // Palette mapped to themes
        const palettes = {
            dark: {
                background: 0x0b1220,
                grid1: 0x444444,
                grid2: 0x222222,
                accent: 0x00d4ff,
                ambientIntensity: 0.45,
                pointColor: 0x00d4ff
            },
            light: {
                background: 0xe9eef7,
                grid1: 0xbcc7dd,
                grid2: 0xd6deee,
                accent: 0x2563eb,
                ambientIntensity: 0.6,
                pointColor: 0x22d3ee
            }
        };

        const p = palettes[theme] || palettes.dark;

        if (this.scene) {
            this.scene.background = new THREE.Color(p.background);
        }
        if (this.gridHelper) {
            this.gridHelper.material.color = new THREE.Color(p.grid1);
            this.gridHelper.material.vertexColors = false;
            // Recreate grid with new colors to ensure both major/minor lines update
            this.addGrid();
        }
        if (this.ambientLight) this.ambientLight.intensity = p.ambientIntensity;
        if (this.pointLight) this.pointLight.color = new THREE.Color(p.pointColor);
        if (this.habitatMaterial) this.habitatMaterial.color = new THREE.Color(p.accent);
        if (this.wireframeMaterial) this.wireframeMaterial.color = new THREE.Color(p.accent);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Theme bootstrap
    const savedTheme = localStorage.getItem('shd-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    const setToggleLabel = (theme) => {
        if (!toggleBtn) return;
        if (theme === 'dark') {
            toggleBtn.textContent = '🌙 Dark';
        } else {
            toggleBtn.textContent = '☀️ Light';
        }
    };
    setToggleLabel(initialTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('shd-theme', next);
            setToggleLabel(next);
            document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
        });
    }

    new SpaceHabitatDesigner();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects for system items
    const systemItems = document.querySelectorAll('.system-item');
    systemItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.05)';
            item.style.transition = 'transform 0.2s ease';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'a':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('auto-layout').click();
                }
                break;
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('clear-layout').click();
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('save-layout').click();
                }
                break;
            case 'l':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('load-layout').click();
                }
                break;
        }
    });

    // Add tooltips
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        const shortcuts = {
            'auto-layout': 'Ctrl+A',
            'clear-layout': 'Ctrl+C',
            'save-layout': 'Ctrl+S',
            'load-layout': 'Ctrl+L'
        };
        
        const shortcut = shortcuts[button.id];
        if (shortcut) {
            button.title = `${button.textContent} (${shortcut})`;
        }
    });
});

