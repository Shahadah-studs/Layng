import * as THREE from 'three';
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7dd3fc); scene.fog = new THREE.FogExp2(0x7dd3fc, 0.005);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight); renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const lightAmbient = new THREE.AmbientLight(0xffffff, 0.7); scene.add(lightAmbient);
const lightDirect = new THREE.DirectionalLight(0xfef08a, 1.5); lightDirect.position.set(200, 400, 100); lightDirect.castShadow = true; scene.add(lightDirect);
const carGroup = new THREE.Group(); const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.9 });
const tMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }); const dMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
const gMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, roughness: 0.0 });
const chassisMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 3.8), pMat); chassisMesh.position.y = 0.35; chassisMesh.castShadow = true; carGroup.add(chassisMesh);
const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.9), pMat); cabinMesh.position.set(0, 0.8, -0.1); cabinMesh.castShadow = true; carGroup.add(cabinMesh);
const glassFront = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.1), gMat); glassFront.position.set(0, 0.8, 0.85); glassFront.rotation.x = 0.4; carGroup.add(glassFront);
const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.3), tMat); spoiler.position.set(0, 0.95, -1.6); carGroup.add(spoiler);
const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.4), dMat); dashboard.position.set(0, 0.65, 0.7); carGroup.add(dashboard);
const hudCanvas = document.createElement('canvas'); hudCanvas.width = 128; hudCanvas.height = 64; const hudCtx = hudCanvas.getContext('2d');
const hudTexture = new THREE.CanvasTexture(hudCanvas); const screenMat = new THREE.MeshBasicMaterial({ map: hudTexture });
const dashScreen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.01), screenMat); dashScreen.position.set(-0.2, 0.72, 0.52); dashScreen.rotation.x = -0.2; carGroup.add(dashScreen);
const wheelContainer = new THREE.Group(); wheelContainer.position.set(-0.2, 0.68, 0.52); wheelContainer.rotation.x = -0.2;
wheelContainer.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 24), tMat), new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), tMat)); carGroup.add(wheelContainer);
const wheels: THREE.Mesh[] = []; const wPositions = [[-0.85, 0.35, 1.1], [0.85, 0.35, 1.1], [-0.85, 0.35, -1.1], [0.85, 0.35, -1.1]];
wPositions.forEach((pos) => { const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })); wm.rotation.z = Math.PI / 2; wm.position.set(pos[0], pos[1], pos[2]); wm.castShadow = true; carGroup.add(wm); wheels.push(wm); });
scene.add(carGroup); const chunkSize = 120; const activeChunks = new Map<string, THREE.Group>(); const buildingsArray: THREE.Mesh[] = [];
function generateChunk(cx: number, cz: number) {
    const key = `${cx},${cz}`; if (activeChunks.has(key)) return; const cg = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(chunkSize, chunkSize), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.set(cx * chunkSize, 0, cz * chunkSize); cg.add(floor);
    const seed = Math.sin(cx * 12.98 + cz * 78.23) * 43758.54; const bCount = Math.floor((seed - Math.floor(seed)) * 5) + 3;
    for (let i = 0; i < bCount; i++) {
        const h = 15 + Math.floor(Math.sin(seed + i) * 25), w = 10 + Math.floor(Math.cos(seed + i) * 6), bx = (cx * chunkSize) + (Math.sin(seed * i) * (chunkSize / 2.6)), bz = (cz * chunkSize) + (Math.cos(seed * i) * (chunkSize / 2.6));
        if (Math.abs(bx) < 15 && Math.abs(bz) < 15) continue;
        const bm = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 })); bm.position.set(bx, h / 2, bz); bm.castShadow = true; bm.receiveShadow = true; cg.add(bm); buildingsArray.push(bm);
    }
    scene.add(cg); activeChunks.set(key, cg);
}
function deformChassis(hitPoint: THREE.Vector3, force: number) {
    const localHit = chassisMesh.worldToLocal(hitPoint.clone()), posAttr = chassisMesh.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) { v.fromBufferAttribute(posAttr, i); const dist = v.distanceTo(localHit); if (dist < 1.3) { const depth = (1.3 - dist) * (force * 0.016), dir = v.clone().sub(localHit).normalize(); posAttr.setXYZ(i, v.x - dir.x * depth, v.y - dir.y * depth, v.z - dir.z * depth); } }
    posAttr.needsUpdate = true; chassisMesh.geometry.computeVertexNormals();
}
let speed = 0, angle = 0, steerAngle = 0, camMode = 0; const camNames = ["3rd Person", "Driver View", "Bumper Cam", "Wheel Cam"];
const physics = { maxSpeed: 42, acceleration: 22, friction: 6, brakeForce: 45, maxSteer: 0.48, steerSpeed: 3.2 }, keys: { [key: string]: boolean } = { w: false, a: false, s: false, d: false, ' ': false };
window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (k in keys) keys[k] = true; if (k === 'c') { camMode = (camMode + 1) % 4; const uiCam = document.getElementById('cam-name'); if (uiCam) uiCam.innerText = camNames[camMode]; } });
window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (k in keys) keys[k] = false; });
const uiSpeed = document.getElementById('speed-meter'), clock = new THREE.Clock(), carRadius = 1.2;
function gameLoop() {
    requestAnimationFrame(gameLoop); const dt = clock.getDelta();
    if (keys.w) speed = Math.min(physics.maxSpeed, speed + physics.acceleration * dt); else if (keys.s) speed = Math.max(-physics.maxSpeed / 2, speed - physics.acceleration * dt); else speed -= Math.sign(speed) * Math.min(Math.abs(speed), physics.friction * dt);
    if (keys[' ']) speed -= Math.sign(speed) * Math.min(Math.abs(speed), physics.brakeForce * dt);
    if (keys.a) steerAngle = Math.min(physics.maxSteer, steerAngle + physics.steerSpeed * dt); else if (keys.d) steerAngle = Math.max(-physics.maxSteer, steerAngle - physics.steerSpeed * dt); else steerAngle -= Math.sign(steerAngle) * Math.min(Math.abs(steerAngle), physics.steerSpeed * 2 * dt);
    if (Math.abs(speed) > 1) angle += steerAngle * (speed / physics.maxSpeed) * (speed > 0 ? 1 : -1) * dt;
    const nextX = carGroup.position.x + Math.sin(angle) * speed * dt, nextZ = carGroup.position.z + Math.cos(angle) * speed * dt; let collision = false;
    for (let i = 0; i < buildingsArray.length; i++) {
        const b = buildingsArray[i], bBox = new THREE.Box3().setFromObject(b), carBox = new THREE.Box3(new THREE.Vector3(nextX - carRadius, 0, nextZ - carRadius), new THREE.Vector3(nextX + carRadius, 2, nextZ + carRadius));
        if (bBox.intersectsBox(carBox)) { collision = true; if (Math.abs(speed) > 5) deformChassis(carGroup.position.clone().add(new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(1.5)), Math.abs(speed)); speed = -speed * 0.35; break; }
    }
    if (!collision) { carGroup.position.x = nextX; carGroup.position.z = nextZ; } carGroup.rotation.y = angle; wheels.forEach(w => { w.rotation.x += (speed / 0.35) * dt; });
    wheels[0].rotation.y = wheels[1].rotation.y = steerAngle; wheelContainer.rotation.z = steerAngle * 4; const currentSpeedKmh = Math.round(Math.abs(speed) * 3.6); if (uiSpeed) uiSpeed.innerText = currentSpeedKmh.toString();
    if (hudCtx) { hudCtx.fillStyle = '#020617'; hudCtx.fillRect(0, 0, 128, 64); hudCtx.fillStyle = '#00ffcc'; hudCtx.font = 'bold 26px monospace'; hudCtx.textAlign = 'center'; hudCtx.fillText(currentSpeedKmh + ' KM/H', 64, 42); hudTexture.needsUpdate = true; }
    const ccX = Math.round(carGroup.position.x / chunkSize), ccZ = Math.round(carGroup.position.z / chunkSize); for (let x = -1; x <= 1; x++) { for (let z = -1; z <= 1; z++) generateChunk(ccX + x, ccZ + z); }
    let tCamPos = new THREE.Vector3(), tLookAt = carGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0));
    if (camMode === 0) { tCamPos.copy(carGroup.position).add(new THREE.Vector3(-Math.sin(angle) * 6, 2.3, -Math.cos(angle) * 6)); camera.position.lerp(tCamPos, 0.1); camera.lookAt(tLookAt); }
    else if (camMode === 1) { tCamPos.copy(carGroup.position).add(new THREE.Vector3(-0.2, 0.78, 0.1).applyQuaternion(carGroup.quaternion)); camera.position.copy(tCamPos); tLookAt.copy(carGroup.position).add(new THREE.Vector3(Math.sin(angle) * 20, 0.72, Math.cos(angle) * 20)); camera.lookAt(tLookAt); }
    else if (camMode === 2) { tCamPos.copy(carGroup.position).add(new THREE.Vector3(Math.sin(angle) * 1.95, 0.45, Math.cos(angle) * 1.95)); camera.position.copy(tCamPos); tLookAt.copy(carGroup.position).add(new THREE.Vector3(Math.sin(angle) * 15, 0.4, Math.cos(angle) * 15)); camera.lookAt(tLookAt); }
    else if (camMode === 3) { tCamPos.copy(carGroup.position).add(new THREE.Vector3(Math.sin(angle + 1.2) * 2.5, 0.4, Math.cos(angle + 1.2) * 2.5)); camera.position.lerp(tCamPos, 0.2); camera.lookAt(carGroup.position.clone().add(new THREE.Vector3(0, 0.35, 0))); }
    renderer.render(scene, camera);
}
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
gameLoop();

