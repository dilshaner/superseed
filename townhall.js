import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export default class TownHall {
    constructor() {
        // Enable shadows for all materials
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x6B7280 }); // Cool gray
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xEF4444 }); // Red
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x9CA3AF }); // Light gray
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xF87171 }); // Lighter red
        const detailMaterial = new THREE.MeshPhongMaterial({ color: 0x4B5563 }); // Dark gray
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0xE5E7EB }); // Off-white
        const debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x374151 }); // Darker gray

        // Main body (higher vertex count)
        const bodyGeometry = new THREE.CylinderGeometry(2, 2, 10, 12); // Increased segments from 3 to 12
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 5, 0);
        this.body.rotation.x = Math.PI / 2;
        this.body.castShadow = true;
        this.body.receiveShadow = true;

        // Dent on body (more detailed)
        const dentGeometry = new THREE.SphereGeometry(1, 8, 8); // Increased from 4,4 to 8,8
        this.dent = new THREE.Mesh(dentGeometry, detailMaterial);
        this.dent.position.set(0, 0.5, 2);
        this.dent.scale.set(1, 0.3, 1);
        this.body.add(this.dent);

        // Body panel (larger, more vertices)
        const panelGeometry = new THREE.BufferGeometry();
        const panelVertices = new Float32Array([
            -1.5, 0.8, -3,  // Bottom left
            1.5, 0.8, -3,   // Bottom right
            0, 1.5, -2,     // Top
            -0.5, 1, -2.5   // Extra point for more detail
        ]);
        const panelIndices = [0, 1, 2, 0, 2, 3]; // Two triangles
        panelGeometry.setAttribute('position', new THREE.BufferAttribute(panelVertices, 3));
        panelGeometry.setIndex(panelIndices);
        this.bodyPanel = new THREE.Mesh(panelGeometry, detailMaterial);
        this.body.add(this.bodyPanel);

        // Nose (higher detail)
        const noseGeometry = new THREE.ConeGeometry(2, 4, 12); // Increased from 3 to 12
        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, 5, -7);
        this.nose.rotation.x = Math.PI / 2;
        this.nose.castShadow = true;

        const noseSpikeGeometry = new THREE.ConeGeometry(0.3, 1, 6); // Increased from 3 to 6
        this.noseSpike = new THREE.Mesh(noseSpikeGeometry, detailMaterial);
        this.noseSpike.position.set(0, 2, 0);
        this.nose.add(this.noseSpike);

        const crackGeometry = new THREE.TetrahedronGeometry(0.5, 2); // Higher detail (2 subdivisions)
        this.noseCrack = new THREE.Mesh(crackGeometry, detailMaterial);
        this.noseCrack.position.set(1, 0.5, 1);
        this.noseCrack.rotation.set(Math.PI / 4, 0, 0);
        this.nose.add(this.noseCrack);

        // Wings (more detailed)
        const wingGeometry = new THREE.BoxGeometry(8, 0.5, 2, 4, 1, 4); // Added segments
        this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.leftWing.position.set(-5, 5, 0);
        this.leftWing.castShadow = true;
        this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.rightWing.position.set(5, 5, 0);
        this.rightWing.castShadow = true;

        const notchGeometry = new THREE.BoxGeometry(1, 0.4, 0.5, 2, 1, 2);
        this.leftNotch = new THREE.Mesh(notchGeometry, detailMaterial);
        this.leftNotch.position.set(-3, 0, 0.5);
        this.leftWing.add(this.leftNotch);

        const rivetGeometry = new THREE.TetrahedronGeometry(0.2, 1); // Higher detail
        this.wingRivet = new THREE.Mesh(rivetGeometry, detailMaterial);
        this.wingRivet.position.set(2, 0.2, 0);
        this.rightWing.add(this.wingRivet);

        // Tail fin (more detailed)
        const tailGeometry = new THREE.BoxGeometry(0.3, 4, 2, 1, 4, 4);
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.set(0, 7, 5);
        this.tail.castShadow = true;

        const tailExtraGeometry = new THREE.BoxGeometry(0.2, 2, 1, 1, 2, 2);
        this.tailExtra = new THREE.Mesh(tailExtraGeometry, tailMaterial);
        this.tailExtra.position.set(0.3, -1, 0);
        this.tailExtra.rotation.z = Math.PI / 6;
        this.tail.add(this.tailExtra);

        const ridgeGeometry = new THREE.BufferGeometry();
        const ridgeVertices = new Float32Array([
            0, 2, 0,
            0.2, 2, 0,
            0.1, 3, 0,
            0.1, 2.5, 0.2 // Extra vertex for detail
        ]);
        const ridgeIndices = [0, 1, 2, 0, 2, 3];
        ridgeGeometry.setAttribute('position', new THREE.BufferAttribute(ridgeVertices, 3));
        ridgeGeometry.setIndex(ridgeIndices);
        this.tailRidge = new THREE.Mesh(ridgeGeometry, detailMaterial);
        this.tail.add(this.tailRidge);

        // Landing gear (more detailed)
        const gearGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8); // Increased from 3 to 8
        this.leftGear = new THREE.Mesh(gearGeometry, bodyMaterial);
        this.leftGear.position.set(-2, 1, -3);
        this.leftGear.castShadow = true;
        this.rightGear = new THREE.Mesh(gearGeometry, bodyMaterial);
        this.rightGear.position.set(2, 1, -3);
        this.rightGear.castShadow = true;

        const supportGeometry = new THREE.BoxGeometry(0.2, 1, 0.2, 2, 2, 2);
        this.gearSupport = new THREE.Mesh(supportGeometry, detailMaterial);
        this.gearSupport.position.set(-2, 1.5, -3);
        this.gearSupport.rotation.z = Math.PI / 6;

        // Debris (more detailed)
        const debrisGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8, 2, 2, 2);
        this.debris = [];
        for (let i = 0; i < 5; i++) {
            const debrisPiece = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debrisPiece.position.set(
                (Math.random() - 0.5) * 8,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 8
            );
            debrisPiece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            debrisPiece.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);
            debrisPiece.castShadow = true;
            this.debris.push(debrisPiece);
        }

        // SpaceX text 
        const fontLoader = new FontLoader();
        fontLoader.load(
            '/Assets/fonts/helvetiker.json',
            (font) => {
                const textGeometry = new TextGeometry('SPACE X', {
                    font: font,
                    size: 1,
                    height: 0.01,       // Increased from 0.05 for more depth
                
                });
                this.logoText = new THREE.Mesh(textGeometry, textMaterial);
                this.logoText.position.set(-1, -4, -2);
                this.logoText.scale.x = 1;
                this.logoText.scale.y = -1;
                this.logoText.rotation.y = Math.PI / 180;
                this.logoText.rotation.z = Math.PI / 2;
                this.logoText.castShadow = true;
                this.body.add(this.logoText);
            },
            undefined,
            (error) => {
                console.error('Error loading font:', error);
            }
        );

        // Group all elements
        this.mesh = new THREE.Group();
        this.mesh.add(this.body);
        this.mesh.add(this.nose);
        this.mesh.add(this.leftWing);
        this.mesh.add(this.rightWing);
        this.mesh.add(this.tail);
        this.mesh.add(this.leftGear);
        this.mesh.add(this.rightGear);
        this.mesh.add(this.gearSupport);
        this.debris.forEach(debrisPiece => this.mesh.add(debrisPiece));

        // Position the crashed shuttle
        this.mesh.position.set(10, 0, 0);
        this.mesh.rotation.y = Math.PI / 4;
        this.mesh.name = 'townHall';
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
}