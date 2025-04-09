// rovers.js
import * as THREE from 'three';

class Rover {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), socket, username, resourceType) {
        this.scene = scene;
        this.socket = socket;
        this.username = username;
        this.resourceType = resourceType;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.belts = [];
        this.beltTextures = [0, 0];
        this.userData = {
            speed: 0.05 + Math.random() * 0.1, // Random speed between 0.05 and 0.15
            miningPosition: new THREE.Vector3(
                (Math.random() - 0.5) * 300, // Increased range to ±100 for more spread
                0,
                (Math.random() - 0.5) * 300
            ),
            targetPosition: null,
            stopDuration: 0,
            initialDelay: Math.random() * 120, // Random initial delay between 0 and 2 seconds (0–120 frames at 60 FPS)
            maxTurnRate: 0.03,
            currentAction: 'stop', // Start in stop state to apply initial delay
            isMining: Math.random() > 0.5,
            velocity: new THREE.Vector3(),
            wheelBase: 2.0,
            trackWidth: 1.5,
            leftBeltSpeed: 0,
            rightBeltSpeed: 0,
            beltHeight: 0.4,
            maxSpeedDifference: 0.02,
            minTurnRadius: 2.0,
            decelerationDistance: 2.0,
            minedResources: 0,
            miningRate: 5 + Math.random() * 3, // Random mining rate between 0.5 and 3.5 resources per second
            miningTimer: 0,
            maxCapacity: Math.floor(Math.random() * 90) + 1, // Random capacity between 1 and 9
        };
        this.path = [];
        this.currentWaypointIndex = 0;
        this.createRover();
        this.scene.add(this.group);
        this.updatePath();
    }

    createRover() {
        // Main body with angled front for realism
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 1.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555,
            flatShading: true // Gives low-poly look
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        
        // Camera/sensor mast
        const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-0.8, 0.75, 0);
        mast.rotation.z = Math.PI / 8;
        
        // Camera/sensor head
        const cameraGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.15);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0.25, 0);
        mast.add(camera);
        
        body.add(mast);
        this.group.add(body);
    
        // Track system with more detail
        const beltGeometry = new THREE.BoxGeometry(2.2, 0.3, 0.6);
        const beltMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            flatShading: true
        });
        
        // Left track with wheels
        const leftBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        leftBelt.position.set(0, -0.35, -this.userData.trackWidth / 2);
        
        // Add wheels to track
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        for (let i = -1; i <= 1; i += 0.5) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.35, -this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(leftBelt);
        this.belts.push(leftBelt);
    
        // Right track with wheels
        const rightBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        rightBelt.position.set(0, -0.35, this.userData.trackWidth / 2);
        
        // Add wheels to right track
        for (let i = -1; i <= 1; i += 0.5) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.35, this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(rightBelt);
        this.belts.push(rightBelt);
    
        // Solar panel
        const panelGeometry = new THREE.BoxGeometry(1.5, 0.02, 1);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x336699,
            emissive: 0x113355,
            emissiveIntensity: 0.2
        });
        const solarPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarPanel.position.set(-0.5, 0.6, 0);
        body.add(solarPanel);
    }

    updatePath() {
        this.path = [];
        const start = this.group.position.clone();
        const end = this.userData.isMining 
            ? this.userData.miningPosition.clone()
            : new THREE.Vector3(0, 0, 0);
        
        this.path.push(start);
        this.path.push(end);
        this.currentWaypointIndex = 0;
        this.userData.targetPosition = this.path[1].clone();
    }

    update(delta) {
        const { speed, stopDuration } = this.userData;

        if (this.path.length === 0 || this.currentWaypointIndex >= this.path.length) {
            this.updatePath();
            return;
        }

        switch (this.userData.currentAction) {
            case 'idle':
                this.idleBehavior();
                break;
            case 'move':
                this.moveAlongPath(speed);
                break;
            case 'turn':
                this.turnTowardsWaypoint();
                break;
            case 'stop':
                this.stop(delta, stopDuration);
                break;
            default:
                this.userData.currentAction = 'idle';
        }

        this.updateBelts(delta);
    }

    idleBehavior() {
        this.updatePath();
        this.userData.currentAction = 'move';
        this.userData.leftBeltSpeed = 0;
        this.userData.rightBeltSpeed = 0;
    }

    turnTowardsWaypoint() {
        const targetPos = this.path[this.currentWaypointIndex];
        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.group.position)
            .normalize();

        const currentForward = new THREE.Vector3(
            Math.cos(this.group.rotation.y),
            0,
            Math.sin(this.group.rotation.y)
        );
        
        const dot = currentForward.dot(direction);
        const angleDiff = Math.acos(Math.max(-1, Math.min(1, dot)));

        if (angleDiff > 0.05) {
            const cross = currentForward.cross(direction).y;
            const turnDirection = Math.sign(cross);
            const turnRate = Math.min(this.userData.maxTurnRate, angleDiff * 0.1) * turnDirection;

            const baseSpeed = this.userData.speed * Math.max(0.3, dot);
            const speedDiff = Math.min(
                this.userData.maxSpeedDifference,
                Math.abs(turnRate) * this.userData.trackWidth
            );

            this.userData.leftBeltSpeed = baseSpeed + (turnRate > 0 ? speedDiff : -speedDiff);
            this.userData.rightBeltSpeed = baseSpeed + (turnRate < 0 ? speedDiff : -speedDiff);

            const rotationDelta = (this.userData.rightBeltSpeed - this.userData.leftBeltSpeed) / 
                this.userData.trackWidth;
            this.group.rotation.y += Math.min(
                Math.max(rotationDelta, -this.userData.maxTurnRate),
                this.userData.maxTurnRate
            );

            const forward = currentForward.lerp(direction, 0.1);
            this.group.position.add(forward.multiplyScalar(baseSpeed));
        } else {
            this.userData.currentAction = 'move';
            this.userData.leftBeltSpeed = this.userData.speed;
            this.userData.rightBeltSpeed = this.userData.speed;
        }
    }

    moveAlongPath(speed) {
        const targetPos = this.path[this.currentWaypointIndex];
        const distance = this.group.position.distanceTo(targetPos);
        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.group.position)
            .normalize();
    
        const currentForward = new THREE.Vector3(
            Math.cos(this.group.rotation.y),
            0,
            Math.sin(this.group.rotation.y)
        );
    
        const effectiveSpeed = distance < this.userData.decelerationDistance 
            ? speed * (distance / this.userData.decelerationDistance)
            : speed;
    
        this.userData.leftBeltSpeed = effectiveSpeed;
        this.userData.rightBeltSpeed = effectiveSpeed;
    
        this.group.position.add(currentForward.multiplyScalar(effectiveSpeed));
    
        if (distance < 0.5) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.path.length) {
                // Reached destination
                this.userData.currentAction = 'stop';
                this.userData.stopDuration = 60 + Math.floor(Math.random() * 180);
                
                // Immediately update path for next destination
                if (this.userData.isMining) {
                    // Just finished mining, set target to base
                    this.userData.isMining = false;
                } else {
                    // Just arrived at base, set new mining target
                    this.unloadResources();
                    this.userData.isMining = true;
                    this.userData.miningPosition.set(
                        (Math.random() - 0.5) * 100,
                        0,
                        (Math.random() - 0.5) * 100
                    );
                }
                this.updatePath();
            } else {
                this.userData.currentAction = 'turn';
            }
        } else if (currentForward.dot(direction) < 0.98) {
            this.userData.currentAction = 'turn';
        }
    }
    
    stop(delta, stopDuration) {
        this.userData.leftBeltSpeed = 0;
        this.userData.rightBeltSpeed = 0;
    
        if (this.userData.initialDelay > 0) {
            this.userData.initialDelay--;
            return;
        }
    
        if (this.userData.isMining) {
            this.userData.miningTimer += delta;
            this.userData.minedResources += this.userData.miningRate * delta;
    
            if (this.userData.minedResources >= this.userData.maxCapacity) {
                this.userData.currentAction = 'idle'; // Will trigger movement
            }
        }
    
        if (this.userData.stopDuration > 0) {
            this.userData.stopDuration--;
            if (this.userData.stopDuration <= 0) {
                this.userData.currentAction = 'idle'; // Will trigger movement
            }
        }
    }

    unloadResources() {
        if (this.userData.minedResources > 0) {
            const amount = Math.min(Math.floor(this.userData.minedResources), this.userData.maxCapacity); // Ensure amount is an integer and capped
            this.socket.emit('mineResource', {
                username: this.username,
                resourceType: this.resourceType,
                amount: amount,
            });
            this.userData.minedResources = 0;
            this.userData.miningTimer = 0;
        }
    }

    updateBelts(delta) {
        this.beltTextures[0] += this.userData.leftBeltSpeed * 0.1;
        this.beltTextures[1] += this.userData.rightBeltSpeed * 0.1;
        this.beltTextures[0] %= 1.0;
        this.beltTextures[1] %= 1.0;
    }
}

// Gold Mining Rover Class
export class GoldMiningRover extends Rover {
    constructor(scene, position, socket, username) {
        super(scene, position, socket, username, 'gold');
    }

    createRover() {
        // Main body with gold accents
        const bodyGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.2); // Smaller for agility
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333, // Dark body for contrast
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        
        // Reinforced mast with gold sensor
        const mastGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-0.6, 0.6, 0);
        mast.rotation.z = Math.PI / 8;
        
        // Gold-coated camera
        const cameraGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.1);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0.2, 0);
        mast.add(camera);
        body.add(mast);
        this.group.add(body);
    
        // Heavy-duty tracks (shorter/wider for stability)
        const beltGeometry = new THREE.BoxGeometry(2.0, 0.25, 0.5);
        const beltMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            flatShading: true
        });
        
        // Left track with gold-trimmed wheels
        const leftBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        leftBelt.position.set(0, -0.3, -this.userData.trackWidth / 2);
        
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700, // Gold wheels
            emissive: 0x886600,
            emissiveIntensity: 0.1
        });
        
        for (let i = -0.8; i <= 0.8; i += 0.4) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.3, -this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(leftBelt);
        this.belts.push(leftBelt);
    
        // Right track (same as left)
        const rightBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        rightBelt.position.set(0, -0.3, this.userData.trackWidth / 2);
        
        for (let i = -0.8; i <= 0.8; i += 0.4) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.3, this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(rightBelt);
        this.belts.push(rightBelt);
    
        // Solar panel with gold framing
        const panelGeometry = new THREE.BoxGeometry(1.2, 0.02, 0.8);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x003366,
            emissive: 0x001133,
            emissiveIntensity: 0.2
        });
        const solarPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarPanel.position.set(-0.4, 0.5, 0);
        body.add(solarPanel);
    }
}

// Platinum Mining Rover Class
export class PlatinumMiningRover extends Rover {
    constructor(scene, position, socket, username) {
        super(scene, position, socket, username, 'platinum');
    }

    createRover() {
        // Sleek metallic body
        const bodyGeometry = new THREE.BoxGeometry(2.7, 0.9, 1.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xE5E4E2, // Platinum color
            specular: 0xFFFFFF,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        
        // High-tech sensor mast
        const mastGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-0.7, 0.7, 0);
        mast.rotation.z = Math.PI / 8;
        
        // Laser sensor (blue accent)
        const cameraGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.12);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x0099FF });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0.3, 0);
        mast.add(camera);
        body.add(mast);
        this.group.add(body);
    
        // Lightweight tracks
        const beltGeometry = new THREE.BoxGeometry(2.1, 0.2, 0.55);
        const beltMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555,
            specular: 0x888888
        });
        
        // Left track with blue-accent wheels
        const leftBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        leftBelt.position.set(0, -0.35, -this.userData.trackWidth / 2);
        
        const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.09, 12); // More sides for smoothness
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xE5E4E2,
            specular: 0xFFFFFF
        });
        
        for (let i = -0.9; i <= 0.9; i += 0.45) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.35, -this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(leftBelt);
        this.belts.push(leftBelt);
    
        // Right track
        const rightBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        rightBelt.position.set(0, -0.35, this.userData.trackWidth / 2);
        
        for (let i = -0.9; i <= 0.9; i += 0.45) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.35, this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(rightBelt);
        this.belts.push(rightBelt);
    
        // Advanced solar panel (blue cells)
        const panelGeometry = new THREE.BoxGeometry(1.3, 0.02, 0.9);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x002244,
            emissive: 0x001133,
            emissiveIntensity: 0.3
        });
        const solarPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarPanel.position.set(-0.5, 0.55, 0);
        body.add(solarPanel);
    }
}

// Iron Mining Rover Class
export class IronMiningRover extends Rover {
    constructor(scene, position, socket, username) {
        super(scene, position, socket, username, 'iron');
    }

    createRover() {
        // Rust-resistant iron body
        const bodyGeometry = new THREE.BoxGeometry(3.0, 1.0, 1.6); // Larger for heavy ore
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x6A5ACD, // Iron-blue tint
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        
        // Short, sturdy mast
        const mastGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-1.0, 0.8, 0);
        mast.rotation.z = Math.PI / 10;
        
        // Thermal camera (red-hot iron detection)
        const cameraGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.2);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0xFF3300 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0.25, 0);
        mast.add(camera);
        body.add(mast);
        this.group.add(body);
    
        // Heavy-gauge tracks
        const beltGeometry = new THREE.BoxGeometry(2.5, 0.35, 0.7);
        const beltMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            flatShading: true
        });
        
        // Left track with thick wheels
        const leftBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        leftBelt.position.set(0, -0.4, -this.userData.trackWidth / 2);
        
        const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.12, 8);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        for (let i = -1.1; i <= 1.1; i += 0.55) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.4, -this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(leftBelt);
        this.belts.push(leftBelt);
    
        // Right track
        const rightBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        rightBelt.position.set(0, -0.4, this.userData.trackWidth / 2);
        
        for (let i = -1.1; i <= 1.1; i += 0.55) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(i, -0.4, this.userData.trackWidth / 2);
            wheel.rotation.z = Math.PI / 2;
            this.group.add(wheel);
        }
        
        this.group.add(rightBelt);
        this.belts.push(rightBelt);
    
        // Industrial solar panel (dust-resistant)
        const panelGeometry = new THREE.BoxGeometry(1.8, 0.03, 1.2);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1A1A1A,
            emissive: 0x000000,
            emissiveIntensity: 0.1
        });
        const solarPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarPanel.position.set(-0.7, 0.7, 0);
        body.add(solarPanel);
    }
}

export function initializeRovers(scene, socket, username, options = {}) {
    const rovers = [];
    const {
      goldrovers_amount = 1,  // Default to 0 if not provided
      platinumrovers_amount = 1,
      ironrovers_amount = 1,
      position = null
    } = options;
  
    const getPosition = () => {
      if (position) {
        return new THREE.Vector3(position.x, position.y, position.z);
      }
      return new THREE.Vector3(
        (Math.random() - 0.5) * 300,
        0,
        (Math.random() - 0.5) * 300
      );
    };
  
    for (let i = 0; i < goldrovers_amount; i++) {
      rovers.push(new GoldMiningRover(scene, getPosition(), socket, username));
    }
  
    for (let i = 0; i < platinumrovers_amount; i++) {
      rovers.push(new PlatinumMiningRover(scene, getPosition(), socket, username));
    }
  
    for (let i = 0; i < ironrovers_amount; i++) {
      rovers.push(new IronMiningRover(scene, getPosition(), socket, username));
    }
  
    console.log(`Initialized ${rovers.length} rovers (Gold: ${goldrovers_amount}, Platinum: ${platinumrovers_amount}, Iron: ${ironrovers_amount})`);
    return rovers;
  }