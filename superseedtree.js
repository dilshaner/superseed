// superseedtree.js
import * as THREE from 'three';

export function createLowPolyGoldenTree(x, z) {
    const group = new THREE.Group();

    // Trunk: Faceted, tapered cylinder with 10 sides
    const trunkHeight = 15;
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 2, trunkHeight, 10);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
    });

    // Create gradient colors for the trunk
    const trunkPositionAttribute = trunkGeometry.getAttribute('position');
    const trunkColors = [];
    for (let i = 0; i < trunkPositionAttribute.count; i++) {
        const y = trunkPositionAttribute.getY(i);
        const color = new THREE.Color();
        color.lerpColors(new THREE.Color(0x8b4513), new THREE.Color(0xd2b48c), (y + trunkHeight / 2) / trunkHeight);
        trunkColors.push(color.r, color.g, color.b);
    }
    trunkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(trunkColors, 3));

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, trunkHeight / 2, 0);
    trunk.castShadow = true; // Enable shadows
    group.add(trunk);

    // Add faceted roots at the base of the trunk
    const rootCount = 5;
    const rootGeometry = new THREE.CylinderGeometry(0.2, 0.5, 2, 6);
    const rootMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        flatShading: true,
    });
    for (let i = 0; i < rootCount; i++) {
        const angle = (i / rootCount) * Math.PI * 2;
        const root = new THREE.Mesh(rootGeometry, rootMaterial);
        root.position.set(Math.cos(angle) * 1.5, 1, Math.sin(angle) * 1.5);
        root.rotation.z = angle + Math.PI / 4;
        root.castShadow = true;
        group.add(root);
    }

    // Add angular protrusions at varying heights along the trunk
    const protrusionGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 5);
    const protrusionMaterial = new THREE.MeshStandardMaterial({
        color: 0xd2b48c,
        flatShading: true,
    });
    const protrusionCount = 10;
    for (let i = 0; i < protrusionCount; i++) {
        const angle = (i / protrusionCount) * Math.PI * 2;
        const protrusion = new THREE.Mesh(protrusionGeometry, protrusionMaterial);
        const height = 4 + Math.random() * 8;
        const radius = 0.5 + (height / trunkHeight) * 0.5;
        protrusion.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        protrusion.rotation.z = angle + Math.PI / 4;
        protrusion.castShadow = true;
        group.add(protrusion);
    }

    // Canopy: Multiple faceted clusters with sub-clusters
    const clusterCount = 30;
    const canopyMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
    });
    for (let i = 0; i < clusterCount; i++) {
        const clusterSize = 0.8 + Math.random() * 1.2;
        const clusterGeometry =
            i % 2 === 0 ? new THREE.IcosahedronGeometry(clusterSize, 0) : new THREE.DodecahedronGeometry(clusterSize, 0);
        const positionAttribute = clusterGeometry.getAttribute('position');
        const colors = [];
        for (let j = 0; j < positionAttribute.count; j++) {
            const y = positionAttribute.getY(j);
            const color = new THREE.Color();
            color.lerpColors(new THREE.Color(0xdaa520), new THREE.Color(0xffd700), (y + clusterSize) / (2 * clusterSize));
            colors.push(color.r, color.g, color.b);
        }
        clusterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const cluster = new THREE.Mesh(clusterGeometry, canopyMaterial);
        const angle = (i / clusterCount) * Math.PI * 2;
        const radius = 2 + Math.random() * 2;
        const height = trunkHeight + (Math.random() - 0.5) * 3;
        cluster.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        cluster.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        cluster.castShadow = true;
        group.add(cluster);

        if (Math.random() > 0.5) {
            const subClusterSize = clusterSize * 0.5;
            const subClusterGeometry = new THREE.IcosahedronGeometry(subClusterSize, 0);
            subClusterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            const subCluster = new THREE.Mesh(subClusterGeometry, canopyMaterial);
            subCluster.position.set(
                Math.cos(angle + Math.PI / 4) * clusterSize,
                clusterSize,
                Math.sin(angle + Math.PI / 4) * clusterSize
            );
            subCluster.castShadow = true;
            cluster.add(subCluster);
        }
    }

    // Add faceted cyan fruits to the canopy
    const fruitGeometry = new THREE.IcosahedronGeometry(0.2, 0);
    const fruitMaterial = new THREE.MeshStandardMaterial({
        color: 0x90d3c5,
        emissive: 0x90d3c5,
        emissiveIntensity: 0.5,
        flatShading: true,
    });
    const fruitCount = 24;
    for (let i = 0; i < fruitCount; i++) {
        const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
        const angle = (i / fruitCount) * Math.PI * 2;
        const radius = 2 + Math.random() * 2;
        const height = trunkHeight + (Math.random() - 0.5) * 3;
        fruit.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        fruit.castShadow = true;

        const fruitLight = new THREE.PointLight(0x90d3c5, 1, 3);
        fruitLight.position.copy(fruit.position);
        fruitLight.castShadow = true;
        group.add(fruitLight);
        group.add(fruit);

        if (Math.random() > 0.5) {
            const smallFruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), fruitMaterial);
            smallFruit.position.set(
                fruit.position.x + (Math.random() - 0.5) * 0.5,
                fruit.position.y + (Math.random() - 0.5) * 0.5,
                fruit.position.z + (Math.random() - 0.5) * 0.5
            );
            smallFruit.castShadow = true;
            group.add(smallFruit);
        }
    }

    // Add golden coins floating around the tree
    const coinCount = 50;
    const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1,
        flatShading: true,
        metalness: 0.8,
        roughness: 0.2,
    });
    for (let i = 0; i < coinCount; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        const x = (Math.random() - 0.5) * 12;
        const y = Math.random() * 18;
        const z = (Math.random() - 0.5) * 12;
        coin.position.set(x, y, z);
        const scale = 0.5 + Math.random() * 0.5;
        coin.scale.set(scale, scale, scale);
        coin.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        coin.castShadow = true;
        group.add(coin);
    }

    group.position.set(x, 0, z);
    return group;
}