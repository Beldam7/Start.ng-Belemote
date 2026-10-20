// The park: open grass, trees, flowers and a path. Built from a fixed seed so every player sees
// exactly the same park. The sky, sun and moon are in sky.ts and follow the time of day.
import * as THREE from "three";
import { buildSky } from "./sky";

// ---- seats: 60 places on 20 benches in two rings around the path, all facing the middle.
// Seat numbers come from the server; everyone computes the same spots from them.
export const SEAT_HEIGHT = 0.49;
const BENCH_WIDTH = 2.0;
const SEATS_PER_BENCH = 3;
const BENCHES: { position: THREE.Vector3; ry: number }[] = [];
for (const [count, radius, turn] of [[8, 12.4, 0.2], [12, 16.8, 0]]) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + turn;
    const position = new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    BENCHES.push({ position, ry: Math.atan2(-position.x, -position.z) }); // +z faces the middle
  }
}
export const SEAT_COUNT = BENCHES.length * SEATS_PER_BENCH;

/** Where seat n is: sit (on the bench), stand (just in front of it) and ry (facing the middle). */
export function seatSpot(n: number) {
  const b = BENCHES[Math.floor(n / SEATS_PER_BENCH) % BENCHES.length];
  const slot = ((n % SEATS_PER_BENCH) - 1) * 0.62;
  const along = (forward: number) => new THREE.Vector3(slot, 0, forward).applyAxisAngle(new THREE.Vector3(0, 1, 0), b.ry).add(b.position);
  return { sit: along(0.04), stand: along(0.95), ry: b.ry };
}

// ---- collision: benches are rotated boxes, tree trunks are circles. Players are a circle of PLAYER_RADIUS.
export const PLAYER_RADIUS = 0.3;
const BENCH_HALF_X = BENCH_WIDTH / 2; // along the bench
const BENCH_BACK_Z = -0.3; // behind the backrest
const BENCH_FRONT_Z = 0.26; // the front edge of the seat
type Circle = { x: number; z: number; r: number };

/** Moves a circle at (x, z) out of a bench, so it slides along the bench instead of going through it. */
function outOfBench(x: number, z: number, r: number, b: { position: THREE.Vector3; ry: number }): [number, number] {
  // into the bench's own frame: +x along the seat, +z out the front
  const cos = Math.cos(b.ry), sin = Math.sin(b.ry);
  const dx = x - b.position.x, dz = z - b.position.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  const cx = THREE.MathUtils.clamp(lx, -BENCH_HALF_X, BENCH_HALF_X);
  const cz = THREE.MathUtils.clamp(lz, BENCH_BACK_Z, BENCH_FRONT_Z);
  const ox = lx - cx, oz = lz - cz;
  const d = Math.hypot(ox, oz);
  if (d >= r) return [x, z];
  let nx: number, nz: number;
  if (d > 1e-6) {
    // touching an edge or corner: push straight out from the closest point
    nx = cx + (ox / d) * r;
    nz = cz + (oz / d) * r;
  } else {
    // the centre is inside the box (rare: a very fast step): leave by the nearest side
    const exits: [number, number, number][] = [ // [distance, new x, new z]
      [BENCH_HALF_X - lx, BENCH_HALF_X + r, lz],
      [lx + BENCH_HALF_X, -BENCH_HALF_X - r, lz],
      [BENCH_FRONT_Z - lz, lx, BENCH_FRONT_Z + r],
      [lz - BENCH_BACK_Z, lx, BENCH_BACK_Z - r],
    ];
    exits.sort((a, b2) => a[0] - b2[0]);
    [, nx, nz] = exits[0];
  }
  // back to the park's frame
  return [b.position.x + nx * cos + nz * sin, b.position.z - nx * sin + nz * cos];
}

function outOfCircle(x: number, z: number, r: number, c: Circle): [number, number] {
  const dx = x - c.x, dz = z - c.z;
  const d = Math.hypot(dx, dz);
  const min = r + c.r;
  if (d >= min) return [x, z];
  if (d < 1e-6) return [c.x + min, z];
  return [c.x + (dx / d) * min, c.z + (dz / d) * min];
}

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Adds the park to the scene. Returns { setTime(hour), update(focus) } for the sky. */
export function buildPark(scene: THREE.Scene, shadowSize = 2048) {
  const rand = seeded(20261015);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const color = new THREE.Color();

  const sky = buildSky(scene, shadowSize);

  // Grass: a big field with gently varying greens.
  const groundGeo = new THREE.PlaneGeometry(420, 420, 140, 140);
  groundGeo.rotateX(-Math.PI / 2);
  const colors = [];
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const n = Math.sin(x * 0.11) * Math.cos(z * 0.09) + Math.sin(x * 0.031 + z * 0.047) * 0.8;
    color.setHSL(0.27 + n * 0.012, 0.5, 0.42 + n * 0.035);
    colors.push(color.r, color.g, color.b);
  }
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);

  const dummy = new THREE.Object3D();
  const place = (inst: THREE.InstancedMesh, i: number, x: number, y: number, z: number, s = 1, ry = 0) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  };

  // Grass tufts, thick near the middle and thinning out.
  const BLADES = 9000;
  const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.035, 0.32, 3).translate(0, 0.16, 0), new THREE.MeshStandardMaterial({ roughness: 1 }), BLADES);
  for (let i = 0; i < BLADES; i++) {
    const r = Math.sqrt(rand()) * 75;
    const a = rand() * Math.PI * 2;
    place(blades, i, Math.cos(a) * r, 0, Math.sin(a) * r, between(0.6, 1.4), rand() * 6);
    blades.setColorAt(i, color.setHSL(between(0.24, 0.31), between(0.45, 0.6), between(0.32, 0.46)));
  }
  scene.add(blades);

  // Flowers dotted around.
  const FLOWERS = 500;
  const petals = ["#ffffff", "#ffe066", "#ff9ec7", "#c9a7ff", "#ffb347"];
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 0).translate(0, 0.22, 0), new THREE.MeshStandardMaterial({ roughness: 0.8 }), FLOWERS);
  for (let i = 0; i < FLOWERS; i++) {
    const r = between(4, 70);
    const a = rand() * Math.PI * 2;
    place(flowers, i, Math.cos(a) * r, 0, Math.sin(a) * r, between(0.8, 1.3));
    flowers.setColorAt(i, color.set(petals[Math.floor(rand() * petals.length)]));
  }
  scene.add(flowers);

  // A round path around the middle, with the benches around it.
  const path = new THREE.Mesh(new THREE.RingGeometry(9, 10.6, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#e6dbbd", roughness: 1 }));
  path.position.y = 0.01;
  path.receiveShadow = true;
  scene.add(path);
  const wood = new THREE.MeshStandardMaterial({ color: "#8a5a35", roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: "#2f3a2c", roughness: 0.5, metalness: 0.4 });
  // Benches: one seat for each start.ng user who has one (see seatSpot).
  for (const b of BENCHES) {
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(BENCH_WIDTH, 0.08, 0.5), wood);
    seat.position.y = SEAT_HEIGHT - 0.04;
    const back = new THREE.Mesh(new THREE.BoxGeometry(BENCH_WIDTH, 0.42, 0.06), wood);
    back.position.set(0, 0.74, -0.24);
    back.rotation.x = -0.12;
    bench.add(seat, back);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, SEAT_HEIGHT - 0.04, 0.44), metal);
      leg.position.set(side * (BENCH_WIDTH / 2 - 0.12), (SEAT_HEIGHT - 0.04) / 2, 0);
      bench.add(leg);
    }
    bench.traverse((o) => { o.castShadow = o.receiveShadow = true; });
    bench.position.copy(b.position);
    bench.rotation.y = b.ry;
    scene.add(bench);
  }

  // Trees: a few near the path, a loose ring further out, and woods at the edge.
  const spots = [];
  for (let i = 0; i < 8; i++) spots.push([between(21, 27), rand() * Math.PI * 2]);
  for (let i = 0; i < 45; i++) spots.push([between(28, 55), rand() * Math.PI * 2]);
  for (let i = 0; i < 80; i++) spots.push([between(60, 110), rand() * Math.PI * 2]);
  const treeCircles: Circle[] = [];
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 2.2, 7).translate(0, 1.1, 0), new THREE.MeshStandardMaterial({ color: "#6b4a2f", roughness: 0.9 }), spots.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5, 1).translate(0, 3.2, 0), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), spots.length);
  spots.forEach(([r, a], i) => {
    const s = between(0.8, 1.5);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    place(trunks, i, x, 0, z, s);
    treeCircles.push({ x, z, r: 0.26 * s }); // the trunk at the ground
    place(crowns, i, x, 0, z, s, rand() * 6);
    crowns.setColorAt(i, color.setHSL(between(0.25, 0.33), between(0.4, 0.55), between(0.26, 0.36)));
  });
  for (const m of [trunks, crowns]) m.castShadow = m.receiveShadow = true;
  scene.add(trunks, crowns);

  /** Where a player stepping from (fromX, fromZ) to (x, z) ends up: pushed out of benches and tree trunks, so they stop
   * at them and slide around them. In the odd pocket where two trunks overlap and there's no free spot, they stay put. */
  function collide(x: number, z: number, fromX = x, fromZ = z, r = PLAYER_RADIUS): { x: number; z: number } {
    for (let pass = 0; pass < 4; pass++) {
      const [px, pz] = [x, z];
      for (const b of BENCHES) {
        if (Math.abs(x - b.position.x) < 2 && Math.abs(z - b.position.z) < 2) [x, z] = outOfBench(x, z, r, b);
      }
      for (const t of treeCircles) {
        if (Math.abs(x - t.x) < 1 && Math.abs(z - t.z) < 1) [x, z] = outOfCircle(x, z, r, t);
      }
      if (x === px && z === pz) return { x, z }; // clear of everything
    }
    return { x: fromX, z: fromZ };
  }

  return { setTime: sky.setTime, update: sky.update, collide };
}
