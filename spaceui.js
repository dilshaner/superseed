import * as THREE from 'three';

export function createSpaceUI(scene) {
    // Sky background
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x000033, // Deep space blue
        side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Add low-poly stars
    const starGeometry = new THREE.IcosahedronGeometry(1, 0); // Low-poly star shape
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White stars
    for (let i = 0; i < 10000; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 300
        );
        star.scale.set(0.1, 0.1, 0.1); // Small size for stars
        scene.add(star);
    }

    // Add a glowing low-poly sun
    const sunGeometry = new THREE.IcosahedronGeometry(20, 1); // Low-poly sun
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700, // Golden yellow
        emissive: 0xFFD700, // Glow effect
        transparent: true,
        opacity: 0.9,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 50, -200); // Position the sun
    scene.add(sun);

    // Add orbital rings (low-poly style)
    const ringGeometry = new THREE.RingGeometry(50, 55, 6); // Low-poly ring
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x40C4FF, // Cyan color
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.position.set(100, 50, -200); // Position the ring around the sun
    ring1.rotation.x = Math.PI / 2; // Rotate to align horizontally
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring2.position.set(100, 50, -200);
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.z = Math.PI / 4; // Tilt the second ring
    scene.add(ring2);

    // Add a low-poly planet
    const planetGeometry = new THREE.IcosahedronGeometry(10, 1); // Low-poly planet
    const planetMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50, // Green planet
        emissive: 0x4CAF50, // Subtle glow
        transparent: true,
        opacity: 0.9,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(150, 50, -250); // Position the planet
    scene.add(planet);

    // Add an orbital ring for the planet
    const planetRing = new THREE.Mesh(ringGeometry, ringMaterial);
    planetRing.position.set(150, 50, -250);
    planetRing.rotation.x = Math.PI / 2;
    scene.add(planetRing);
}