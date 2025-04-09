import * as THREE from 'three';

// Create craters with a faceted, low-poly look
export function createCraters(scene) {
  const craterGeometry = new THREE.IcosahedronGeometry(20, 1);
  craterGeometry.rotateX(Math.PI / 4);
  craterGeometry.scale(1, 0.2, 1);

  const craterMaterial = new THREE.MeshStandardMaterial({
    color: 0x6E260E, // Deep Mars red
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });

  const craters = [];

  for (let i = 0; i < 10; i++) {
    const crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(
      (Math.random() - 0.5) * 800,
      -15 - Math.random() * 5, // Varied depth
      (Math.random() - 0.5) * 800
    );
    const scale = 1 + Math.random() * 0.7;
    crater.scale.set(scale, 0.15 + Math.random() * 0.2, scale * (0.8 + Math.random() * 0.4));
    scene.add(crater);
    craters.push(crater);
  }

  return { craters };
}

// Create gold veins with a faceted, low-poly look
export function createGoldVeins(scene) {
  const veinGeometry = new THREE.ConeGeometry(2, 5, 4, 1);
  veinGeometry.rotateX(Math.PI);

  const veinMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFC600, // Gold color
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true,
  });

  const veins = [];

  for (let i = 0; i < 8; i++) {
    const vein = new THREE.Mesh(veinGeometry, veinMaterial);
    vein.position.set(
      (Math.random() - 0.5) * 600,
      2.5, // Slightly above ground
      (Math.random() - 0.5) * 600
    );
    const scale = 0.5 + Math.random() * 0.5;
    vein.scale.set(scale, scale, scale);
    vein.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    scene.add(vein);
    veins.push(vein);
  }

  return { veins };
}

// Create iron rocks with a faceted, low-poly look
export function createIronRocks(scene) {
  const rockGeometry = new THREE.OctahedronGeometry(4);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x8C4A2D, // Rusty iron color
    roughness: 0.8,
    metalness: 0.3,
    flatShading: true,
  });

  const rocks = [];

  for (let i = 0; i < 5; i++) {
    const clusterCenter = new THREE.Vector3(
      (Math.random() - 0.5) * 500,
      0, // On the ground
      (Math.random() - 0.5) * 500
    );

    for (let j = 0; j < 3; j++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        clusterCenter.x + (Math.random() - 0.5) * 10,
        0,
        clusterCenter.z + (Math.random() - 0.5) * 10
      );
      const scale = 0.5 + Math.random() * 0.5;
      rock.scale.set(scale, scale, scale);
      rock.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      scene.add(rock);
      rocks.push(rock);
    }
  }

  return { rocks };
}

// Create platinum clusters with a faceted, low-poly look
export function createPlatinumClusters(scene) {
  const clusterGeometry = new THREE.TetrahedronGeometry(5);
  const clusterMaterial = new THREE.MeshStandardMaterial({
    color: 0xE5E4E2, // Platinum color
    roughness: 0.4,
    metalness: 0.6,
    flatShading: true,
  });

  const clusters = [];

  for (let i = 0; i < 4; i++) {
    const cluster = new THREE.Mesh(clusterGeometry, clusterMaterial);
    cluster.position.set(
      (Math.random() - 0.5) * 600,
      2.5, // Slightly above ground
      (Math.random() - 0.5) * 600
    );
    const scale = 1 + Math.random();
    cluster.scale.set(scale, scale * (1.5 + Math.random()), scale);
    cluster.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    scene.add(cluster);
    clusters.push(cluster);
  }

  return { clusters };
}

// Create rocks with a faceted, low-poly look
export function createRocks(scene) {
  const rockGeometry = new THREE.DodecahedronGeometry(8, 0);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x7A4A2D, // Mars rock color
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });

  const rocks = [];

  for (let i = 0; i < 5; i++) {
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(
      (Math.random() - 0.5) * 500,
      0,
      (Math.random() - 0.5) * 500
    );
    const scale = 0.5 + Math.random() * 0.5;
    rock.scale.set(scale, scale, scale);
    rock.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    scene.add(rock);
    rocks.push(rock);
  }

  return { rocks };
}

// Convenience function to create the full terrain
export function createMartianTerrain(scene) {
  const { craters } = createCraters(scene);
  const { veins } = createGoldVeins(scene);
  const { rocks: ironRocks } = createIronRocks(scene);
  const { clusters } = createPlatinumClusters(scene);
  const { rocks } = createRocks(scene);

  return { craters, veins, ironRocks, clusters, rocks };
}