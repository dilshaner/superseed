// meteoroids.js

import * as THREE from 'three';

export function createMeteoroid(scene) {
    const geometry = new THREE.ConeGeometry(1, 5, 4); // Low-poly cone shape
    const material = new THREE.MeshStandardMaterial({
        color: 0xFF4500, // Orange-red color for meteoroids
        emissive: 0xFF4500, // Add a subtle glow
        transparent: true,
        opacity: 0.9,
    });
    const meteoroid = new THREE.Mesh(geometry, material);

    // Randomize starting position (off-screen)
    meteoroid.position.set(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000 + 500, // Start above the scene
        (Math.random() - 0.5) * 1000
    );

    // Randomize scale and rotation
    meteoroid.scale.set(0.5, 0.5, 0.5);
    meteoroid.rotation.x = Math.random() * Math.PI * 2;
    meteoroid.rotation.y = Math.random() * Math.PI * 2;

    return meteoroid;
}

export function animateMeteoroid(scene, meteoroid) {
    const speed = 5 + Math.random() * 5; // Random speed
    const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -1, // Move downward
        (Math.random() - 0.5) * 2
    ).normalize();

    // Define the animation function
    function animate() {
        meteoroid.position.addScaledVector(direction, speed);

        // Remove meteoroid if it goes out of bounds
        if (meteoroid.position.y < -500) {
            scene.remove(meteoroid);
            return; // Stop the animation
        }

        // Continue the animation
        requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
}

export function spawnMeteoroids(scene) {
    const count = Math.floor(Math.random() * 50) + 1; // Random number of meteoroids (1 to 5)
    for (let i = 0; i < count; i++) {
        const meteoroid = createMeteoroid(scene);
        scene.add(meteoroid);
        animateMeteoroid(scene, meteoroid); // Start animating this meteoroid
    }

    // Schedule next meteoroid rain
    setTimeout(() => spawnMeteoroids(scene), Math.random() * 5000 + 2000); // Random interval (2 to 7 seconds)
}