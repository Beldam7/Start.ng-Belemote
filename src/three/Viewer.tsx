import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DressedStyle } from "../character";
import { addLights, buildHuman, Human } from "./human";

type Props = { style: DressedStyle; className?: string; interactive?: boolean };

const DRAG_SPEED = 0.006; // radians per pixel: one full turn is about 1000px of drag
const CLICK_SLOP = 5; // pixels a press can move and still count as a click

/** The character in 3D, always moving. Click to wave; hold and drag to turn it. */
export default function Viewer({ style, className, interactive = true }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ setStyle: (s: DressedStyle) => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    addLights(scene);
    // soft reflections from a simple studio room, so skin and gold pick up light from all sides
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.35;
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
    camera.position.set(0, 1.05, 4.3);
    camera.lookAt(0, 0.88, 0);

    // soft round shadow on the floor
    const shadowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(0,0,0,.28)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    // the light's shadow, falling on an invisible floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    floor.receiveShadow = true;
    scene.add(floor);

    const turntable = new THREE.Group();
    scene.add(turntable);
    let human: Human | null = null;
    const setStyle = (s: DressedStyle) => {
      if (human) {
        turntable.remove(human.root);
        human.dispose();
      }
      human = buildHuman(s);
      turntable.add(human.root);
    };
    setStyle(style);
    api.current = { setStyle };

    // drag to turn, with a gentle glide after letting go
    let yaw = 0.35;
    let velocity = 0;
    let dragging = false;
    let pressX = 0;
    let lastX = 0;
    let moved = 0;
    const down = (e: PointerEvent) => {
      if (!interactive) return;
      dragging = true;
      pressX = lastX = e.clientX;
      moved = 0;
      velocity = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add("grabbing");
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved = Math.max(moved, Math.abs(e.clientX - pressX));
      yaw += dx * DRAG_SPEED;
      velocity = dx * DRAG_SPEED;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("grabbing");
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (moved < CLICK_SLOP) human?.wave();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the whole body in view on narrow or short boxes
      camera.position.z = Math.max(4.3, 3.1 / Math.min(1, camera.aspect * 1.6));
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (!dragging) {
        yaw += velocity;
        velocity *= Math.pow(0.04, dt); // glide to a stop in about a second
      }
      turntable.rotation.y = yaw;
      human?.update(t);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      human?.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      shadowTex.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, [interactive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild the model when the look changes, keeping the same scene and angle.
  useEffect(() => {
    api.current?.setStyle(style);
  }, [style]);

  return <div ref={host} className={`viewer ${interactive ? "interactive" : ""} ${className ?? ""}`} />;
}
