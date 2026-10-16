// The park's sky follows the time of day on the player's own clock: dawn, a bright midday with a sharp
// sun, a vibrant afternoon, a golden dusk, and a dark night with a moon and stars.
import * as THREE from "three";

type Look = {
  sky: string;
  fog: string;
  hemiSky: string; // light from above
  hemiGround: string; // light bounced back up from the grass
  hemi: number;
  sun: string;
  sunPower: number;
  moon: number; // moonlight
  stars: number; // 0 hidden, 1 fully out
};

// How the park looks at certain hours; the hours in between are blended. The look at 7:30 is the
// park's original look, which is dawn.
const LOOKS: [number, Look][] = [
  [0, { sky: "#070b1e", fog: "#0b1233", hemiSky: "#5a72b8", hemiGround: "#1c2a44", hemi: 0.55, sun: "#ffb98a", sunPower: 0, moon: 0.9, stars: 1 }],
  [5, { sky: "#070b1e", fog: "#0b1233", hemiSky: "#5a72b8", hemiGround: "#1c2a44", hemi: 0.55, sun: "#ffb98a", sunPower: 0, moon: 0.9, stars: 1 }],
  [5.75, { sky: "#3a3f73", fog: "#4a4f82", hemiSky: "#8b8fc8", hemiGround: "#3a3a4a", hemi: 0.65, sun: "#ffb98a", sunPower: 0.4, moon: 0.5, stars: 0.4 }],
  [6.5, { sky: "#f3b58a", fog: "#f0c9a8", hemiSky: "#ffe0c0", hemiGround: "#6f9a45", hemi: 0.9, sun: "#ffc58a", sunPower: 1.8, moon: 0, stars: 0 }],
  [7.5, { sky: "#bfe3f7", fog: "#d4ecf6", hemiSky: "#e4f4ff", hemiGround: "#6f9a45", hemi: 1.15, sun: "#fff3d6", sunPower: 2.6, moon: 0, stars: 0 }],
  [10, { sky: "#9bd5f6", fog: "#cdeaf7", hemiSky: "#ecf7ff", hemiGround: "#78a74a", hemi: 1.1, sun: "#fff6dc", sunPower: 2.6, moon: 0, stars: 0 }],
  [12.5, { sky: "#5db4f0", fog: "#c3e3f4", hemiSky: "#f2f9ff", hemiGround: "#7fae4f", hemi: 1.0, sun: "#ffffff", sunPower: 2.7, moon: 0, stars: 0 }],
  [15.5, { sky: "#52b0f4", fog: "#c9e7f6", hemiSky: "#eef8ff", hemiGround: "#86b452", hemi: 1.15, sun: "#fff1c4", sunPower: 3.3, moon: 0, stars: 0 }],
  [17.5, { sky: "#f5c48a", fog: "#f0d3b0", hemiSky: "#ffe3c0", hemiGround: "#7a9448", hemi: 1.15, sun: "#ffbf70", sunPower: 3.0, moon: 0, stars: 0 }],
  [18.5, { sky: "#c9788a", fog: "#b98aa0", hemiSky: "#c9a0c0", hemiGround: "#4a4a5a", hemi: 0.7, sun: "#ff9a70", sunPower: 0.7, moon: 0.1, stars: 0.1 }],
  [19.5, { sky: "#1a1d4a", fog: "#242a5a", hemiSky: "#6a7ab8", hemiGround: "#26324a", hemi: 0.55, sun: "#ff9a70", sunPower: 0, moon: 0.8, stars: 0.8 }],
  [20.5, { sky: "#070b1e", fog: "#0b1233", hemiSky: "#5a72b8", hemiGround: "#1c2a44", hemi: 0.55, sun: "#ffb98a", sunPower: 0, moon: 0.9, stars: 1 }],
  [24, { sky: "#070b1e", fog: "#0b1233", hemiSky: "#5a72b8", hemiGround: "#1c2a44", hemi: 0.55, sun: "#ffb98a", sunPower: 0, moon: 0.9, stars: 1 }],
];

type Blend = { sky: THREE.Color; fog: THREE.Color; hemiSky: THREE.Color; hemiGround: THREE.Color; hemi: number; sun: THREE.Color; sunPower: number; moon: number; stars: number };

const PARSED = LOOKS.map(([hour, look]) => ({
  hour,
  sky: new THREE.Color(look.sky),
  fog: new THREE.Color(look.fog),
  hemiSky: new THREE.Color(look.hemiSky),
  hemiGround: new THREE.Color(look.hemiGround),
  hemi: look.hemi,
  sun: new THREE.Color(look.sun),
  sunPower: look.sunPower,
  moon: look.moon,
  stars: look.stars,
}));

const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** The look at an hour of the day (0 to 24), blended between the two nearest looks. */
function lookAt(hour: number): Blend {
  let i = 1;
  while (i < PARSED.length - 1 && PARSED[i].hour <= hour) i++;
  const a = PARSED[i - 1];
  const b = PARSED[i];
  const k = (hour - a.hour) / (b.hour - a.hour);
  return {
    sky: a.sky.clone().lerp(b.sky, k),
    fog: a.fog.clone().lerp(b.fog, k),
    hemiSky: a.hemiSky.clone().lerp(b.hemiSky, k),
    hemiGround: a.hemiGround.clone().lerp(b.hemiGround, k),
    hemi: mix(a.hemi, b.hemi, k),
    sun: a.sun.clone().lerp(b.sun, k),
    sunPower: mix(a.sunPower, b.sunPower, k),
    moon: mix(a.moon, b.moon, k),
    stars: mix(a.stars, b.stars, k),
  };
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Where something on its way across the sky is. t runs 0 to 1 from rising (in the east) to setting
 * (in the west); elevation is in degrees above the horizon. Returns a unit vector.
 */
function skyDirection(t: number, elevation: number) {
  const el = rad(elevation);
  const flat = new THREE.Vector2(0.75 * Math.cos(Math.PI * t), -0.66).normalize();
  return new THREE.Vector3(flat.x * Math.cos(el), Math.sin(el), flat.y * Math.cos(el));
}

// The sun is up from 6:00 to 18:00 and the moon from 18:00 to 6:00.
const sunProgress = (hour: number) => (hour - 6) / 12;
const moonProgress = (hour: number) => ((hour + 6) % 24) / 12;
const sunElevation = (t: number) => 75 * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) ** 2;
// The moon travels low across the sky so it is in view from the player's camera, which looks out
// level with the horizon. Its light comes from higher up (see moonLightDir) so the night has shadows.
const moonElevation = (t: number) => 10 * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) ** 0.8;

const SHADOW = { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 };

/** shadowSize: how sharp the shadows are, in pixels; phones use fewer. */
export function buildSky(scene: THREE.Scene, shadowSize = 2048) {
  scene.background = new THREE.Color("#bfe3f7");
  scene.fog = new THREE.Fog("#d4ecf6", 45, 150);

  const hemi = new THREE.HemisphereLight("#e4f4ff", "#6f9a45", 1.15);
  const sun = new THREE.DirectionalLight("#fff3d6", 2.6);
  const moon = new THREE.DirectionalLight("#a9c1ff", 0.9);
  for (const light of [sun, moon]) {
    light.castShadow = true;
    light.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(light.shadow.camera, SHADOW);
    light.shadow.bias = -0.0005;
  }
  scene.add(hemi, sun, sun.target, moon, moon.target);

  // Things in the sky are drawn far away and follow the player, so they never get closer.
  const sky = new THREE.Group();
  scene.add(sky);

  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshBasicMaterial({ color: "#fff1b0", fog: false }));
  const sunGlow = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ color: "#fff6cf", transparent: true, opacity: 0.45, fog: false }));
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshBasicMaterial({ color: "#eef2fc", fog: false }));
  const moonGlow = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshBasicMaterial({ color: "#9db8ff", transparent: true, opacity: 0.28, fog: false }));
  // A few darker patches so the moon doesn't look like a flat coin.
  for (const [x, y, r] of [[-2, 1.6, 1.6], [2.2, -1.2, 1.1], [0.4, -3, 0.8], [-2.6, -2, 0.7]]) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: "#c9d3ea", fog: false }));
    patch.position.set(x, y, 0.05);
    moonDisc.add(patch);
  }
  sky.add(sunGlow, sunDisc, moonGlow, moonDisc);

  const STARS = 700;
  const starPositions: number[] = [];
  let seed = 20261016;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < STARS; i++) {
    const a = rand() * Math.PI * 2;
    const y = 0.04 + rand() * 0.96; // above the horizon
    const flat = Math.sqrt(1 - y * y);
    starPositions.push(Math.cos(a) * flat * 330, y * 330, Math.sin(a) * flat * 330);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  sky.add(stars);

  const sunLightDir = new THREE.Vector3();
  const moonLightDir = new THREE.Vector3();

  /**
   * Sets the sky for an hour of the day (0 to 24, with fractions). Returns the flat direction of
   * what is in the sky, the sun by day and the moon by night, and whether it is the moon.
   */
  function setTime(hourOfDay: number) {
    const hour = ((hourOfDay % 24) + 24) % 24;
    const look = lookAt(hour);

    (scene.background as THREE.Color).copy(look.sky);
    (scene.fog as THREE.Fog).color.copy(look.fog);
    hemi.color.copy(look.hemiSky);
    hemi.groundColor.copy(look.hemiGround);
    hemi.intensity = look.hemi;

    const st = sunProgress(hour);
    const sunUp = st >= 0 && st <= 1;
    const sunEl = sunElevation(st);
    sunLightDir.copy(skyDirection(Math.min(Math.max(st, 0), 1), Math.max(sunEl, 4)));
    sun.color.copy(look.sun);
    sun.intensity = look.sunPower;
    sun.visible = look.sunPower > 0.01;
    sunDisc.visible = sunGlow.visible = sunUp;
    if (sunUp) {
      const where = skyDirection(st, sunEl).multiplyScalar(260);
      sunDisc.position.copy(where);
      sunGlow.position.copy(where).addScaledVector(where.clone().normalize(), 1);
      sunDisc.lookAt(0, 0, 0);
      sunGlow.lookAt(0, 0, 0);
      (sunDisc.material as THREE.MeshBasicMaterial).color.copy(look.sun).lerp(new THREE.Color("#ffffff"), 0.45);
    }

    const mt = moonProgress(hour);
    const moonUp = mt >= 0 && mt <= 1;
    const moonEl = moonElevation(mt);
    moonLightDir.copy(skyDirection(Math.min(Math.max(mt, 0), 1), 30 + moonEl * 1.5));
    moon.intensity = look.moon;
    moon.visible = look.moon > 0.01;
    moonDisc.visible = moonGlow.visible = moonUp && look.stars > 0.05;
    if (moonDisc.visible) {
      const where = skyDirection(mt, moonEl).multiplyScalar(260);
      moonDisc.position.copy(where);
      moonGlow.position.copy(where).addScaledVector(where.clone().normalize(), 1);
      moonDisc.lookAt(0, 0, 0);
      moonGlow.lookAt(0, 0, 0);
    }

    starMat.opacity = look.stars;
    stars.visible = look.stars > 0.01;

    const main = sunUp ? skyDirection(st, sunEl) : skyDirection(Math.min(Math.max(mt, 0), 1), moonEl);
    return { dir: new THREE.Vector3(main.x, 0, main.z).normalize(), moon: !sunUp };
  }

  return {
    setTime,
    /** Keeps the shadows, the sun and the moon around whoever the camera follows. */
    update(focus: THREE.Vector3) {
      sun.target.position.copy(focus);
      sun.position.copy(focus).addScaledVector(sunLightDir, 60);
      moon.target.position.copy(focus);
      moon.position.copy(focus).addScaledVector(moonLightDir, 60);
      sky.position.copy(focus);
    },
  };
}
