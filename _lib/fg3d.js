// FirstGlance shared 3D helpers (three.js r160)
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export {THREE};
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function base(canvas, {fov = 32, cam = [0, 2, 8], look = [0, 1, 0], env = .8, shadows = false, exposure = 1.05} = {}) {
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = exposure;
  if (shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
  const s = new THREE.Scene(); s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture; s.environmentIntensity = env;
  const c = new THREE.PerspectiveCamera(fov, 1, .1, 200); c.position.set(...cam); c.lookAt(...look);
  s.add(new THREE.HemisphereLight(0xfff4e8, 0x40302a, .6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 5);
  if (shadows) { key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left: -6, right: 6, top: 6, bottom: -6}); key.shadow.radius = 4; key.shadow.bias = -.0004; }
  s.add(key);
  const rim = new THREE.DirectionalLight(0xffd9c0, 1.2); rim.position.set(-5, 3, -4); s.add(rim);
  const look3 = new THREE.Vector3(...look);
  function size() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setSize(w, h, false); c.aspect = w / h; c.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(canvas); size();
  return {r, s, c, key, rim, look: look3};
}
export function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
export function shadowDisc(size = 4, alpha = .45) {
  const t = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, `rgba(30,20,15,${alpha})`); g.addColorStop(1, 'rgba(30,20,15,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false}));
  m.rotation.x = -Math.PI / 2; return m;
}
export function drag(canvas, obj, {auto = .004} = {}) {
  let d = false, lx = 0, v = 0;
  canvas.addEventListener('pointerdown', e => { d = true; lx = e.clientX; });
  addEventListener('pointerup', () => d = false);
  addEventListener('pointermove', e => { if (!d) return; v = (e.clientX - lx) * .012; obj.rotation.y += v; lx = e.clientX; });
  return () => { if (!d) { v *= .94; obj.rotation.y += v + (reduce ? 0 : auto); } };
}
export function onVisible(el) { const st = {v: true}; new IntersectionObserver(es => st.v = es[0].isIntersecting, {rootMargin: '120px'}).observe(el); return st; }
// soft sparkles / bubbles drifting up
export function floaters(n, {color = 0xffffff, r = .05, spread = 3, height = 4, opacity = .7, physical = false} = {}) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(r, 14, 10);
  for (let i = 0; i < n; i++) {
    const mat = physical ? new THREE.MeshPhysicalMaterial({color, roughness: .05, transmission: .9, thickness: .2, transparent: true, opacity, iridescence: 1, iridescenceIOR: 1.3}) : new THREE.MeshBasicMaterial({color, transparent: true, opacity});
    const m = new THREE.Mesh(geo, mat); m.userData = {x: (rnd(i) - .5) * spread, z: (rnd(i + 1) - .5) * spread, o: rnd(i + 2), s: .4 + rnd(i + 3) * 1.2, sp: .08 + rnd(i + 4) * .12};
    g.add(m);
  }
  g.userData.tick = t => g.children.forEach((m, i) => { const u = m.userData; const k = (u.o + t * u.sp) % 1; m.position.set(u.x + Math.sin(t + i) * .15, k * height, u.z); m.scale.setScalar(u.s * (1 - Math.abs(k - .5) * .6)); m.material.opacity = opacity * Math.sin(k * Math.PI); });
  return g;
}
// split words into letter spans for a staggered CSS reveal
export function splitLetters(el, delay = 0) {
  el.innerHTML = el.innerHTML.split(/(<br>)/).map(part => part === '<br>' ? part : part.split(' ').map(w => '<span class="w">' + [...w].map((ch, i) => `<span class="l" style="animation-delay:${delay + i * .04}s">${ch}</span>`).join('') + '</span>').join(' ')).join('');
}
