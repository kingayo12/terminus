// import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
// import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
// import { SVGLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/SVGLoader.js";

/* =====================================================
   CONTAINER
===================================================== */
const container = document.querySelector(".cps_yard-container");
if (!container) {
  throw new Error("Missing .cps_yard-container");
}

/* =====================================================
   SCENE
===================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

/* =====================================================
   CAMERA (ORTHOGRAPHIC – YARD VIEW)
===================================================== */
const { width, height } = container.getBoundingClientRect();

const camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  0.1,
  3000,
);

camera.position.set(0, 0, 800);
camera.lookAt(0, 0, 0);

/* =====================================================
   RENDERER
===================================================== */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

/* =====================================================
   CONTROLS (PAN + ZOOM ONLY)
===================================================== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;
controls.enablePan = true;
controls.enableZoom = true;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.screenSpacePanning = true;

/* =====================================================
   LIGHTING
===================================================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.85));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(0, 0, 1000);
scene.add(dirLight);

/* =====================================================
   RAYCASTER
===================================================== */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* =====================================================
   YARD GROUP
===================================================== */
const yardGroup = new THREE.Group();
scene.add(yardGroup);

/* =====================================================
   SVG LOADER
===================================================== */
const svgLoader = new SVGLoader();

svgLoader.load(
  "/yard.svg", // 🔴 your SVG file
  (data) => {
    const svgGroup = new THREE.Group();

    // SVG coordinate system fix
    svgGroup.scale.y *= -1;

    data.paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 10,
          bevelEnabled: false,
        });

        const material = new THREE.MeshStandardMaterial({
          color: path.color || 0x3b82f6,
          roughness: 0.55,
          metalness: 0.1,
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.userData = {
          id: path.userData?.node?.id || "unknown",
          type: path.userData?.node?.nodeName || "shape",
          originalColor: material.color.clone(),
        };

        svgGroup.add(mesh);
      });
    });

    // Center SVG
    const box = new THREE.Box3().setFromObject(svgGroup);
    const center = box.getCenter(new THREE.Vector3());
    svgGroup.position.sub(center);

    yardGroup.add(svgGroup);
  },
  undefined,
  (err) => {
    console.error("SVG load error:", err);
  },
);

/* =====================================================
   CLICK HANDLING (CONTAINER RELATIVE)
===================================================== */
container.addEventListener("click", (e) => {
  const rect = container.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(yardGroup.children, true);

  if (hits.length) {
    const mesh = hits[0].object;
    console.log("Clicked region:", mesh.userData.id);
  }
});

/* =====================================================
   HOVER HIGHLIGHT
===================================================== */
let hoveredMesh = null;

container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(yardGroup.children, true);

  if (hoveredMesh) {
    hoveredMesh.material.emissive.set(0x000000);
    hoveredMesh = null;
  }

  if (hits.length) {
    hoveredMesh = hits[0].object;
    hoveredMesh.material.emissive.set(0x1e40af);
  }
});

/* =====================================================
   RESIZE OBSERVER (RESPONSIVE)
===================================================== */
const resizeObserver = new ResizeObserver(() => {
  const { width, height } = container.getBoundingClientRect();

  camera.left = width / -2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = height / -2;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

resizeObserver.observe(container);

/* =====================================================
   RENDER LOOP
===================================================== */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
