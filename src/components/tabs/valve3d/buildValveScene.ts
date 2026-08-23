import * as THREE from 'three';

export interface ValveScene {
  setAperture: (pct: number) => void;
  resize: () => void;
  dispose: () => void;
}

export interface ValveSceneOpts {
  onFlowChange?: (litersPerMin: number) => void;
}

// Adapted from a standalone Three.js ball-valve scene (module script) into a
// container-scoped component: sized to `container` instead of window, no DOM
// HUD (the React shell renders its own state/flow display), state driven by
// setAperture(pct) instead of a UI switch/slider.
export function buildValveScene(container: HTMLDivElement, opts: ValveSceneOpts = {}): ValveScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e11);
  scene.fog = new THREE.Fog(0x0b0e11, 2.0, 4.2);

  const getSize = () => ({ w: container.clientWidth || 400, h: container.clientHeight || 300 });
  const { w: w0, h: h0 } = getSize();
  const camera = new THREE.PerspectiveCamera(38, w0 / h0, 0.02, 20);
  renderer.setSize(w0, h0);

  /* Entorno procedural (gradiente) para que el acero tenga algo que reflejar */
  (function buildEnv() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0.0, '#20262c');
    grd.addColorStop(0.42, '#7d8a94');
    grd.addColorStop(0.52, '#c8d2d8');
    grd.addColorStop(1.0, '#0d1114');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.fillRect(30, 26, 70, 16);
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(170, 34, 54, 12);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(tex).texture;
    pm.dispose();
    tex.dispose();
  })();

  /* Luces */
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(0.85, 1.25, 0.75);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0006;
  const kcam = key.shadow.camera as THREE.OrthographicCamera;
  kcam.left = -1.1;
  kcam.right = 1.1;
  kcam.top = 1.1;
  kcam.bottom = -1.1;
  kcam.near = 0.1;
  kcam.far = 5;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9fd8ff, 2.2);
  rim.position.set(-1.0, 0.55, -1.15);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe6cc, 0.6);
  fill.position.set(-0.4, -0.3, 1.0);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0x88a0b0, 0x0a0d10, 0.45));

  /* Materiales */
  function brushedNormal() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d')!;
    g.fillStyle = '#8080ff';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * s;
      const w = 0.6 + Math.random() * 2.2;
      const d = (Math.random() - 0.5) * 36;
      g.strokeStyle = 'rgb(' + (128 + d) + ',' + (128 - d * 0.25) + ',255)';
      g.lineWidth = w;
      g.globalAlpha = 0.35 + Math.random() * 0.4;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(s, y + (Math.random() - 0.5) * 3);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 2);
    return t;
  }
  const nrm = brushedNormal();

  const matSteel = new THREE.MeshPhysicalMaterial({
    color: 0xb9c2c7,
    metalness: 0.92,
    roughness: 0.28,
    normalMap: nrm,
    normalScale: new THREE.Vector2(0.28, 0.28),
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
  const matSteelDark = new THREE.MeshPhysicalMaterial({ color: 0x7d868c, metalness: 0.85, roughness: 0.48, normalMap: nrm, normalScale: new THREE.Vector2(0.4, 0.4) });
  const matBrass = new THREE.MeshPhysicalMaterial({ color: 0xc9a24a, metalness: 0.95, roughness: 0.24, normalMap: nrm, normalScale: new THREE.Vector2(0.15, 0.15) });
  const matSeat = new THREE.MeshStandardMaterial({ color: 0x25292d, metalness: 0.1, roughness: 0.75 });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xd8eef2,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6,
  });

  /* Geometría de la válvula */
  const valve = new THREE.Group();
  scene.add(valve);

  const R_OUT = 0.055,
    R_IN = 0.045,
    R_W = 0.0425;
  const HALF = 0.62;
  const BODY_R = 0.1;
  const CUT_START = Math.PI * 0.42;
  const CUT_LEN = Math.PI * 1.5;

  function named<T extends THREE.Object3D>(mesh: T, n: string): T {
    mesh.name = n;
    if (mesh instanceof THREE.Mesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    return mesh;
  }

  const bodyShell = named(new THREE.Mesh(new THREE.SphereGeometry(BODY_R, 48, 32, CUT_START, CUT_LEN), matSteel), 'cuerpo_valvula');
  valve.add(bodyShell);
  const bodyInner = new THREE.Mesh(new THREE.SphereGeometry(BODY_R - 0.008, 48, 32, CUT_START, CUT_LEN), matSteelDark);
  bodyInner.name = 'cuerpo_interior';
  (bodyInner.material as THREE.Material).side = THREE.BackSide;
  valve.add(bodyInner);
  const bodyGlass = new THREE.Mesh(new THREE.SphereGeometry(BODY_R - 0.0015, 24, 32, CUT_START + CUT_LEN, Math.PI * 0.5), matGlass);
  bodyGlass.name = 'mirilla_cuerpo';
  valve.add(bodyGlass);

  function boredBall(R: number, r: number) {
    const h = Math.sqrt(R * R - r * r);
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(r, h));
    pts.push(new THREE.Vector2(r, -h));
    const p0 = Math.asin(r / R);
    for (let i = 0; i <= 28; i++) {
      const a = THREE.MathUtils.lerp(Math.PI - p0, p0, i / 28);
      pts.push(new THREE.Vector2(Math.sin(a) * R, Math.cos(a) * R));
    }
    return new THREE.LatheGeometry(pts, 48);
  }
  const ballPivot = new THREE.Group();
  ballPivot.name = 'eje_bola';
  valve.add(ballPivot);
  const ball = named(new THREE.Mesh(boredBall(0.072, R_W + 0.001), matSteel), 'bola_perforada');
  ball.rotation.z = Math.PI / 2;
  ballPivot.add(ball);

  [-1, 1].forEach((s) => {
    const seat = named(new THREE.Mesh(new THREE.TorusGeometry(R_W + 0.006, 0.006, 12, 40), matSeat), 'asiento');
    seat.position.x = s * 0.0735;
    seat.rotation.y = Math.PI / 2;
    valve.add(seat);
  });

  const bonnet = named(new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.05, 32), matSteelDark), 'bonnet');
  bonnet.position.y = BODY_R - 0.005;
  valve.add(bonnet);
  const nut = named(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 6), matSteelDark), 'tuerca_prensa');
  nut.position.y = BODY_R + 0.03;
  valve.add(nut);
  const stem = named(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 20), matSteel), 'vastago');
  stem.position.y = BODY_R + 0.055;
  valve.add(stem);
  const stop = named(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 10), matSteelDark), 'tope');
  stop.position.set(0.03, BODY_R + 0.05, 0.03);
  valve.add(stop);

  const lever = new THREE.Group();
  lever.name = 'palanca';
  lever.position.y = BODY_R + 0.078;
  valve.add(lever);
  const arm = named(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.011, 0.028), matBrass), 'brazo_palanca');
  arm.position.x = 0.082;
  lever.add(arm);
  const hub = named(new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.018, 24), matBrass), 'buje_palanca');
  lever.add(hub);
  const grip = named(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.052, 20), matBrass), 'empunadura');
  grip.rotation.x = Math.PI / 2;
  grip.position.set(0.175, 0.004, 0);
  lever.add(grip);
  const mark = named(new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.0016, 0.004), matSeat), 'indicador');
  mark.position.set(0.014, 0.0095, 0);
  lever.add(mark);

  const FL_R = 0.096,
    FL_T = 0.016,
    FL_X = [0.128, 0.16];
  FL_X.forEach((x) =>
    [-1, 1].forEach((s) => {
      const f = named(new THREE.Mesh(new THREE.CylinderGeometry(FL_R, FL_R, FL_T, 40), matSteelDark), 'brida');
      f.rotation.z = Math.PI / 2;
      f.position.x = s * x;
      valve.add(f);
    }),
  );
  const NB = 8,
    BOLT_R = 0.074;
  const boltGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.062, 8);
  boltGeo.rotateZ(Math.PI / 2);
  const bolts = new THREE.InstancedMesh(boltGeo, matSteel, NB * 2);
  bolts.name = 'pernos';
  bolts.castShadow = bolts.receiveShadow = true;
  const headGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.011, 6);
  headGeo.rotateZ(Math.PI / 2);
  const heads = new THREE.InstancedMesh(headGeo, matBrass, NB * 4);
  heads.name = 'tuercas_pernos';
  heads.castShadow = true;
  {
    const d = new THREE.Object3D();
    let bi = 0,
      hi = 0;
    [-1, 1].forEach((s) => {
      for (let i = 0; i < NB; i++) {
        const a = (i / NB) * Math.PI * 2 + Math.PI / NB;
        const y = Math.cos(a) * BOLT_R,
          z = Math.sin(a) * BOLT_R,
          cx = s * 0.144;
        d.position.set(cx, y, z);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        bolts.setMatrixAt(bi++, d.matrix);
        [-0.031, 0.031].forEach((o) => {
          d.position.set(cx + o, y, z);
          d.rotation.x = a;
          d.updateMatrix();
          heads.setMatrixAt(hi++, d.matrix);
        });
      }
    });
  }
  valve.add(bolts, heads);

  function pipeCut(x0: number, x1: number) {
    const L = x1 - x0;
    const pts = [
      new THREE.Vector2(R_OUT, -L / 2),
      new THREE.Vector2(R_OUT, L / 2),
      new THREE.Vector2(R_IN, L / 2),
      new THREE.Vector2(R_IN, -L / 2),
      new THREE.Vector2(R_OUT, -L / 2),
    ];
    const g = new THREE.LatheGeometry(pts, 40, CUT_START, CUT_LEN);
    const m = named(new THREE.Mesh(g, matSteel), 'tuberia');
    m.rotation.z = -Math.PI / 2;
    m.position.x = (x0 + x1) / 2;
    return m;
  }
  const SG0 = 0.3,
    SG1 = 0.45;
  valve.add(pipeCut(0.168, SG0), pipeCut(SG1, HALF), pipeCut(-HALF, -0.168));

  const sg = named(new THREE.Mesh(new THREE.CylinderGeometry(R_OUT - 0.002, R_OUT - 0.002, SG1 - SG0, 48, 1, true), matGlass), 'sight_glass');
  sg.rotation.z = Math.PI / 2;
  sg.position.x = (SG0 + SG1) / 2;
  sg.castShadow = false;
  valve.add(sg);
  [SG0, SG1].forEach((x) => {
    const c = named(new THREE.Mesh(new THREE.CylinderGeometry(R_OUT + 0.006, R_OUT + 0.006, 0.014, 32), matBrass), 'collarin');
    c.rotation.z = Math.PI / 2;
    c.position.x = x;
    valve.add(c);
  });

  const ledBase = named(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.012, 20), matSteelDark), 'led_base');
  ledBase.position.set(-0.032, 0.062, 0.072);
  ledBase.rotation.set(0.9, 0, 0.35);
  valve.add(ledBase);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x330b08, emissive: new THREE.Color(0xff2a1a), emissiveIntensity: 2.2, roughness: 0.3, metalness: 0 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0088, 20, 14), ledMat);
  led.name = 'led';
  valve.add(led);
  led.position.copy(ledBase.position).add(new THREE.Vector3(-0.004, 0.008, 0.006));
  const ledLight = new THREE.PointLight(0xff2a1a, 0.1, 0.3);
  ledLight.position.copy(led.position);
  valve.add(ledLight);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshStandardMaterial({ color: 0x11151a, roughness: 0.95, metalness: 0 }));
  floor.name = 'suelo';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -BODY_R - 0.001;
  floor.receiveShadow = true;
  scene.add(floor);

  /* Shader de agua */
  const NOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*snoise(p); p*=2.02; a*=0.5;} return s; }
`;

  const waterUniforms = {
    uTime: { value: 0 },
    uFlow: { value: 0 },
    uTurb: { value: 0 },
    uLevel: { value: 0 },
    uFront: { value: 0 },
    uWave: { value: 0 },
    uR: { value: R_W },
    uHalf: { value: HALF },
  };

  const waterVert = `
varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
void main(){
  vLocal = position;
  vNrm = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

  const waterFrag =
    `
precision highp float;
varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
uniform float uTime,uFlow,uTurb,uLevel,uFront,uWave,uR,uHalf;
` +
    NOISE_GLSL +
    `
void main(){
  float rad  = length(vLocal.yz) / uR;
  float ang  = atan(vLocal.z, vLocal.y);
  float sx   = vLocal.x;

  float front = mix(0.085, uHalf + 0.002, uFront);
  if(abs(sx) > front) discard;

  float ripple = 0.004 * sin(sx*34.0 - uTime*3.0) * (0.35 + uFlow);
  float surf = -uR + 2.0*uR*uLevel + ripple;
  float below = smoothstep(surf, surf-0.004, vLocal.y);
  if(uLevel < 0.995 && vLocal.y > surf) discard;

  float speed = 0.5 + 3.4*uFlow;
  vec3 q = vec3(sx*7.0 - uTime*speed, ang*1.6, uTime*0.35);
  float n1 = fbm(q);
  float n2 = snoise(q*2.7 + vec3(0.0, uTime*0.8, 0.0));
  float turb = uTurb * (0.55 + 0.45*rad);
  vec2 duv = vec2(n1, n2) * (0.35 + 1.15*turb);

  vec3 deep    = vec3(0.010, 0.135, 0.205);
  vec3 shallow = vec3(0.230, 0.640, 0.700);
  float depth = 1.0 - pow(rad, 1.55);
  vec3 col = mix(shallow, deep, depth);
  col *= 1.0 + 0.18*duv.x;

  float caus = pow(max(0.0, 1.0 - abs(n1 + 0.25*duv.y)), 7.0);
  col += vec3(0.45,0.85,0.92) * caus * (0.35 + 0.9*uFlow);

  float streak = sin(ang*9.0 + sx*26.0 - uTime*speed*1.4 + duv.x*2.2);
  col += vec3(0.10,0.26,0.30) * smoothstep(0.72,1.0,streak) * (1.0 - 0.55*uTurb);

  float fres = pow(1.0 - abs(dot(normalize(vNrm), normalize(vView))), 2.6);
  col += vec3(0.55,0.88,0.95) * fres * 0.55;

  float wpos = uWave * (uHalf*1.25);
  float wave = exp(-pow((abs(sx) - wpos)*16.0, 2.0)) * step(0.001, uWave);
  col += vec3(0.7,0.95,1.0) * wave * 0.9;

  float band = smoothstep(0.0, 1.0, below) * (1.0 - below);
  col += vec3(0.5,0.8,0.85) * band * 1.2;

  float alpha = 0.70 + 0.24*fres + 0.12*caus;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;

  const waterGeo = new THREE.CylinderGeometry(R_W, R_W, HALF * 2, 48, 96, true);
  waterGeo.rotateZ(Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.ShaderMaterial({ uniforms: waterUniforms, vertexShader: waterVert, fragmentShader: waterFrag, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
  );
  water.name = 'agua';
  valve.add(water);

  const causFrag =
    `
precision highp float;
varying vec3 vLocal;
uniform float uTime,uFlow,uLevel,uSg0,uSg1,uR;
` +
    NOISE_GLSL +
    `
void main(){
  float sx = vLocal.x;
  float win = smoothstep(uSg0, uSg0+0.02, sx) * (1.0 - smoothstep(uSg1-0.02, uSg1, sx));
  if(win < 0.01) discard;
  float surf = -uR + 2.0*uR*uLevel;
  if(vLocal.y > surf) discard;
  vec3 q = vec3(sx*10.0 - uTime*(1.2+3.0*uFlow), atan(vLocal.z,vLocal.y)*2.2, uTime*0.6);
  float n = fbm(q);
  float c = pow(max(0.0,1.0-abs(n)), 9.0) + 0.55*pow(max(0.0,1.0-abs(n*1.7+0.4)), 12.0);
  vec3 col = vec3(0.55,0.95,1.0) * c * (0.5 + 1.1*uFlow) * win;
  gl_FragColor = vec4(col, 1.0);
}`;
  const causUniforms = { uTime: waterUniforms.uTime, uFlow: waterUniforms.uFlow, uLevel: waterUniforms.uLevel, uR: { value: R_W }, uSg0: { value: SG0 }, uSg1: { value: SG1 } };
  const causGeo = new THREE.CylinderGeometry(R_W - 0.0012, R_W - 0.0012, HALF * 2, 40, 48, true);
  causGeo.rotateZ(Math.PI / 2);
  const caustics = new THREE.Mesh(
    causGeo,
    new THREE.ShaderMaterial({ uniforms: causUniforms, vertexShader: waterVert, fragmentShader: causFrag, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
  );
  caustics.name = 'causticas';
  valve.add(caustics);

  /* Partículas de flujo */
  const N_P = 170;
  const pGeo = new THREE.SphereGeometry(0.0034, 8, 6);
  const pMat = new THREE.MeshStandardMaterial({ color: 0xbfeef5, emissive: new THREE.Color(0x2f95a8), emissiveIntensity: 1.4, roughness: 0.35, transparent: true, opacity: 0.85 });
  const parts = new THREE.InstancedMesh(pGeo, pMat, N_P);
  parts.name = 'particulas_flujo';
  parts.frustumCulled = false;
  valve.add(parts);

  interface Particle {
    x: number;
    r: number;
    a: number;
    k: number;
    j: number;
    big: boolean;
    ph: number;
  }
  const P: Particle[] = [];
  for (let i = 0; i < N_P; i++) {
    const rr = Math.sqrt(Math.random()) * (R_W - 0.004);
    P.push({ x: (Math.random() * 2 - 1) * HALF, r: rr, a: Math.random() * Math.PI * 2, k: 1 - Math.pow(rr / R_W, 2), j: 0.4 + Math.random() * 0.9, big: Math.random() < 0.18, ph: Math.random() * 9 });
  }

  /* Estado */
  const S = {
    open: false,
    lever: 0,
    leverV: 0,
    ball: 0,
    level: 0,
    front: 0,
    flow: 0,
    flowShown: 0,
    led: 0,
    wave: 0,
    waveOn: false,
    target: 0.72,
  };
  const MAX_FLOW = 640;

  function setOpen(v: boolean) {
    S.open = v;
    if (v) {
      S.wave = 0;
      S.waveOn = true;
    }
  }

  const orb = { az: -0.62, pol: 1.16, dist: 1.72, tAz: -0.62, tPol: 1.16, tDist: 1.72, idle: 0, drag: false, px: 0, py: 0 };
  const dom = renderer.domElement;
  const onPointerDown = (e: PointerEvent) => {
    orb.drag = true;
    orb.px = e.clientX;
    orb.py = e.clientY;
    orb.idle = 0;
    dom.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!orb.drag) return;
    orb.tAz -= (e.clientX - orb.px) * 0.0062;
    orb.tPol = THREE.MathUtils.clamp(orb.tPol - (e.clientY - orb.py) * 0.0055, 0.22, Math.PI - 0.35);
    orb.px = e.clientX;
    orb.py = e.clientY;
    orb.idle = 0;
  };
  const onPointerUp = () => {
    orb.drag = false;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    orb.tDist = THREE.MathUtils.clamp(orb.tDist * (1 + Math.sign(e.deltaY) * 0.08), 0.5, 3.4);
    orb.idle = 0;
  };
  dom.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  function resize() {
    const { w, h } = getSize();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();
  const colOpen = new THREE.Color(0x3ba85c),
    colClosed = new THREE.Color(0xd94430),
    tmpCol = new THREE.Color();
  const ease = (cur: number, tgt: number, rate: number, dt: number) => cur + (tgt - cur) * (1 - Math.exp(-rate * dt));

  let raf: number;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05),
      t = clock.elapsedTime;

    const tgt = S.open ? 1 : 0;
    S.leverV += (tgt - S.lever) * 190 * dt;
    S.leverV *= Math.exp(-9.5 * dt);
    S.lever += S.leverV * dt;
    if (S.lever > 1) {
      S.lever = 1;
      S.leverV *= -0.22;
    }
    if (S.lever < 0) {
      S.lever = 0;
      S.leverV *= -0.22;
    }
    S.ball = ease(S.ball, S.lever, 7.0, dt);

    lever.rotation.y = -(1 - S.lever) * (Math.PI / 2);
    ballPivot.rotation.y = -(1 - S.ball) * (Math.PI / 2);

    if (S.open) {
      S.front = ease(S.front, 1, 2.6, dt);
      S.level = ease(S.level, 1, 3.4 * (0.25 + S.ball), dt);
      if (S.waveOn) {
        S.wave += dt * 1.1;
        if (S.wave >= 1) {
          S.wave = 0;
          S.waveOn = false;
        }
      }
    } else {
      S.level = ease(S.level, 0, 1.35, dt);
      S.wave = 0;
      S.waveOn = false;
      if (S.level < 0.03) S.front = ease(S.front, 0, 2.2, dt);
    }

    const flowTgt = S.open ? S.target * S.ball : 0;
    S.flow = ease(S.flow, flowTgt, 2.1, dt);
    S.flowShown = ease(S.flowShown, flowTgt * MAX_FLOW, 1.7, dt);
    opts.onFlowChange?.(Math.round(S.flowShown));

    waterUniforms.uTime.value = t;
    waterUniforms.uFlow.value = S.flow;
    waterUniforms.uTurb.value = THREE.MathUtils.smoothstep(S.flow, 0.32, 0.95);
    waterUniforms.uLevel.value = S.level;
    waterUniforms.uFront.value = S.front;
    waterUniforms.uWave.value = S.waveOn ? S.wave : 0;
    water.visible = caustics.visible = S.front > 0.02 && S.level > 0.01;

    S.led = ease(S.led, S.open ? 1 : 0, 3.2, dt);
    tmpCol.copy(colClosed).lerp(colOpen, S.led);
    ledMat.emissive.copy(tmpCol);
    ledMat.emissiveIntensity = 1.7 + 0.7 * Math.sin(t * 2.1);
    ledLight.color.copy(tmpCol);
    ledLight.intensity = 0.09 + 0.04 * Math.sin(t * 2.1);

    const vmax = 0.06 + S.flow * 1.45,
      turb = waterUniforms.uTurb.value;
    const front = THREE.MathUtils.lerp(0.085, HALF, S.front);
    const surfY = -R_W + 2 * R_W * S.level;
    for (let i = 0; i < N_P; i++) {
      const p = P[i];
      p.x += vmax * p.k * p.j * dt;
      if (p.x > front) {
        p.x = -front;
        p.a = Math.random() * Math.PI * 2;
      }
      p.a += turb * (0.9 + p.k) * dt * 2.2;
      const wob = turb * 0.006 * Math.sin(t * 6 + p.ph);
      const rr = Math.max(0.001, p.r + wob);
      const y = Math.cos(p.a) * rr,
        z = Math.sin(p.a) * rr;
      const visible = Math.abs(p.x) < front && y < surfY - 0.002 && S.level > 0.02;
      dummy.position.set(p.x, y, z);
      const sc = visible ? (p.big ? 1.5 + turb * 0.9 : 1) : 0;
      dummy.scale.set(sc * (1 + p.k * S.flow * 2.6), sc, sc);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      parts.setMatrixAt(i, dummy.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;
    parts.visible = S.level > 0.02;

    orb.idle += dt;
    if (!orb.drag && orb.idle > 2.2) orb.tAz += dt * 0.13;
    orb.az = ease(orb.az, orb.tAz, 7, dt);
    orb.pol = ease(orb.pol, orb.tPol, 7, dt);
    orb.dist = ease(orb.dist, orb.tDist, 6, dt);
    camera.position.set(Math.sin(orb.pol) * Math.sin(orb.az) * orb.dist, Math.cos(orb.pol) * orb.dist + 0.03, Math.sin(orb.pol) * Math.cos(orb.az) * orb.dist);
    camera.lookAt(0, 0.01, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setAperture: (pct: number) => {
      const clamped = Math.max(0, Math.min(100, pct)) / 100;
      S.target = clamped;
      setOpen(clamped > 0);
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
