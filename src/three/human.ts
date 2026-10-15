// A low-poly 3D person built from simple shapes, in metres (about 1.7-1.75 m tall).
// Everything the creator lets you pick (body, colours, hair, hat, extra) is real geometry.
import * as THREE from "three";
import { CharacterStyle } from "../character";

const PI = Math.PI;
const SHOE = "#2a211b";
const GOLD = "#e8b84a";
const LEATHER = "#6b4a2f";
const SCARF = "#c8442f";

export type Human = {
  root: THREE.Group;
  head: THREE.Group;
  update: (t: number) => void;
  /** React to a click: a wave and a little bounce. */
  wave: () => void;
  dispose: () => void;
};

export function buildHuman(s: CharacterStyle): Human {
  const female = s.body === "female";
  const geos: THREE.BufferGeometry[] = [];
  const mats = new Map<string, THREE.MeshStandardMaterial>();

  const mat = (color: string, metal = 0, rough = 0.78) => {
    const key = `${color}|${metal}|${rough}`;
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, flatShading: true, metalness: metal, roughness: rough }));
    return mats.get(key)!;
  };
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    geos.push(geo);
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    return o;
  };
  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  // A tapered limb hanging down from its joint.
  const limb = (rTop: number, rBot: number, len: number, m: THREE.Material, seg = 7) =>
    mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), m, 0, -len / 2, 0);

  const skin = mat(s.skinColor, 0, 0.62);
  const top = mat(s.primaryColor);
  const bottoms = mat(s.secondaryColor, 0, 0.85);
  const hair = mat(s.hairColor, 0, 0.9);
  const shoe = mat(SHOE, 0, 0.55);

  const root = new THREE.Group();
  const hipY = female ? 0.875 : 0.9;
  const hips = group(root, 0, hipY, 0);

  // ---- legs: hip > knee > ankle
  const legs: { hip: THREE.Group; knee: THREE.Group }[] = [];
  const thighLen = female ? 0.41 : 0.42;
  const shinLen = female ? 0.39 : 0.4;
  for (const side of [-1, 1]) {
    const hip = group(hips, side * (female ? 0.088 : 0.092), -0.02, 0);
    hip.add(limb(female ? 0.094 : 0.09, 0.062, thighLen, bottoms));
    const knee = group(hip, 0, -thighLen, 0);
    knee.add(limb(0.06, 0.044, shinLen, bottoms));
    const ankle = group(knee, 0, -shinLen, 0);
    const foot = mesh(new THREE.CapsuleGeometry(0.046, 0.15, 2, 7), shoe, 0, -0.035, 0.045);
    foot.rotation.x = PI / 2;
    foot.scale.set(1, 1, 0.8);
    ankle.add(foot);
    legs.push({ hip, knee });
  }
  const pelvis = mesh(new THREE.SphereGeometry(female ? 0.15 : 0.142, 10, 6), bottoms, 0, -0.02, 0);
  pelvis.scale.set(1, 0.5, 0.64);
  hips.add(pelvis);
  const belt = mesh(new THREE.CylinderGeometry(female ? 0.152 : 0.146, female ? 0.152 : 0.146, 0.03, 10), mat("#2b2420", 0.2, 0.5), 0, 0.01, 0);
  belt.scale.z = 0.64;
  hips.add(belt);

  // ---- torso
  const spine = group(hips, 0, 0.03, 0);
  const profile = female
    ? [[0.152, -0.06], [0.155, 0], [0.16, 0.05], [0.135, 0.13], [0.112, 0.2], [0.13, 0.29], [0.148, 0.36], [0.148, 0.41], [0.11, 0.455], [0.05, 0.48]]
    : [[0.147, -0.06], [0.148, 0], [0.152, 0.05], [0.142, 0.14], [0.142, 0.22], [0.162, 0.32], [0.182, 0.41], [0.178, 0.46], [0.12, 0.5], [0.055, 0.525]];
  const torso = mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 10), top);
  torso.scale.z = 0.62;
  spine.add(torso);
  if (female) {
    for (const side of [-1, 1]) {
      const b = mesh(new THREE.SphereGeometry(0.056, 8, 6), top, side * 0.058, 0.33, 0.05);
      b.scale.set(1, 0.85, 0.6);
      spine.add(b);
    }
  }
  const shoulderY = female ? 0.42 : 0.455;
  const neckY = female ? 0.5 : 0.545;
  spine.add(mesh(new THREE.CylinderGeometry(0.043, 0.05, 0.11, 7), skin, 0, neckY, 0));

  // ---- arms: shoulder > elbow > hand
  const arms: { sh: THREE.Group; elbow: THREE.Group }[] = [];
  for (const side of [-1, 1]) {
    const sh = group(spine, side * (female ? 0.165 : 0.195), shoulderY, 0);
    sh.add(mesh(new THREE.SphereGeometry(female ? 0.05 : 0.058, 7, 5), top, 0, -0.01, 0));
    sh.add(limb(female ? 0.044 : 0.052, 0.038, 0.29, skin));
    const sleeve = limb(female ? 0.052 : 0.06, female ? 0.048 : 0.056, 0.14, top);
    sleeve.position.y = -0.065;
    sh.add(sleeve);
    const elbow = group(sh, 0, -0.29, 0);
    elbow.add(limb(0.038, 0.03, 0.25, skin));
    const hand = mesh(new THREE.BoxGeometry(0.05, 0.095, 0.028), skin, 0, -0.29, 0.005);
    elbow.add(hand);
    arms.push({ sh, elbow });
  }

  // ---- head
  const head = group(spine, 0, female ? 0.625 : 0.67, 0);
  head.scale.setScalar(1.08);
  const sx = female ? 0.84 : 0.88;
  const skull = mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
  skull.scale.set(sx, 1.13, 1);
  head.add(skull);
  const jaw = mesh(new THREE.SphereGeometry(0.068, 8, 6), skin, 0, -0.05, 0.016);
  jaw.scale.set(female ? 0.9 : 1.0, 0.72, 0.92);
  head.add(jaw);
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.022, 6, 5), skin, side * 0.088 * (sx / 0.88), -0.005, 0);
    ear.scale.set(0.45, 1, 0.75);
    head.add(ear);
    const white = mesh(new THREE.SphereGeometry(0.014, 7, 5), mat("#f2ede4", 0, 0.3), side * 0.034, 0.012, 0.084);
    white.scale.set(1.3, 0.75, 0.6);
    head.add(white);
    head.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), mat("#2a1a10", 0, 0.2), side * 0.034, 0.012, 0.092));
    const brow = mesh(new THREE.BoxGeometry(0.034, female ? 0.005 : 0.008, 0.01), hair, side * 0.035, 0.04, 0.091);
    brow.rotation.z = side * (female ? -0.15 : -0.05);
    head.add(brow);
  }
  const nose = mesh(new THREE.ConeGeometry(0.014, 0.042, 4), skin, 0, -0.008, 0.1);
  nose.rotation.x = PI / 2 - 0.35;
  head.add(nose);
  const lipColor = female ? "#9c4a4f" : new THREE.Color(s.skinColor).multiplyScalar(0.72).getStyle();
  const lips = mesh(new THREE.BoxGeometry(0.036, 0.011, 0.012), mat(lipColor, 0, 0.45), 0, -0.048, s.accessory === "beard" ? 0.1 : 0.09);
  head.add(lips);

  // hair
  const sw: THREE.Object3D[] = []; // parts that sway
  if (s.hair !== "bald") {
    const cap = mesh(new THREE.SphereGeometry(0.106, 10, 6, 0, 2 * PI, 0, PI * 0.5), hair, 0, 0.012, -0.012);
    cap.scale.set(sx + 0.02, 1.15, 1.03);
    cap.rotation.x = -0.42; // hairline sits on the forehead, lower at the back
    head.add(cap);
  }
  if (s.hair === "afro") {
    const a = mesh(new THREE.IcosahedronGeometry(0.16, 1), hair, 0, 0.06, -0.065);
    a.scale.set(1.02, 0.9, 0.85);
    head.add(a);
  }
  if (s.hair === "bun") head.add(mesh(new THREE.IcosahedronGeometry(0.055, 1), hair, 0, 0.11, -0.075));
  if (s.hair === "ponytail") {
    const tail = group(head, 0, 0.03, -0.1);
    tail.add(mesh(new THREE.SphereGeometry(0.03, 6, 5), hair));
    const cone = mesh(new THREE.ConeGeometry(0.045, 0.28, 6), hair, 0, -0.14, -0.02);
    cone.rotation.x = PI - 0.15;
    tail.add(cone);
    sw.push(tail);
  }
  if (s.hair === "braids" || s.hair === "dreads") {
    const braids = s.hair === "braids";
    const n = braids ? 14 : 16;
    const len = braids ? 0.34 : 0.21;
    for (let i = 0; i < n; i++) {
      const a = PI * 0.12 + (i / (n - 1)) * PI * 0.76; // back half of the head
      const strand = group(head, Math.cos(a) * 0.085 * (sx / 0.88), 0.02, -Math.sin(a) * 0.09);
      strand.rotation.z = Math.cos(a) * 0.12;
      strand.rotation.x = -0.08;
      strand.add(limb(braids ? 0.011 : 0.014, braids ? 0.008 : 0.012, len, hair, 5));
      sw.push(strand);
    }
  }

  // face extras
  if (s.accessory === "beard") {
    const beard = mesh(new THREE.SphereGeometry(0.104, 10, 6, 0, 2 * PI, PI * 0.66, PI * 0.34), hair, 0, -0.008, 0.006);
    beard.scale.set(sx + 0.02, 1.12, 1.02);
    head.add(beard);
  }
  if (s.accessory === "glasses") {
    const frame = mat("#1d1b19", 0.3, 0.4);
    for (const side of [-1, 1]) {
      head.add(mesh(new THREE.TorusGeometry(0.024, 0.0045, 4, 10), frame, side * 0.035, 0.012, 0.1));
      const arm = mesh(new THREE.BoxGeometry(0.004, 0.004, 0.1), frame, side * 0.083 * (sx / 0.88), 0.014, 0.05);
      head.add(arm);
    }
    head.add(mesh(new THREE.BoxGeometry(0.022, 0.004, 0.004), frame, 0, 0.018, 0.102));
  }
  if (s.accessory === "earrings") {
    for (const side of [-1, 1]) {
      head.add(mesh(new THREE.TorusGeometry(0.012, 0.0035, 4, 10), mat(GOLD, 0.8, 0.3), side * 0.086 * (sx / 0.88), -0.04, 0.004));
    }
  }

  // hats (sit higher on an afro)
  const lift = s.hair === "afro" ? 0.075 : 0;
  if (s.hat === "cap") {
    const dome = mesh(new THREE.SphereGeometry(0.112, 10, 5, 0, 2 * PI, 0, PI / 2), top, 0, 0.025, -0.004);
    dome.scale.set(sx + 0.04, 0.82, 1.06);
    head.add(dome);
    const brim = mesh(new THREE.BoxGeometry(0.15, 0.008, 0.1), top, 0, 0.03, 0.12);
    brim.rotation.x = 0.12;
    head.add(brim);
  }
  if (s.hat === "beanie") {
    const dome = mesh(new THREE.SphereGeometry(0.114, 10, 6, 0, 2 * PI, 0, PI / 2), top, 0, 0.022, -0.004);
    dome.scale.set(sx + 0.05, 1.05, 1.07);
    head.add(dome);
    const cuff = mesh(new THREE.TorusGeometry(0.1, 0.02, 5, 12), bottoms, 0, 0.03, -0.004);
    cuff.rotation.x = PI / 2;
    cuff.scale.set(sx + 0.06, 1.08, 1);
    head.add(cuff);
    head.add(mesh(new THREE.IcosahedronGeometry(0.032, 0), top, 0, 0.152, -0.01));
  }
  if (s.hat === "tophat") {
    const black = mat("#1b1a18", 0, 0.5);
    const h = group(head, 0, 0.1 + lift, -0.005);
    h.rotation.z = -0.08;
    h.add(mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.012, 12), black));
    h.add(mesh(new THREE.CylinderGeometry(0.085, 0.092, 0.17, 10), black, 0, 0.09, 0));
    h.add(mesh(new THREE.CylinderGeometry(0.094, 0.094, 0.03, 10), top, 0, 0.025, 0));
  }
  if (s.hat === "crown") {
    const gold = mat(GOLD, 0.85, 0.3);
    const c = group(head, 0, 0.1 + lift, -0.005);
    c.add(mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.05, 10, 1, true), gold));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      c.add(mesh(new THREE.ConeGeometry(0.018, 0.05, 4), gold, Math.sin(a) * 0.08, 0.045, Math.cos(a) * 0.08));
    }
    c.add(mesh(new THREE.OctahedronGeometry(0.012), mat("#d6263b", 0.2, 0.2), 0, 0.005, 0.086));
  }

  // body extras
  if (s.accessory === "scarf") {
    const sc = mat(SCARF, 0, 0.9);
    const ring = mesh(new THREE.TorusGeometry(0.068, 0.03, 6, 12), sc, 0, neckY - 0.04, 0.005);
    ring.rotation.x = PI / 2 - 0.15;
    ring.scale.set(1.05, 0.85, 1);
    spine.add(ring);
    const tail = mesh(new THREE.BoxGeometry(0.06, 0.2, 0.022), sc, 0.06, neckY - 0.15, 0.085);
    tail.rotation.z = 0.08;
    spine.add(tail);
  }
  if (s.accessory === "backpack") {
    const lea = mat(LEATHER, 0, 0.7);
    const zBack = female ? -0.1 : -0.115;
    spine.add(mesh(new THREE.BoxGeometry(0.26, 0.32, 0.12), lea, 0, 0.3, zBack - 0.06));
    spine.add(mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), mat("#57391f", 0, 0.7), 0, 0.22, zBack - 0.13));
    for (const side of [-1, 1]) {
      const strap = mesh(new THREE.BoxGeometry(0.035, 0.36, 0.02), lea, side * 0.085, 0.29, female ? 0.085 : 0.095);
      strap.rotation.x = -0.12;
      spine.add(strap);
      const over = mesh(new THREE.BoxGeometry(0.035, 0.02, 0.22), lea, side * 0.085, shoulderY + 0.03, -0.02);
      spine.add(over);
    }
  }

  // ---- idle animation: breathing, weight shift, looking around
  const restArm = female ? 0.1 : 0.13;
  const WAVE = 1.8; // seconds
  let waveStart = -10;
  let now = 0;
  function update(t: number) {
    now = t;
    const shift = Math.sin(t * 0.7);
    hips.position.x = shift * 0.012;
    hips.rotation.z = shift * 0.025;
    spine.rotation.z = -shift * 0.03;
    spine.rotation.x = Math.sin(t * 1.5) * 0.01;
    torso.scale.y = 1 + Math.sin(t * 1.5) * 0.008;
    legs[0].knee.rotation.x = Math.max(0, shift) * 0.08;
    legs[1].knee.rotation.x = Math.max(0, -shift) * 0.08;
    legs[0].hip.rotation.z = -shift * 0.025;
    legs[1].hip.rotation.z = -shift * 0.025;
    // look around slowly, with a pause in the middle
    const look = Math.sin(t * 0.42);
    head.rotation.y = Math.sign(look) * Math.pow(Math.abs(look), 1.6) * 0.45;
    head.rotation.x = Math.sin(t * 0.31) * 0.06 - 0.02;
    head.rotation.z = shift * 0.02;
    arms.forEach(({ sh, elbow }, i) => {
      const side = i === 0 ? -1 : 1;
      sh.rotation.z = side * (restArm + Math.sin(t * 1.5 + i) * 0.015);
      sh.rotation.x = Math.sin(t * 0.7 + i * PI) * 0.05;
      elbow.rotation.x = -0.14 - Math.sin(t * 0.9 + i) * 0.04;
    });
    // click reaction: right arm up and waving, a small bounce, head tilts toward you
    const w = (t - waveStart) / WAVE;
    if (w >= 0 && w < 1) {
      const ease = Math.sin(Math.min(1, w * 4) * PI / 2) * Math.sin(Math.min(1, (1 - w) * 4) * PI / 2);
      const { sh, elbow } = arms[1];
      sh.rotation.z = THREE.MathUtils.lerp(sh.rotation.z, 2.5, ease);
      sh.rotation.x = THREE.MathUtils.lerp(sh.rotation.x, -0.25, ease);
      elbow.rotation.x = THREE.MathUtils.lerp(elbow.rotation.x, 0, ease);
      elbow.rotation.z = Math.sin(t * 11) * 0.45 * ease;
      head.rotation.y *= 1 - ease;
      head.rotation.z = 0.12 * ease;
      const bounce = Math.max(0, Math.sin(w * PI * 2)) * 0.03 * (1 - w);
      hips.position.y = hipY + bounce;
    } else {
      arms[1].elbow.rotation.z = 0;
      hips.position.y = hipY;
    }
    for (let i = 0; i < sw.length; i++) sw[i].rotation.x = -0.08 + Math.sin(t * 1.3 + i * 0.3) * 0.04 - head.rotation.x;
  }
  update(0);

  return {
    root,
    head,
    update,
    wave() {
      if (now - waveStart > WAVE * 0.8) waveStart = now;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

/** Studio lights shared by the preview and the face picture. */
export function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight("#ffffff", "#8b8f6e", 1.5));
  const key = new THREE.DirectionalLight("#fff6e8", 2.4);
  key.position.set(1.5, 2.5, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#e9ffd0", 1.6);
  rim.position.set(-2, 2, -2.5);
  scene.add(rim);
}
