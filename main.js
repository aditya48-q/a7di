/* main.js — Three.js 3D scene, interactions, and contact form */

/* ─── Three.js Hero Scene ─────────────────────────────────── */
(function initThreeScene() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 200);
  camera.position.set(0, 0, 28);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());

  /* Ambient + directional light */
  scene.add(new THREE.AmbientLight(0x90e0ef, 0.6));
  const dir = new THREE.DirectionalLight(0x00b4d8, 1.4);
  dir.position.set(5, 10, 8);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xcaf0f8, 0.7);
  dir2.position.set(-8, -4, 6);
  scene.add(dir2);

  /* ── Particle field ── */
  const PARTICLE_COUNT = 1800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const SPREAD = 60;
  const palette = [
    new THREE.Color(0x00b4d8),
    new THREE.Color(0xcaf0f8),
    new THREE.Color(0x90e0ef),
    new THREE.Color(0x0077b6),
    new THREE.Color(0xffffff),
  ];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pgeo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.75 });
  const particleSystem = new THREE.Points(pgeo, pmat);
  scene.add(particleSystem);

  /* ── Floating geometric objects ── */
  const meshes = [];

  function addMesh(geo, pos, speed) {
    const mat = new THREE.MeshPhongMaterial({
      color: 0x00b4d8,
      emissive: 0x003a5e,
      specular: 0xcaf0f8,
      shininess: 90,
      transparent: true,
      opacity: 0.72,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.userData.speed = speed;
    mesh.userData.offset = Math.random() * Math.PI * 2;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  addMesh(new THREE.IcosahedronGeometry(2.2, 1),  [-12,  4, -8],  { x: 0.004, y: 0.007 });
  addMesh(new THREE.OctahedronGeometry(1.6),       [ 14,  6, -10], { x: 0.006, y: 0.004 });
  addMesh(new THREE.TorusGeometry(1.8, 0.5, 12, 60), [ 10, -6, -5], { x: 0.003, y: 0.008 });
  addMesh(new THREE.TetrahedronGeometry(1.4),      [-10, -5, -6],  { x: 0.007, y: 0.003 });
  addMesh(new THREE.DodecahedronGeometry(1.3),     [  2, 10, -12], { x: 0.005, y: 0.006 });

  /* Wireframe overlays */
  meshes.forEach((m) => {
    const wgeo = m.geometry.clone();
    const wmat = new THREE.MeshBasicMaterial({ color: 0xcaf0f8, wireframe: true, transparent: true, opacity: 0.18 });
    const wire = new THREE.Mesh(wgeo, wmat);
    m.add(wire);
  });

  /* ── Morphing central geometry ── */
  const morphGeo   = new THREE.IcosahedronGeometry(3, 2);
  const morphMat   = new THREE.MeshPhongMaterial({
    color: 0x0077b6,
    emissive: 0x001d38,
    specular: 0x90e0ef,
    shininess: 60,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
  });
  const morphMesh  = new THREE.Mesh(morphGeo, morphMat);
  morphMesh.position.set(0, 0, -18);
  scene.add(morphMesh);

  /* ── Mouse tracking ── */
  let mouseNX = 0, mouseNY = 0;
  document.addEventListener("mousemove", (e) => {
    mouseNX = (e.clientX / W()) * 2 - 1;
    mouseNY = -(e.clientY / H()) * 2 + 1;
  });

  /* ── Resize ── */
  window.addEventListener("resize", () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  /* ── Animation loop ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;

    /* Rotate particles slowly */
    particleSystem.rotation.y += 0.0008;
    particleSystem.rotation.x += 0.0003;

    /* Float and rotate individual meshes */
    meshes.forEach((m, i) => {
      m.rotation.x += m.userData.speed.x;
      m.rotation.y += m.userData.speed.y;
      m.position.y += Math.sin(t + m.userData.offset) * 0.008;
    });

    /* Morph central wire sphere */
    morphMesh.rotation.y += 0.002;
    morphMesh.rotation.x += 0.001;
    const s = 1 + 0.04 * Math.sin(t * 1.3);
    morphMesh.scale.set(s, s, s);

    /* Camera follows mouse gently */
    camera.position.x += (mouseNX * 2 - camera.position.x) * 0.025;
    camera.position.y += (mouseNY * 1.5 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();

/* ─── 3-D Card tilt on hover (mouse-tracking) ──────────────── */
(function init3DCardTilt() {
  const cards = document.querySelectorAll(
    ".project-card, .skill-card, .about-copy, .about-highlight, .contact-card, .contact-form"
  );
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const rotY  =  dx * 10;
      const rotX  = -dy * 10;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
})();

/* ─── 3D flip effect for project cards ─────────────────────── */
(function initFlipCards() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const inner = card.querySelector(".project-card-inner");
    if (!inner) return; /* only if HTML wraps content in inner */
    card.addEventListener("click", () => {
      inner.classList.toggle("flipped");
    });
  });
})();

/* ─── Parallax scrolling depth ─────────────────────────────── */
(function initParallax() {
  const layers = document.querySelectorAll("[data-parallax]");
  if (!layers.length) return;
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    layers.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.3;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }, { passive: true });
})();

/* ─── Holographic shimmer on section headings ───────────────── */
(function initHoloText() {
  document.querySelectorAll(".section-head h2").forEach((h) => {
    h.classList.add("holo-text");
  });
})();

/* ─── Contact form with backend integration ────────────────── */
(function initContactForm() {
  const form    = document.getElementById("contact-form");
  const btn     = document.getElementById("contact-submit");
  const toast   = document.getElementById("toast");
  if (!form || !btn) return;

  /* Show toast helper */
  function showToast(message, type) {
    toast.textContent  = message;
    toast.className    = "toast toast--" + type + " toast--visible";
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, 4000);
  }

  /* Simple client-side validation */
  function validate(name, email, message) {
    if (!name.trim())                          return "Please enter your name.";
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email.";
    if (!message.trim())                       return "Please write a message.";
    return null;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameEl    = document.getElementById("cf-name");
    const emailEl   = document.getElementById("cf-email");
    const messageEl = document.getElementById("cf-message");

    /* Clear previous error states */
    [nameEl, emailEl, messageEl].forEach((el) => el.classList.remove("input-error"));

    const name    = nameEl.value;
    const email   = emailEl.value;
    const message = messageEl.value;

    const err = validate(name, email, message);
    if (err) {
      if (!name.trim())    nameEl.classList.add("input-error");
      if (!email.trim() || !email.includes("@")) emailEl.classList.add("input-error");
      if (!message.trim()) messageEl.classList.add("input-error");
      showToast(err, "error");
      return;
    }

    /* Loading state */
    btn.disabled  = true;
    btn.classList.add("btn--loading");
    btn.textContent = "Sending…";

    try {
      const res  = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        showToast("✓ Message sent! I'll get back to you soon.", "success");
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Something went wrong. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again later.", "error");
    } finally {
      btn.disabled = false;
      btn.classList.remove("btn--loading");
      btn.textContent = "Send Message";
    }
  });
})();

/* ─── AOS + nav (pre-existing, kept here as fallback) ───────── */
if (typeof AOS !== "undefined") {
  AOS.init({ duration: 900, easing: "ease-out-cubic", once: true, offset: 120 });
}
