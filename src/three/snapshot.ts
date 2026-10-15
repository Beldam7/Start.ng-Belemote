// Renders the character's head to a small picture for the profile circle.
import * as THREE from "three";
import { CharacterStyle } from "../character";
import { addLights, buildHuman } from "./human";

const SIZE = 192;
const cache = new Map<string, string>();
let renderer: THREE.WebGLRenderer | null = null;

export function faceImage(style: CharacterStyle): string {
  const key = JSON.stringify(style);
  const hit = cache.get(key);
  if (hit) return hit;

  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
  }
  const scene = new THREE.Scene();
  addLights(scene);
  const human = buildHuman(style);
  human.head.rotation.set(0, 0, 0);
  scene.add(human.root);
  scene.updateMatrixWorld(true);

  const target = new THREE.Vector3();
  human.head.getWorldPosition(target);
  target.y += 0.035;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 10);
  camera.position.set(target.x + 0.14, target.y + 0.03, target.z + 1.0);
  camera.lookAt(target);

  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  human.dispose();
  cache.set(key, url);
  return url;
}
