import * as THREE from 'three';

export interface ValveScene {
  setAperture: (pct: number) => void;
  resize: () => void;
  dispose: () => void;
}

const STEEL_COLOR = 0xb9c1c9;
const BRASS_COLOR = 0xc9a24a;

export function buildValveScene(container: HTMLDivElement): ValveScene {
  const w = container.clientWidth || 400;
  const h = container.clientHeight || 300;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120d0a);

  const camera = new THREE.PerspectiveCamera(36, w / h, 0.02, 20);
  let azimuth = -0.55;
  let elevation = 1.15;
  let dist = 3.4;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(3, 4, 2);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb8cc, 2.0);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffb37a, 0.6, 10);
  fill.position.set(-1, 1, 2);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1c14, 0.45));

  const steelMat = new THREE.MeshPhysicalMaterial({ color: STEEL_COLOR, metalness: 0.92, roughness: 0.28 });
  const darkSteelMat = new THREE.MeshPhysicalMaterial({ color: 0x555b61, metalness: 0.85, roughness: 0.4 });
  const brassMat = new THREE.MeshPhysicalMaterial({ color: BRASS_COLOR, metalness: 0.95, roughness: 0.3 });

  const pipeGroup = new THREE.Group();
  scene.add(pipeGroup);

  const pipeGeo = new THREE.CylinderGeometry(0.32, 0.32, 3.2, 32, 1, true);
  const pipeLeft = new THREE.Mesh(pipeGeo, steelMat);
  pipeLeft.rotation.z = Math.PI / 2;
  pipeLeft.position.x = -1.1;
  pipeLeft.castShadow = true;
  pipeLeft.receiveShadow = true;
  pipeGroup.add(pipeLeft);
  const pipeRight = pipeLeft.clone();
  pipeRight.position.x = 1.1;
  pipeGroup.add(pipeRight);

  const bodyGeo = new THREE.SphereGeometry(0.62, 40, 32);
  const body = new THREE.Mesh(bodyGeo, darkSteelMat);
  body.castShadow = true;
  body.receiveShadow = true;
  pipeGroup.add(body);

  // Flanges + bolts
  [-1.5, 1.5].forEach((x) => {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 32), steelMat);
    flange.rotation.z = Math.PI / 2;
    flange.position.x = x;
    flange.castShadow = true;
    pipeGroup.add(flange);
    const boltCount = 8;
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), brassMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(x, Math.sin(angle) * 0.4, Math.cos(angle) * 0.4);
      pipeGroup.add(bolt);
    }
  });

  // Ball (rotates to open/close) with bore hole
  const ballGroup = new THREE.Group();
  pipeGroup.add(ballGroup);
  const ballGeo = new THREE.SphereGeometry(0.48, 40, 32);
  const ball = new THREE.Mesh(ballGeo, steelMat);
  ball.castShadow = true;
  ballGroup.add(ball);
  const boreGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 24, 1, true);
  const boreMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const bore = new THREE.Mesh(boreGeo, boreMat);
  bore.rotation.z = Math.PI / 2;
  ballGroup.add(bore);

  // Stem + lever
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), steelMat);
  stem.position.y = 0.72;
  pipeGroup.add(stem);
  const leverGroup = new THREE.Group();
  leverGroup.position.y = 0.95;
  pipeGroup.add(leverGroup);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.1), brassMat);
  lever.position.x = 0.25;
  lever.castShadow = true;
  leverGroup.add(lever);
  const grip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshPhysicalMaterial({ color: 0xd63b3b, roughness: 0.5 }));
  grip.position.x = 0.5;
  leverGroup.add(grip);

  // LED indicator
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 1.5 }));
  led.position.set(0, 1.15, 0.15);
  pipeGroup.add(led);

  // Water (fill level driven by aperture)
  const waterGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.0, 24, 1, true);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x2d8fd6,
    transparent: true,
    opacity: 0.55,
    roughness: 0.15,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.z = Math.PI / 2;
  water.visible = false;
  pipeGroup.add(water);

  // Bubble particles (visible when open)
  const bubbleCount = 24;
  const bubbleGeo = new THREE.SphereGeometry(0.02, 6, 6);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleCount);
  const bubbleOffsets = new Array(bubbleCount).fill(0).map(() => ({
    x: (Math.random() - 0.5) * 3,
    r: Math.random() * 0.15,
    a: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.4,
  }));
  pipeGroup.add(bubbles);

  const state = { aperture: 0, ball: 0 };
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };
  let idleTimer = 0;
  let autoRotate = true;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    autoRotate = false;
    lastPointer = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    azimuth -= dx * 0.006;
    elevation = Math.max(0.3, Math.min(2.4, elevation - dy * 0.006));
    lastPointer = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp() {
    dragging = false;
    idleTimer = 0;
  }
  function onWheel(e: WheelEvent) {
    dist = Math.max(1.8, Math.min(6, dist + e.deltaY * 0.002));
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

  function updateCamera() {
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation - Math.PI / 2) * dist,
      Math.sin(elevation - Math.PI / 2) * dist + 0.3,
      Math.cos(azimuth) * Math.cos(elevation - Math.PI / 2) * dist,
    );
    camera.lookAt(0, 0.1, 0);
  }

  let raf: number;
  const clock = new THREE.Clock();

  function tick() {
    const dt = clock.getDelta();

    // lever eases toward target first, then the ball eases toward the lever (mechanical lag)
    const target = state.aperture;
    leverGroup.rotation.y += (target * (Math.PI / 2) - leverGroup.rotation.y) * Math.min(1, 6 * dt);
    state.ball += (leverGroup.rotation.y / (Math.PI / 2) - state.ball) * Math.min(1, 4 * dt);
    ballGroup.rotation.x = state.ball * (Math.PI / 2);

    const openAmt = Math.max(0, Math.min(1, state.ball));
    water.visible = openAmt > 0.02;
    (water.scale as THREE.Vector3).set(1, 0.3 + openAmt * 0.7, 1);
    (water.material as THREE.MeshPhysicalMaterial).opacity = 0.25 + openAmt * 0.4;

    const ledColor = new THREE.Color(openAmt < 0.05 ? 0xff3b3b : openAmt < 0.6 ? 0xd68f2d : 0x3bd66b);
    (led.material as THREE.MeshStandardMaterial).color = ledColor;
    (led.material as THREE.MeshStandardMaterial).emissive = ledColor;
    (led.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + Math.sin(clock.elapsedTime * 4) * 0.3 * (0.3 + openAmt);

    const m = new THREE.Matrix4();
    bubbles.visible = openAmt > 0.05;
    if (bubbles.visible) {
      bubbleOffsets.forEach((b, i) => {
        const x = ((clock.elapsedTime * b.speed * (0.5 + openAmt) + b.x + 1.6) % 3.2) - 1.6;
        const y = Math.sin(b.a + clock.elapsedTime * 2) * b.r;
        const z = Math.cos(b.a + clock.elapsedTime * 2) * b.r;
        m.makeTranslation(x, y, z);
        bubbles.setMatrixAt(i, m);
      });
      bubbles.instanceMatrix.needsUpdate = true;
    }

    if (!dragging && autoRotate) {
      azimuth += 0.08 * dt;
    } else if (!dragging) {
      idleTimer += dt;
      if (idleTimer > 2.2) autoRotate = true;
    }

    updateCamera();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function resize() {
    const cw = container.clientWidth || 400;
    const ch = container.clientHeight || 300;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);

  return {
    setAperture: (pct: number) => {
      state.aperture = Math.max(0, Math.min(100, pct)) / 100;
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
