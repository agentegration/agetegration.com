// ============================================
// AGE Tegration — interactions & canvas animations
// Original implementation — no external assets copied.
// ============================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Mobile nav ---------- */
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

/* ---------- Thread progress + step activation ---------- */
const threadSection = document.querySelector('.thread');
const threadProgress = document.querySelector('.thread-progress');
const threadSteps = document.querySelectorAll('.thread-step');

function updateThread() {
  if (!threadSection) return;
  const rect = threadSection.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = rect.height;
  const visible = Math.min(Math.max(vh * 0.7 - rect.top, 0), total);
  const pct = total > 0 ? (visible / total) * 100 : 0;
  if (threadProgress) threadProgress.style.height = pct + '%';

  threadSteps.forEach(step => {
    const r = step.getBoundingClientRect();
    if (r.top < vh * 0.75) step.classList.add('active');
  });
}
window.addEventListener('scroll', updateThread, { passive: true });
window.addEventListener('resize', updateThread);
updateThread();

/* ---------- Canvas helper: responsive sizing ---------- */
function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = parent.clientWidth + 'px';
    canvas.style.height = parent.clientHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  return ctx;
}

/* ============================================
   HERO: particle network ("voice / agent brain")
   Nodes connected by lines, gently drifting,
   pulsing brighter near the cursor.
   ============================================ */
(function heroBrain() {
  const canvas = document.getElementById('brainCanvas');
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  let w = canvas.parentElement.clientWidth;
  let h = canvas.parentElement.clientHeight;
  window.addEventListener('resize', () => {
    w = canvas.parentElement.clientWidth;
    h = canvas.parentElement.clientHeight;
  });

  const COUNT = prefersReducedMotion ? 0 : Math.min(90, Math.floor((w * h) / 14000));
  const nodes = [];
  for (let i = 0; i < COUNT; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6
    });
  }

  const mouse = { x: -9999, y: -9999 };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  const MAX_DIST = 140;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = n.x - m.x, dy = n.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.22;
          ctx.strokeStyle = `rgba(127,224,196,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }

      const dxm = n.x - mouse.x, dym = n.y - mouse.y;
      const distM = Math.sqrt(dxm * dxm + dym * dym);
      const glow = distM < 160 ? (1 - distM / 160) : 0;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + glow * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glow > 0
        ? `rgba(255,107,53,${0.5 + glow * 0.5})`
        : 'rgba(242,239,233,0.55)';
      ctx.fill();
    }

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================
   IDEA MOMENT: particles converging into a
   lightbulb outline, then dispersing (loop).
   ============================================ */
(function ideaBulb() {
  const canvas = document.getElementById('bulbCanvas');
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  let w = canvas.parentElement.clientWidth;
  let h = canvas.parentElement.clientHeight;
  window.addEventListener('resize', () => {
    w = canvas.parentElement.clientWidth;
    h = canvas.parentElement.clientHeight;
    buildTargets();
  });

  // Build a simple bulb silhouette out of points (bulb head + filament + base)
  function bulbPoints() {
    const cx = w / 2, cy = h / 2 - 20;
    const scale = Math.min(w, h) * 0.14;
    const pts = [];
    // bulb head (circle arc, upper 300deg)
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * scale, y: cy + Math.sin(a) * scale * 0.95 - scale * 0.15 });
    }
    // base (screw base) — a few horizontal lines below
    for (let row = 0; row < 4; row++) {
      for (let i = -3; i <= 3; i++) {
        pts.push({
          x: cx + i * (scale * 0.11),
          y: cy + scale * 0.9 + row * (scale * 0.16)
        });
      }
    }
    // filament squiggle
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      pts.push({
        x: cx + (t - 0.5) * scale * 0.9,
        y: cy + Math.sin(t * Math.PI * 3) * scale * 0.25
      });
    }
    return pts;
  }

  let targets = [];
  let particles = [];
  function buildTargets() {
    targets = bulbPoints();
    particles = targets.map(t => ({
      x: Math.random() * w,
      y: Math.random() * h,
      tx: t.x,
      ty: t.y
    }));
  }
  buildTargets();

  let progress = 0; // 0 -> scattered, 1 -> formed
  let dir = 1;
  let visible = false;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { visible = e.isIntersecting; });
  }, { threshold: 0.2 });
  io.observe(canvas.parentElement);

  function draw() {
    ctx.clearRect(0, 0, w, h);

    if (visible && !prefersReducedMotion) {
      progress += dir * 0.005;
      if (progress > 1) { progress = 1; dir = -1; }
      if (progress < 0.62 && dir === -1) { dir = 1; }
    } else if (prefersReducedMotion) {
      progress = 1;
    } else if (progress === 0) {
      progress = 0.62; // start mostly-formed even before scroll trigger
    }

    const ease = progress * progress * (3 - 2 * progress); // smoothstep

    particles.forEach(p => {
      const x = p.x + (p.tx - p.x) * ease;
      const y = p.y + (p.ty - p.y) * ease;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,107,53,${0.35 + ease * 0.65})`;
      ctx.fill();
    });

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================
   REACH: rotating wireframe globe made of dots
   ============================================ */
(function reachGlobe() {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  let w = canvas.parentElement.clientWidth;
  let h = canvas.parentElement.clientHeight;
  window.addEventListener('resize', () => {
    w = canvas.parentElement.clientWidth;
    h = canvas.parentElement.clientHeight;
  });

  const LAT_LINES = 10;
  const LON_LINES = 16;
  const RING_STEPS = 48;
  const points = [];
  for (let i = 0; i <= LAT_LINES; i++) {
    const lat = (i / LAT_LINES) * Math.PI - Math.PI / 2;
    for (let j = 0; j < LON_LINES; j++) {
      const lon = (j / LON_LINES) * Math.PI * 2;
      points.push({
        x: Math.cos(lat) * Math.cos(lon),
        y: Math.sin(lat),
        z: Math.cos(lat) * Math.sin(lon)
      });
    }
  }

  // Wireframe rings: a few parallels + meridians, each a dense loop of points
  const rings = [];
  const parallels = [-0.6, -0.25, 0, 0.25, 0.6].map(f => f * Math.PI / 2);
  parallels.forEach(lat => {
    const ring = [];
    for (let i = 0; i <= RING_STEPS; i++) {
      const lon = (i / RING_STEPS) * Math.PI * 2;
      ring.push({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) });
    }
    rings.push(ring);
  });
  const meridianCount = 6;
  for (let m = 0; m < meridianCount; m++) {
    const lon = (m / meridianCount) * Math.PI * 2;
    const ring = [];
    for (let i = 0; i <= RING_STEPS; i++) {
      const lat = (i / RING_STEPS) * Math.PI * 2;
      ring.push({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) });
    }
    rings.push(ring);
  }

  let angle = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) * 0.32;

    if (!prefersReducedMotion) angle += 0.0016;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const project = (p) => {
      const x = p.x * cosA - p.z * sinA;
      const z = p.x * sinA + p.z * cosA;
      return { x, y: p.y, z };
    };

    // Draw wireframe rings (lines), back-to-front by average depth
    const projRings = rings.map(ring => {
      const pr = ring.map(project);
      const avgZ = pr.reduce((s, p) => s + p.z, 0) / pr.length;
      return { pr, avgZ };
    }).sort((a, b) => a.avgZ - b.avgZ);

    projRings.forEach(({ pr, avgZ }) => {
      const depth = (avgZ + 1) / 2;
      ctx.beginPath();
      pr.forEach((p, i) => {
        const sx = cx + p.x * radius;
        const sy = cy + p.y * radius;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.strokeStyle = `rgba(127,224,196,${0.06 + depth * 0.16})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw point cloud on top
    const sorted = points.map(project).sort((a, b) => a.z - b.z);
    sorted.forEach(p => {
      const depth = (p.z + 1) / 2; // 0..1
      const sx = cx + p.x * radius;
      const sy = cy + p.y * radius;
      const size = 0.8 + depth * 1.8;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = depth > 0.55
        ? `rgba(255,107,53,${0.25 + depth * 0.5})`
        : `rgba(127,224,196,${0.15 + depth * 0.55})`;
      ctx.fill();
    });

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }
  draw();
})();
