import * as THREE from 'three';

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x38bdf8); scene.fog = new THREE.FogExp2(0x38bdf8, 0.015);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight); renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xfef08a, 1.2); sunLight.position.set(50, 100, 50); sunLight.castShadow = true; scene.add(sunLight);

const terrainSize = 500; const gridHelper = new THREE.GridHelper(terrainSize, 100, 0x1e293b, 0x475569); gridHelper.position.y = -0.01; scene.add(gridHelper);
const floorGeo = new THREE.PlaneGeometry(terrainSize, terrainSize); const floorMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
const floor = new THREE.Mesh(floorGeo, floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

const carGroup = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.5 });
const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 4.0), bodyMat); chassisMesh.position.y = 0.5; chassisMesh.castShadow = true; carGroup.add(chassisMesh);
const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 2.0), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 })); cabinMesh.position.set(0, 1.1, -0.2); cabinMesh.castShadow = true; carGroup.add(cabinMesh);

const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16); const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
const wheels: THREE.Mesh[] = []; const wheelPositions = [[-0.9, 0.4, 1.3], [0.9, 0.4, 1.3], [-0.9, 0.4, -1.3], [0.9, 0.4, -1.3]];
wheelPositions.forEach((pos) => {
    const wMesh = new THREE.Mesh(wheelGeo, wheelMat); wMesh.rotation.z = Math.PI / 2; wMesh.position.set(pos[0], pos[1], pos[2]); wMesh.castShadow = true;
    carGroup.add(wMesh); wheels.push(wMesh);
});
scene.add(carGroup); carGroup.position.set(0, 0, 0);

let speed = 0; let angle = 0; let steerAngle = 0;
const physics = { maxSpeed: 45, acceleration: 18, friction: 5, brakeForce: 35, maxSteer: 0.6, steerSpeed: 3, weightLean: 0.08 };
const keys: { [key: string]: boolean } = { w: false, a: false, s: false, d: false, ' ': false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };

window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (k in keys) keys[k] = true; });
window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (k in keys) keys[k] = false; });

const uiSpeed = document.getElementById('speed-meter');
const clock = new THREE.Clock();

function gameLoop() {
    requestAnimationFrame(gameLoop);
    const dt = clock.getDelta();

    const isForward = keys.w || keys.arrowup; const isBackward = keys.s || keys.arrowdown;
    const isLeft = keys.a || keys.arrowleft; const isRight = keys.d || keys.arrowright;
    const isBraking = keys[' '];

    if (isForward) { speed += physics.acceleration * dt; if (speed > physics.maxSpeed) speed = physics.maxSpeed; }
    else if (isBackward) { speed -= physics.acceleration * dt; if (speed < -physics.maxSpeed / 2) speed = -physics.maxSpeed / 2; }
    else { if (speed > 0) { speed -= physics.friction * dt; if (speed < 0) speed = 0; } if (speed < 0) { speed += physics.friction * dt; if (speed > 0) speed = 0; } }

    if (isBraking) { if (speed > 0) { speed -= physics.brakeForce * dt; if (speed < 0) speed = 0; } if (speed < 0) { speed += physics.brakeForce * dt; if (speed > 0) speed = 0; } }

    if (isLeft) { steerAngle += physics.steerSpeed * dt; if (steerAngle > physics.maxSteer) steerAngle = physics.maxSteer; }
    else if (isRight) { steerAngle -= physics.steerSpeed * dt; if (steerAngle < -physics.maxSteer) steerAngle = -physics.maxSteer; }
    else { if (steerAngle > 0) { steerAngle -= physics.steerSpeed * 1.5 * dt; if (steerAngle < 0) steerAngle = 0; } if (steerAngle < 0) { steerAngle += physics.steerSpeed * 1.5 * dt; if (steerAngle > 0) steerAngle = 0; } }

    if (Math.abs(speed) > 1) { const turnFactor = speed > 0 ? 1 : -1; angle += steerAngle * (speed / physics.maxSpeed) * turnFactor * dt; }

    carGroup.position.x += Math.sin(angle) * speed * dt; carGroup.position.z += Math.cos(angle) * speed * dt; carGroup.rotation.y = angle;

    wheels[0].rotation.y = steerAngle; wheels[1].rotation.y = steerAngle;
    wheels.forEach(w => { w.rotation.x += (speed / 0.4) * dt; });

    chassisMesh.rotation.z = -steerAngle * (speed / physics.maxSpeed) * physics.weightLean;
    cabinMesh.rotation.z = chassisMesh.rotation.z;

    if (uiSpeed) uiSpeed.innerText = Math.round(Math.abs(speed) * 3.6).toString();

    const targetCamOffset = new THREE.Vector3(-Math.sin(angle) * 7, 3, -Math.cos(angle) * 7);
    const targetCamPos = carGroup.position.clone().add(targetCamOffset);
    camera.position.lerp(targetCamPos, 0.1); camera.lookAt(carGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0)));

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
gameLoop();
