// marsEnvironment.js

import * as THREE from 'three';

export function createGround(scene) {
    // Infinite Floor with Mars Surface---------Start------
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 200, 200); // Increase segments for more detail
    groundGeometry.rotateX(-Math.PI / 2); // Rotate to lay flat

    // Apply random height variations and angular displacement for Mars terrain
    const positionAttribute = groundGeometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);
        const newY = Math.floor((y + Math.random() * 2 - 1) * 5) / 5; // Snap to discrete heights for angular look
        positionAttribute.setY(i, newY);
    }
    groundGeometry.computeVertexNormals();

    // Material with gradient color for Mars-like visual interest
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xd2691e, // Base Mars red-orange
        roughness: 1.0,
        metalness: 0.0,
        flatShading: true, // Keep flat shading for polygonal effect
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = 0;
    scene.add(ground);
}

export function createOrbitObject(scene, x, z) {
    const orbitGeometry = new THREE.OctahedronGeometry(Math.random() * 0.5 + 0.3, 0); // Low-poly geometric shape
    const orbitMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080, // Gray metallic-like color for unidentified objects
        roughness: 0.5,
        metalness: 0.8, // Slightly metallic for an alien look
        flatShading: true, // Enable flat shading for a polygonal look
    });
    const orbitObject = new THREE.Mesh(orbitGeometry, orbitMaterial);

    orbitObject.position.set(x, 0.5 + Math.random() * 0.5, z); // Slightly above ground with random height
    orbitObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    scene.add(orbitObject);
}

export function generateOrbitObjects(scene, count = 1000) {
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 600; // Spread within a 1000x1000 area
        const z = (Math.random() - 0.5) * 600;
        createOrbitObject(scene, x, z);
    }
}

export function createRockFormation(scene, x, z) {
    const group = new THREE.Group();

    // Randomize rock formation size
    const scale = 0.8 + Math.random() * 1.2; // Scale between 0.8 (small) and 2.0 (large)
    group.scale.set(scale, scale, scale);

    // Rock Geometry: Combine multiple IcosahedronGeometries for complexity
    const numRocks = 2 + Math.floor(Math.random() * 3); // 2 to 4 rocks per formation
    for (let i = 0; i < numRocks; i++) {
        const rockSize = 0.5 + Math.random() * 1.5; // Size between 0.5 and 2.0
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 0); // Low-poly rock
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Brown for rocks
            roughness: 1.0,
            metalness: 0.0,
            flatShading: true,
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Randomize position within the group
        rock.position.set(
            (Math.random() - 0.5) * 3, // Spread horizontally
            (Math.random() - 0.5) * 3, // Spread vertically
            (Math.random() - 0.5) * 3  // Spread depth-wise
        );
        group.add(rock);
    }

    // Set overall position
    group.position.set(x, 0, z);
    scene.add(group);
}

export function scatterRockFormations(scene, count = 300) {
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 500; // Random x position
        const z = (Math.random() - 0.5) * 500; // Random z position
        createRockFormation(scene, x, z);
    }
}