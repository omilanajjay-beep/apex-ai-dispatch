'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SOURCES = ['/hvac-service.webp', '/hvac-detail.jpg', '/hvac-heatpump.jpg', '/hvac-detail.jpg', '/apex-ai-technicians.jpg', '/hvac-heatpump.jpg', '/hvac-service.webp', '/hvac-detail.jpg', '/hvac-heatpump.jpg', '/apex-ai-technicians.jpg', '/hvac-service.webp', '/hvac-heatpump.jpg'];
const SHEET_COUNT = 12;

/** Fixed decorative scene; the page DOM remains the accessible source of truth. */
export default function ComfortScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount || typeof window === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Do not create a canvas at all for reduced-motion users: the page's DOM images remain visible.
    if (reduced.matches) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';
    mount.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      canvas.remove();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 12);
    const sheets = new THREE.Group();
    scene.add(sheets);
    const clock = new THREE.Clock();
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const materials: THREE.ShaderMaterial[] = [];
    const sheetMeshes: THREE.Mesh[] = [];
    const serviceTargets: THREE.Vector3[] = Array.from({ length: SHEET_COUNT }, () => new THREE.Vector3());
    const serviceScales: THREE.Vector2[] = Array.from({ length: SHEET_COUNT }, () => new THREE.Vector2(1, 1));
    const fibonacciTargets: THREE.Vector3[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(10, 10);
    const pointerWorld = new THREE.Vector2(0.5, 0.5);
    let hoverIndex = -1;
    let eventHoverIndex = -1;
    let frame = 0;
    let lastScroll = window.scrollY;
    let scrollVelocity = 0;
    let alive = true;
    let loaded = 0;
    let allTexturesReady = false;
    let serviceVisible = false;
    let finaleVisible = false;
    let visitVisible = false;

    const experience = document.querySelector('.experience');
    const markReady = () => {
      loaded += 1;
      if (loaded >= SHEET_COUNT * 2 && !allTexturesReady) {
        allTexturesReady = true;
        experience?.setAttribute('data-webgl-ready', 'true');
      }
    };
    const textureFor = (index: number) => {
      const texture = loader.load(SOURCES[index % SOURCES.length], markReady, undefined, markReady);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      textures.push(texture);
      return texture;
    };

    const vertex = `
      uniform float uTime;
      uniform float uWind;
      uniform float uHover;
      uniform vec2 uDent;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float edge = sin(uv.y * 3.14159);
        p.z += sin(p.y * 1.9 + uTime * 0.65 + p.x * 0.8) * 0.075 * uWind * edge;
        p.z += cos(p.x * 2.5 - uTime * 0.42) * 0.025 * uWind;
        float d = distance(uv, uDent);
        p.z -= uHover * exp(-d * d * 42.0) * 0.28;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `;
    const fragment = `
      uniform sampler2D uTexture;
      uniform sampler2D uTextureB;
      uniform float uTime;
      uniform float uBlend;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 drift = vec2(sin(uTime * 0.12) * 0.012, cos(uTime * 0.1) * 0.009);
        vec4 a = texture2D(uTexture, vUv + drift);
        vec4 b = texture2D(uTextureB, vUv - drift * 0.7);
        vec4 color = mix(a, b, smoothstep(0.16, 0.9, uBlend));
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `;

    for (let i = 0; i < SHEET_COUNT; i += 1) {
      const geometry = new THREE.PlaneGeometry(1, 1, 14, 10);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: textureFor(i) }, uTextureB: { value: textureFor(i + 1) },
          uTime: { value: 0 }, uWind: { value: 1 }, uHover: { value: 0 },
          uDent: { value: new THREE.Vector2(0.5, 0.5) }, uBlend: { value: 0 }, uOpacity: { value: 0.88 },
        }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.index = i;
      mesh.visible = false;
      sheets.add(mesh); sheetMeshes.push(mesh); materials.push(material);
    }

    // A Fibonacci sphere gives the finale a real, evenly distributed 3D form rather than a flat grid.
    for (let i = 0; i < SHEET_COUNT; i += 1) {
      const y = 1 - (i / (SHEET_COUNT - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      fibonacciTargets.push(new THREE.Vector3(Math.cos(theta) * radius * 3.15, y * 3.15, Math.sin(theta) * radius * 3.15 - 0.55));
    }

    const markShape = new THREE.Shape();
    markShape.moveTo(-0.7, -0.65); markShape.lineTo(-0.18, -0.65); markShape.lineTo(0, -0.12);
    markShape.lineTo(0.18, -0.65); markShape.lineTo(0.7, -0.65); markShape.lineTo(0.25, 0.72);
    markShape.lineTo(-0.25, 0.72); markShape.closePath();
    const mark = new THREE.Mesh(
      new THREE.ExtrudeGeometry(markShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 2 }),
      new THREE.MeshPhysicalMaterial({ color: 0xdcefe9, roughness: 0.12, metalness: 0.08, transmission: 0.72, thickness: 0.4, ior: 1.45, iridescence: 0.65, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
    );
    mark.scale.setScalar(0.72); mark.position.set(3.3, 0.5, -1); scene.add(mark);
    scene.add(new THREE.AmbientLight(0xc8e4df, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
    const rim = new THREE.PointLight(0x83cfc5, 3.2, 16); rim.position.set(-4, 1, 4); scene.add(rim);

    const resize = () => {
      const width = Math.max(1, window.innerWidth); const height = Math.max(1, window.innerHeight);
      renderer.setPixelRatio(Math.min(1.65, window.devicePixelRatio || 1)); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    const cameraAtZ0 = (x: number, y: number) => {
      const distance = camera.position.z;
      const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      const worldWidth = worldHeight * camera.aspect;
      return new THREE.Vector3((x / window.innerWidth - 0.5) * worldWidth, (0.5 - y / window.innerHeight) * worldHeight, 0);
    };
    const syncServiceRects = () => {
      const images = Array.from(document.querySelectorAll<HTMLElement>('#services .service-image'));
      images.slice(0, SHEET_COUNT).forEach((image, i) => {
        const rect = image.getBoundingClientRect();
        const center = cameraAtZ0(rect.left + rect.width / 2, rect.top + rect.height / 2);
        serviceTargets[i].copy(center);
        const distance = camera.position.z;
        const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
        serviceScales[i].set(rect.width / window.innerWidth * worldHeight * camera.aspect, rect.height / window.innerHeight * worldHeight);
      });
    };
    const sectionVisible = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector); if (!el) return false;
      const rect = el.getBoundingClientRect(); return rect.top < window.innerHeight && rect.bottom > 0;
    };
    const updateSections = () => {
      serviceVisible = sectionVisible('#services');
      finaleVisible = sectionVisible('#finale');
      visitVisible = sectionVisible('#visit-story, .visit-story');
      if (serviceVisible) syncServiceRects();
    };
    const scrollStage = () => {
      const services = document.querySelector<HTMLElement>('#services');
      const top = services?.getBoundingClientRect().top ?? window.innerHeight;
      return THREE.MathUtils.clamp(1 - top / window.innerHeight, 0, 1);
    };

    const onPointer = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(sheetMeshes.filter((mesh) => mesh.visible))[0];
      hoverIndex = hit ? Number(hit.object.userData.index) : eventHoverIndex;
      if (hit?.uv) pointerWorld.copy(hit.uv);
    };
    const onServiceHover = (event: Event) => {
      const index = Number((event as CustomEvent<number>).detail);
      eventHoverIndex = Number.isFinite(index) ? index : -1;
    };
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(frame); else { clock.start(); frame = requestAnimationFrame(render); } };

    const render = () => {
      if (!alive || document.hidden) return;
      frame = requestAnimationFrame(render);
      const t = clock.getElapsedTime(); const nowScroll = window.scrollY;
      scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, nowScroll - lastScroll, 0.08); lastScroll = nowScroll;
      updateSections();
      const intro = scrollStage();
      const finale = finaleVisible && !visitVisible;
      for (let i = 0; i < SHEET_COUNT; i += 1) {
        const mesh = sheetMeshes[i]; const material = materials[i];
        const ribbonU = i / (SHEET_COUNT - 1);
        const heroProgress = THREE.MathUtils.clamp(window.scrollY / window.innerHeight, 0, 1);
        const compact = window.innerWidth < 720;
        const ribbon = new THREE.Vector3((compact ? 1.25 : 3.15) + Math.sin(ribbonU * Math.PI * 2.1 + heroProgress * 2) * .8 + heroProgress * 1.8, -6.8 + ribbonU * 7.3 + heroProgress * 5, -ribbonU * 1.2 + heroProgress * 4.5);
        const grid = serviceTargets[i];
        if (finale) {
          mesh.visible = true; mesh.position.lerp(fibonacciTargets[i].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), t * .09), 0.055); mesh.scale.lerp(new THREE.Vector3(1.25, 1.25, 1), 0.055); material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, 0.35, 0.06);
        } else if (serviceVisible && allTexturesReady) {
          mesh.visible = true; mesh.position.lerp(grid, 0.16); mesh.scale.lerp(new THREE.Vector3(serviceScales[i].x, serviceScales[i].y, 1), 0.16); material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, 0.88, 0.08);
          const image = document.querySelectorAll<HTMLElement>('#services .service-image')[i];
          if (image && (image.getBoundingClientRect().bottom < 0 || image.getBoundingClientRect().top > window.innerHeight)) mesh.visible = false;
        } else if (!serviceVisible && !visitVisible) {
          mesh.visible = true; mesh.position.lerp(ribbon, 0.075); mesh.scale.lerp(new THREE.Vector3(window.innerWidth < 720 ? 1.15 : 1.8, window.innerWidth < 720 ? .76 : 1.17, 1), 0.075); material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, 0.72, 0.08);
        } else {
          mesh.visible = false;
        }
        const row = Math.floor(i / 3); const col = i % 3;
        const targetRot = finale ? new THREE.Euler(Math.sin(t * 0.2 + row) * 0.12, t * 0.08 + col * 0.15, Math.cos(t * 0.17 + i) * 0.1) : new THREE.Euler(intro > 0.25 ? Math.sin(t * 0.35 + row) * 0.025 : 0.12 * Math.sin(t + i), intro > 0.25 ? Math.cos(t * 0.31 + col) * 0.035 : 0.08 * Math.cos(t * 0.7 + i), intro < 0.25 ? Math.sin(i * 1.8) * 0.18 : 0);
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot.x, 0.06); mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRot.y, 0.06); mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRot.z, 0.06);
        material.uniforms.uTime.value = t; material.uniforms.uBlend.value = (hoverIndex === i || eventHoverIndex === i) ? 1 : THREE.MathUtils.clamp(Math.abs(scrollVelocity) * 0.018, 0, 0.22); material.uniforms.uHover.value = THREE.MathUtils.lerp(material.uniforms.uHover.value, (hoverIndex === i || eventHoverIndex === i) ? 1 : 0, 0.12); material.uniforms.uDent.value.lerp(pointerWorld, 0.14);
      }
      const firstViewport = THREE.MathUtils.clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
      mark.position.x = THREE.MathUtils.lerp(mark.position.x, THREE.MathUtils.lerp(3.3, -4.25, firstViewport), 0.08);
      mark.position.y = THREE.MathUtils.lerp(mark.position.y, THREE.MathUtils.lerp(0.5, 3.35, firstViewport), 0.08);
      mark.scale.setScalar(THREE.MathUtils.lerp(mark.scale.x, THREE.MathUtils.lerp(0.72, 0.19, firstViewport), 0.08));
      (mark.material as THREE.MeshPhysicalMaterial).opacity = THREE.MathUtils.lerp((mark.material as THREE.MeshPhysicalMaterial).opacity, firstViewport > 0.98 ? 0 : 0.78, 0.08);
      mark.rotation.y += 0.0025;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, finale ? 13.5 : 12, 0.06); camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    resize();
    window.addEventListener('resize', resize); window.addEventListener('scroll', updateSections, { passive: true }); window.addEventListener('pointermove', onPointer, { passive: true }); window.addEventListener('apex-service-hover', onServiceHover as EventListener); document.addEventListener('visibilitychange', onVisibility); frame = requestAnimationFrame(render);
    return () => {
      alive = false; cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('scroll', updateSections); window.removeEventListener('pointermove', onPointer); window.removeEventListener('apex-service-hover', onServiceHover as EventListener); document.removeEventListener('visibilitychange', onVisibility);
      experience?.removeAttribute('data-webgl-ready');
      sheets.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose()); else object.material.dispose(); } });
      mark.geometry.dispose(); (mark.material as THREE.Material).dispose(); textures.forEach((texture) => texture.dispose()); renderer.dispose(); canvas.remove();
    };
  }, []);

  return <div ref={host} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none' }} />;
}
