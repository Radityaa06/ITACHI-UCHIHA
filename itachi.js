/* ═══════════════ SCROLL RESTORATION & INITIAL RESET ═══════════════ */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
document.documentElement.scrollTop = 0;
if (document.body) document.body.scrollTop = 0;

window.addEventListener('beforeunload', () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});

window.addEventListener('pageshow', () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  [0, 25, 80, 200].forEach(delay => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }, delay);
  });
});

// Intercept in-page anchor links so location.hash never stays in the address bar
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

/* ═══════════════════════════════════════════════════════════
   うちはイタチ — 万華鏡写輪眼
   Mangekyo crimson + Tsukuyomi scarlet + Amaterasu smoke.
   Interactive particle flock of crows, Genjutsu spatial scrub,
   and Tsukuyomi time distortion sphere.
   ═══════════════════════════════════════════════════════════ */

/* ───────────────────────── helpers ───────────────────────── */
const pad   = n => String(n).padStart(3, '0');
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rand  = (a, b) => a + Math.random() * (b - a);
/* fade in over [a,b], hold, fade out over [c,d] */
const window4 = (p, a, b, c, d) =>
  p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

function fitCanvas(canvas) {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round((canvas.offsetWidth || 0) * dpr);
  const h = Math.round((canvas.offsetHeight || 0) * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  return canvas.getContext('2d');
}
function stale(canvas) {
  if (!canvas) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return canvas.width !== Math.round((canvas.offsetWidth || 0) * dpr) ||
         canvas.height !== Math.round((canvas.offsetHeight || 0) * dpr);
}
/* cover-draw that refuses to crop harder than maxUp, so faces survive
   on tall phones instead of becoming a close-up of one nostril */
function drawCover(ctx, img, cw, ch, maxUp = 2.0) {
  if (!img || !img.naturalWidth) return false;
  const ir = img.naturalWidth / img.naturalHeight;
  let w = cw, h = cw / ir;
  if (h < ch) { const s = Math.min(ch / h, maxUp); w *= s; h *= s; }
  const dx = (cw - w) / 2, dy = (ch - h) / 2;
  ctx.drawImage(img, dx, dy, w, h);
  maskCorner(ctx, dx, dy, w, h, cw, ch);
  return true;
}

/* the render watermark lives in the frame's bottom-right corner. Sink it under a
   corner-anchored black falloff — opaque over the mark, feathered outward so it
   reads as vignette rather than a taped-over box. Coordinates follow the drawn
   image, not the canvas, so it stays put through any crop. */
function maskCorner(ctx, dx, dy, w, h, cw, ch) {
  const x1 = Math.min(dx + w, cw);       // corner of the image, clipped to canvas
  const y1 = Math.min(dy + h, ch);
  const r = Math.max(w * 0.16, h * 0.24); // falloff radius, generous on both axes
  const g = ctx.createRadialGradient(x1, y1, 0, x1, y1, r);
  g.addColorStop(0.00, 'rgba(0,0,0,1)');
  g.addColorStop(0.42, 'rgba(0,0,0,1)');
  g.addColorStop(0.68, 'rgba(0,0,0,.72)');
  g.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x1 - r, y1 - r, r, r);        // never bleed past the corner
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(x1 - r, y1 - r, r, r);
  ctx.restore();
}


/* ───────────────────────── DOM queries (hoisted) ───────────────────────── */
const skyCanvas      = document.getElementById('skyCanvas');
const sparkCanvas    = document.getElementById('sparkCanvas');
const gazeCanvas     = document.getElementById('gazeCanvas');
const dashCanvas     = document.getElementById('dashCanvas');
const rasCanvas      = document.getElementById('rasCanvas');
const chakra         = document.getElementById('chakraCanvas');
const boltCanvas     = document.getElementById('boltCanvas');
const thunderCanvas  = document.getElementById('thunderCanvas');
const ghostCanvas    = document.getElementById('ghostCanvas');
const particleCanvas = document.getElementById('particleCanvas');
const heroFallback   = document.getElementById('heroFallback');

const scrubSection = document.getElementById('top');
const scrubWash    = document.getElementById('scrubWash');
const scrubReadout = document.getElementById('scrubReadout');
const scrubBars    = document.querySelectorAll('.scrub__bars i');
const titleblock   = document.getElementById('titleblock');
const phases       = [...document.querySelectorAll('.phase')];

const dashSection  = document.getElementById('dash');
const dashReadout  = document.getElementById('dashReadout');
const dashBg       = document.getElementById('dashBg');
const dashEyeGlows = document.querySelectorAll('.dash__eye-glow');

const bgmAudio     = document.getElementById('bgmAudio');
const audioBtn     = document.getElementById('audioBtn');
const audioBtnIcon = document.getElementById('audioBtnIcon');

const rasSection   = document.getElementById('rasengan');
const rasFill      = document.getElementById('rasFill');
const rasPos       = document.getElementById('rasPos');
const rasFrameEl   = document.getElementById('rasFrame');
const rasTrack     = document.getElementById('rasTrack');

const legacy       = document.getElementById('legacy');
const legacyPlate  = document.querySelector('.legacy__plate');
const legacyReveal = document.getElementById('legacyReveal');
const legacyFlash  = document.getElementById('legacyFlash');

const cursorEl     = document.getElementById('cursor');
const railScroll   = document.getElementById('railScroll');
const chromeClock  = document.getElementById('chromeClock');
const heroHint     = document.getElementById('heroHint');
const badge        = document.getElementById('badge');
const flashWipe    = document.getElementById('flashWipe');

let skyCtx     = fitCanvas(skyCanvas);
let sparkCtx   = fitCanvas(sparkCanvas);
let gazeCtx    = fitCanvas(gazeCanvas);
let dashCtx    = fitCanvas(dashCanvas);
let rasCtx     = fitCanvas(rasCanvas);
let chakraCtx  = fitCanvas(chakra);
let boltCtx    = fitCanvas(boltCanvas);
let thunderCtx = fitCanvas(thunderCanvas);

/* ───────────────────────── preload ───────────────────────── */
const GAZE_COUNT  = 71;   // closed eyes → sage aura
const RAS_COUNT   = 33;   // rasengan travelling left to right
const DASH_COUNT  = 1;    // 4K Itachi with Karasu Bunshin

const gazeFrames = [];
const rasFrames  = [];
const dashFrames = [];

const loaderEl   = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct  = document.getElementById('loaderPct');
const loaderMsg  = document.getElementById('loaderMsg');

const LOADER_LINES = [
  '瞳術発動 / ACTIVATING OCULAR JUTSU',
  '月読空間同期 / SYNCHRONIZING TSUKUYOMI',
  '天照点火 / IGNITING AMATERASU',
  '幻術展開 / CASTING GENJUTSU',
];

let loaded = 0;
const total = GAZE_COUNT + RAS_COUNT + DASH_COUNT;

function load(src, bucket, index) {
  return new Promise(res => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => {
      bucket[index] = img;
      loaded++;
      const pct = loaded / total;
      loaderFill.style.width = (pct * 100).toFixed(1) + '%';
      loaderPct.textContent = String(Math.round(pct * 100)).padStart(2, '0');
      loaderMsg.textContent = LOADER_LINES[Math.min(3, Math.floor(pct * 4))];
      res();
    };
    img.src = src;
  });
}

const jobs = [];
const BUST = '?v=itachi1';
for (let i = 1; i <= GAZE_COUNT; i++) jobs.push(load(`frames/gaze/${pad(i)}.jpg${BUST}`, gazeFrames, i - 1));
for (let i = 1; i <= RAS_COUNT; i++) jobs.push(load(`frames/rasengan/${pad(i)}.jpg${BUST}`, rasFrames, i - 1));
jobs.push(load(`art/dash.jpg?v=4k`, dashFrames, 0));

// Preload trigger moved to end of file after all definitions

/* ═══════════════════════════════════════════════════════════
   ACT II — Canvas UI ParticleObject
   The source is a hard-alpha cutout, so the cloud reads as a
   portrait rather than a haze: more particles, smaller points,
   and almost no idle drift or rocking to smear it.
   ═══════════════════════════════════════════════════════════ */
// hoisted

function showFallback() {
  heroFallback.hidden = false;
  particleCanvas.style.display = 'none';
}

let particles = null;
import('./particle-object.js?v=disperse_v2')
  .then(({ createParticleObject }) => {
    particles = createParticleObject({ canvas: particleCanvas }, {
      src: 'art/particle-itachi.png?v=itachi',
      count: coarse ? 24000 : 46000,   // density is what makes the face legible
      size: 1.9,
      sizeVariance: 0.3,
      radius: 130,
      strength: 1.35,
      swirl: 1.1,           // he doesn't just scatter — he spirals, like the rasengan
      spring: 1.3,
      damping: 0.3,
      drift: 0.25,          // low: a drifting cloud is a blurry cloud
      scale: 4.1,
      xOffset: 0.52,   // pushed right so the copy on the left stays readable
      yOffset: 0.0,
      floatIntensity: 0.7,
      rotationIntensity: 0.25,
      floatSpeed: 1.2,
      fov: 62,
      cameraDistance: 4.2,
      orbit: false,         // must never fight the scroll
      zoom: false,
      onError: showFallback,
    });
    if (!particles) showFallback();
  })
  .catch(showFallback);

/* the copy sits left on desktop; on phones it moves to the floor, so the
   cloud has to climb out of the text instead of sitting behind it */
function layoutParticles() {
  if (!particles) return;
  const narrow = window.innerWidth < 860;
  particles.setOptions({
    xOffset: narrow ? 0 : 0.52,
    yOffset: narrow ? 0.95 : 0.0,
    scale: narrow ? 2.4 : 4.1,
  });
}

/* ═══════════════════════════════════════════════════════════
   ACT II INTERACTION — Touch, tap & sweep to disperse into crows
   ═══════════════════════════════════════════════════════════ */
const heroSection = document.getElementById('particles');

function spawnCrowBurst(x, y) {
  const ring = document.createElement('div');
  ring.className = 'crow-touch-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 800);

  const count = 12;
  for (let i = 0; i < count; i++) {
    const isCrow = i % 2 === 0;
    const el = document.createElement('div');
    el.className = isCrow ? 'flying-crow-burst' : 'feather-burst';

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const dist = 180 + Math.random() * 300;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - (isCrow ? 65 : 25);
    const rot0 = `${Math.round(Math.random() * 60 - 30)}deg`;
    const rot1 = `${Math.round(Math.atan2(ty, tx) * (180 / Math.PI) + (Math.random() - 0.5) * 35)}deg`;
    const dur = `${(0.95 + Math.random() * 0.45).toFixed(2)}s`;
    const scale1 = (0.9 + Math.random() * 0.55).toFixed(2);

    el.style.setProperty('--x0', `${x}px`);
    el.style.setProperty('--y0', `${y}px`);
    el.style.setProperty('--x1', `${x + tx}px`);
    el.style.setProperty('--y1', `${y + ty}px`);
    el.style.setProperty('--rot0', rot0);
    el.style.setProperty('--rot1', rot1);
    el.style.setProperty('--dur', dur);
    el.style.setProperty('--scale1', scale1);

    if (isCrow) {
      el.innerHTML = `
        <svg viewBox="0 0 64 64">
          <g class="crow-wings">
            <path d="M32 20 Q18 2 2 16 Q16 28 26 26 Q32 38 28 52 Q33 42 37 52 Q35 38 40 26 Q50 28 62 16 Q46 2 34 20 Z" fill="#040306"/>
            <circle cx="32" cy="18" r="1.8" fill="#ff1a35"/>
          </g>
        </svg>`;
    } else {
      el.innerHTML = `
        <svg viewBox="0 0 32 32">
          <path d="M16 2 C10 10 4 18 16 30 C18 18 22 10 16 2 Z" fill="#07060a" stroke="rgba(255,26,53,0.7)" stroke-width="0.75"/>
        </svg>`;
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

function spawnSingleFeather(x, y) {
  const el = document.createElement('div');
  el.className = 'feather-burst';
  const angle = Math.random() * Math.PI * 2;
  const dist = 70 + Math.random() * 120;
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist - 30;

  el.style.setProperty('--x0', `${x}px`);
  el.style.setProperty('--y0', `${y}px`);
  el.style.setProperty('--x1', `${x + tx}px`);
  el.style.setProperty('--y1', `${y + ty}px`);
  el.style.setProperty('--rot0', `${Math.round(Math.random() * 360)}deg`);
  el.style.setProperty('--rot1', `${Math.round(Math.random() * 360)}deg`);
  el.style.setProperty('--dur', '0.9s');
  el.style.setProperty('--scale1', '0.85');

  el.innerHTML = `
    <svg viewBox="0 0 32 32">
      <path d="M16 2 C10 10 4 18 16 30 C18 18 22 10 16 2 Z" fill="#060508" stroke="rgba(255,26,53,0.6)" stroke-width="0.6"/>
    </svg>`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

if (heroSection) {
  let isTouchingHero = false;
  let lastSweep = 0;

  heroSection.addEventListener('pointerenter', () => {
    if (cursorEl) cursorEl.classList.add('touch-ready');
  });

  heroSection.addEventListener('pointerleave', () => {
    if (cursorEl) cursorEl.classList.remove('touch-ready');
    isTouchingHero = false;
  });

  heroSection.addEventListener('pointerdown', e => {
    isTouchingHero = true;
    if (typeof particles?.disperse === "function") particles.disperse(e.clientX, e.clientY, 1.4);
    spawnCrowBurst(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', () => {
    isTouchingHero = false;
  });

  heroSection.addEventListener('pointermove', e => {
    if (isTouchingHero) {
      const now = performance.now();
      if (now - lastSweep > 75) {
        lastSweep = now;
        if (typeof particles?.disperse === "function") particles.disperse(e.clientX, e.clientY, 0.7);
        spawnSingleFeather(e.clientX, e.clientY);
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   TEXT MOTION — split / reveal / decrypt / count
   (vanilla takes on the reactbits.dev SplitText, BlurText,
   DecryptedText and CountUp components)
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('[data-split]').forEach(el => {
  const text = el.textContent;
  el.textContent = '';
  el.classList.add('split');
  [...text].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.style.setProperty('--i', i);
    span.textContent = ch;
    el.appendChild(span);
  });
});

const SCRAMBLE = '零一二三四五六七八九写輪眼万華鏡天照月読烏須佐能乎暁イタチ#%&$@*<>/\\';

function decrypt(el) {
  const target = el.dataset.decrypt || el.textContent;
  const chars = [...target];
  let step = 0;
  const steps = chars.length * 3 + 8;
  const id = setInterval(() => {
    step++;
    const shown = Math.floor((step / steps) * chars.length * 1.6);
    el.textContent = chars
      .map((c, i) => (i < shown || c === ' ' ? c
        : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]))
      .join('');
    if (step >= steps) { clearInterval(id); el.textContent = target; }
  }, 26);
}

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const t0 = performance.now();
  const dur = 1500;
  const step = now => {
    const p = clamp((now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const seen = new WeakSet();
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting || seen.has(e.target)) continue;
    seen.add(e.target);
    const el = e.target;
    if (el.hasAttribute('data-split') || el.hasAttribute('data-reveal')) el.classList.add('in');
    if (el.hasAttribute('data-decrypt') && !reduceMotion) decrypt(el);
    el.querySelectorAll?.('[data-count]').forEach(countUp);
    if (el.hasAttribute('data-count')) countUp(el);
  }
}, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-split], [data-reveal], [data-decrypt]')
  .forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 0.07 + 's'); io.observe(el); });

/* ── magnetic button (reactbits "Magnet") ── */
document.querySelectorAll('[data-magnet]').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.34}px)`;
  }, { passive: true });
  el.addEventListener('pointerleave', () => {
    el.style.transition = 'transform .55s cubic-bezier(.2,.9,.1,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 560);
  }, { passive: true });
});

/* ── tilt cards (reactbits "TiltedCard") ── */
document.querySelectorAll('[data-tilt]').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    el.style.transform =
      `perspective(900px) rotateY(${(px - .5) * 11}deg) rotateX(${(.5 - py) * 11}deg) translateY(-4px)`;
  }, { passive: true });
  el.addEventListener('pointerleave', () => {
    el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 620);
  }, { passive: true });
});

/* ═══════════════════ ambient sky ═══════════════════ */
// hoisted
const motes = [];

function seedSky() {
  motes.length = 0;
  const n = coarse ? 70 : 150;
  for (let i = 0; i < n; i++) {
    motes.push({
      x: Math.random(), y: Math.random(),
      r: rand(0.4, 1.8), s: rand(0.006, 0.05),
      tw: Math.random() * 6.28,
      gold: Math.random() < 0.35,
    });
  }
}

function paintSky(t) {
  const w = skyCanvas.width, h = skyCanvas.height;
  skyCtx.clearRect(0, 0, w, h);

  // a low band of village light, so the page is never flat black
  const g = skyCtx.createRadialGradient(w * 0.5, h * 1.15, 0, w * 0.5, h * 1.15, h * 0.95);
  g.addColorStop(0, 'rgba(64,6,18,.58)');
  g.addColorStop(0.6, 'rgba(28,4,14,.25)');
  g.addColorStop(1, 'rgba(5,1,3,0)');
  skyCtx.fillStyle = g;
  skyCtx.fillRect(0, 0, w, h);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const m of motes) {
    m.y -= m.s * 0.0016;
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.002 + m.tw));
    skyCtx.globalAlpha = tw * 0.55;
    skyCtx.fillStyle = m.gold ? '#ff1a35' : '#ff5268';
    skyCtx.beginPath();
    skyCtx.arc(m.x * w, m.y * h, m.r * dpr, 0, 6.2832);
    skyCtx.fill();
  }
  skyCtx.globalAlpha = 1;
}

/* ═══════════════ click sparks ═══════════════ */
// hoisted
const sparks = [];

function burst(x, y, n = 16, hue = 'gold', power = 1) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + Math.random() * 0.4;
    const sp = rand(2.5, 9) * power;
    sparks.push({
      x: x * dpr, y: y * dpr,
      vx: Math.cos(a) * sp * dpr, vy: Math.sin(a) * sp * dpr,
      life: 1, decay: rand(0.016, 0.04), hue,
    });
  }
}

function paintSparks() {
  const w = sparkCanvas.width, h = sparkCanvas.height;
  sparkCtx.clearRect(0, 0, w, h);
  sparkCtx.lineCap = 'round';
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx; s.y += s.vy;
    s.vx *= 0.93; s.vy *= 0.93;
    s.life -= s.decay;
    if (s.life <= 0) { sparks.splice(i, 1); continue; }
    sparkCtx.globalAlpha = s.life;
    sparkCtx.strokeStyle = s.hue === 'gold' ? '#ff2642' : '#ff7385';
    sparkCtx.lineWidth = 1.6 * s.life + 0.4;
    sparkCtx.beginPath();
    sparkCtx.moveTo(s.x, s.y);
    sparkCtx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
    sparkCtx.stroke();
  }
  sparkCtx.globalAlpha = 1;
}

addEventListener('pointerdown', e => {
  if (reduceMotion) return;
  burst(e.clientX, e.clientY, 18, 'gold');
}, { passive: true });

/* ── the hiraishin wipe ── */
// hoisted
function fireFlash() {
  if (reduceMotion) return;
  if (flashWipe) { flashWipe.classList.remove('fire'); void flashWipe.offsetWidth; flashWipe.classList.add('fire'); }
}
document.querySelectorAll('.chrome__nav a, .magnet').forEach(a => {
  a.addEventListener('click', fireFlash);
});

/* ═══════════════ ACT I — scroll-scrubbed awakening ═══════════════ */
// hoisted

let frameTarget = 0, frameShown = 0, lastDrawn = -1;
let scrubP = 0;

function readScrub() {
  const r = scrubSection.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  scrubP = clamp(-r.top / (span || 1));
  frameTarget = scrubP * (GAZE_COUNT - 1);
}

/* tuned to the footage: 1-16 closed · 17-30 opening · 31-52 sage · 53-71 flash.
   The first window starts late on purpose — the name owns the opening beat. */
const PHASE_WINDOWS = [
  [0.13, 0.18, 0.24, 0.31],
  [0.31, 0.37, 0.44, 0.51],
  [0.52, 0.58, 0.66, 0.73],
  [0.74, 0.80, 0.94, 1.03],
];

function paintScrubOverlays(p) {
  phases.forEach((el, i) => {
    const a = window4(p, ...PHASE_WINDOWS[i]);
    el.style.opacity = a.toFixed(3);
    el.style.transform = `translateX(-50%) translateY(${((1 - a) * 26).toFixed(1)}px)`;
    el.style.filter = `blur(${((1 - a) * 5).toFixed(2)}px)`;
  });

  // the name holds the opening beat, then clears out of his way
  const title = window4(p, -0.05, 0.01, 0.06, 0.14);
  titleblock.style.opacity = title.toFixed(3);
  titleblock.style.transform =
    `translate(-50%, -50%) scale(${(1 + (1 - title) * 0.06).toFixed(3)})`;

  // gold wash climbs with the aura in the second half
  scrubWash.style.opacity = clamp((p - 0.36) / 0.5).toFixed(3);

  // letterbox pinches in as he opens his eyes, then releases
  const bar = window4(p, 0.16, 0.3, 0.52, 0.72) * 7;
  scrubBars.forEach(b => { b.style.height = bar.toFixed(2) + 'vh'; });

  scrubReadout.textContent =
    `FRAME ${pad(Math.round(frameShown) + 1)} / ${pad(GAZE_COUNT)}`;
}

function paintScrub() {
  const r = scrubSection.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return;

  frameShown = lerp(frameShown, frameTarget, 0.14);
  const idx = clamp(Math.round(frameShown), 0, GAZE_COUNT - 1);

  if (idx !== lastDrawn || stale(gazeCanvas)) {
    if (stale(gazeCanvas)) gazeCtx = fitCanvas(gazeCanvas);
    const w = gazeCanvas.width, h = gazeCanvas.height;
    const targetImg = (gazeFrames[idx] && gazeFrames[idx].naturalWidth)
      ? gazeFrames[idx]
      : ((lastDrawn >= 0 && gazeFrames[lastDrawn] && gazeFrames[lastDrawn].naturalWidth)
        ? gazeFrames[lastDrawn]
        : gazeFrames[0]);
    if (targetImg && targetImg.naturalWidth) {
      gazeCtx.clearRect(0, 0, w, h);
      drawCover(gazeCtx, targetImg, w, h, 2.1);
      if (gazeFrames[idx] && gazeFrames[idx].naturalWidth) {
        lastDrawn = idx;
      }
    }
  }
  paintScrubOverlays(scrubP);
}

/* ═══════════════ velocity marquee ═══════════════ */
const veloRows = [...document.querySelectorAll('[data-velo]')].filter(el => el.firstElementChild).map(el => {
  // a second copy fills the gap the first one leaves as it slides out
  el.appendChild(el.firstElementChild.cloneNode(true));
  return { el, dir: parseFloat(el.dataset.velo), x: 0, width: 0 };
});

function measureVelo() {
  veloRows.forEach(r => {
    if (r.el && r.el.firstElementChild) {
      r.width = r.el.firstElementChild.offsetWidth || 1;
    }
  });
}

function paintVelo(dt) {
  for (const r of veloRows) {
    // scroll speed feeds the marquee — the faster you move, the faster it runs
    r.x += r.dir * (0.05 + scrollVel * 1.1) * dt;
    if (r.width) r.x = ((r.x % r.width) + r.width) % r.width;
    r.el.style.transform = `translateX(${(-r.x).toFixed(1)}px)`;
  }
}

/* ═══════════════ ACT III — hiraishin bolts ═══════════════ */
// hoisted
const bolts = [];

/* A jagged polyline between two points. More steps + a smaller spread reads as
   lightning; fewer steps + a wide spread reads as a geometric zigzag, which is
   what you get for free and what you do not want. */
function boltPath(x0, y0, x1, y1, jag = 1, steps = 9) {
  const pts = [[x0, y0]];
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = (Math.random() - 0.5) * len * (1.8 / steps) * jag * Math.sin(t * Math.PI);
    pts.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]);
  }
  pts.push([x1, y1]);
  return pts;
}

/* an ambient arc every so often, so the section is alive before you reach it */
let nextArc = 0;
function ambientArc(t) {
  if (t < nextArc || reduceMotion) return;
  nextArc = t + rand(1200, 3600);
  const w = boltCanvas.width, h = boltCanvas.height;
  const x0 = rand(0, w), y0 = rand(0, h * 0.5);
  bolts.push({
    pts: boltPath(x0, y0, x0 + rand(-w * 0.3, w * 0.3), y0 + rand(h * 0.2, h * 0.5), 1.4),
    life: 0.5, decay: 0.06,
  });
}

/* three passes per bolt: a wide gold haze, a gold channel, a white-hot core */
function strokeBolts(ctx, list, weight = 1) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    b.life -= b.decay;
    if (b.life <= 0) { list.splice(i, 1); continue; }
    const a = b.life;
    const w = (b.weight ?? 1) * weight;

    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let k = 1; k < b.pts.length; k++) ctx.lineTo(b.pts[k][0], b.pts[k][1]);

    ctx.shadowColor = 'rgba(255,26,53,.95)';
    ctx.shadowBlur = 26 * w;
    ctx.globalAlpha = a * 0.25;
    ctx.strokeStyle = '#b30018';
    ctx.lineWidth = 14 * w;
    ctx.stroke();

    ctx.shadowBlur = 12 * w;
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = '#ff2642';
    ctx.lineWidth = 4.5 * w;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#fff2f4';
    ctx.lineWidth = 1.5 * w;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function paintBolts(t) {
  if (!boltCanvas || !boltCtx) return;
  const r = boltCanvas.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) { bolts.length = 0; return; }
  if (stale(boltCanvas)) boltCtx = fitCanvas(boltCanvas);
  ambientArc(t);
  if (boltCtx) {
    boltCtx.clearRect(0, 0, boltCanvas.width, boltCanvas.height);
    strokeBolts(boltCtx, bolts);
  }
}

/* ═══════════════ ITACHI BGM AUDIO CONTROLLER ═══════════════ */
let bgmStarted = false;
const TARGET_BGM_VOLUME = 0.85;

function playBgmAudible() {
  if (!bgmAudio) return Promise.reject(new Error('no audio element'));
  bgmAudio.volume = TARGET_BGM_VOLUME;
  const playPromise = bgmAudio.play();
  if (playPromise !== undefined) {
    return playPromise.then(() => {
      bgmStarted = true;
      if (audioBtn) {
        audioBtn.classList.add('is-playing');
        audioBtn.classList.remove('is-muted');
      }
      if (audioBtnIcon) audioBtnIcon.textContent = '🔊';
      detachAudioUnlockers();
    }).catch(err => {
      return Promise.reject(err);
    });
  }
  return Promise.resolve();
}

function startBgm() {
  playBgmAudible().catch(() => {});
}

function unlockAudioOnGesture() {
  if (bgmStarted && bgmAudio && !bgmAudio.paused) {
    detachAudioUnlockers();
    return;
  }
  playBgmAudible().catch(() => {});
}

const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];

function attachAudioUnlockers() {
  UNLOCK_EVENTS.forEach(evt => {
    document.addEventListener(evt, unlockAudioOnGesture, { capture: true, passive: true });
    window.addEventListener(evt, unlockAudioOnGesture, { capture: true, passive: true });
  });
}

function detachAudioUnlockers() {
  UNLOCK_EVENTS.forEach(evt => {
    document.removeEventListener(evt, unlockAudioOnGesture, { capture: true });
    window.removeEventListener(evt, unlockAudioOnGesture, { capture: true });
  });
}

attachAudioUnlockers();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBgm, { once: true });
} else {
  startBgm();
}

const loaderEnterBtn = document.getElementById('loaderEnterBtn');
if (loaderEnterBtn) {
  loaderEnterBtn.addEventListener('click', e => {
    e.stopPropagation();
    playBgmAudible().catch(() => {});
    if (loaderEl && !loaderEl.classList.contains('done')) {
      markReady();
    }
  });
}

if (loaderEl) {
  loaderEl.addEventListener('pointerdown', () => {
    playBgmAudible().catch(() => {});
  });
}

if (audioBtn) {
  audioBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (!bgmAudio) return;
    if (bgmAudio.paused) {
      bgmAudio.volume = TARGET_BGM_VOLUME;
      bgmAudio.play().then(() => {
        bgmStarted = true;
        audioBtn.classList.add('is-playing');
        audioBtn.classList.remove('is-muted');
        if (audioBtnIcon) audioBtnIcon.textContent = '🔊';
      }).catch(() => {});
    } else {
      bgmAudio.pause();
      audioBtn.classList.remove('is-playing');
      audioBtn.classList.add('is-muted');
      if (audioBtnIcon) audioBtnIcon.textContent = '🔇';
    }
  });
}

/* ═══════════════ ACT IV — KARASU BUNSHIN & CROWS ENGINE ═══════════════ */
let dashDrawn = -1;
let dashEaseProgress = 0;

// Simulation entities
const CROW_COUNT = 28;
const crows = [];
const FEATHER_COUNT = 44;
const feathers = [];
const shockwaves = [];
const amaterasuSfx = new Audio('art/amaterasu.mp3');
amaterasuSfx.volume = 0.5;

function initDashSimulation() {
  const w = window.innerWidth || 1920;
  const h = window.innerHeight || 1080;
  crows.length = 0;
  for (let i = 0; i < CROW_COUNT; i++) {
    const depth = 0.35 + Math.random() * 0.9;
    crows.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -(1.4 + Math.random() * 2.6) * depth,
      vy: (Math.random() - 0.52) * 1.4 * depth,
      depth,
      wingspan: (14 + Math.random() * 18) * depth,
      wingPhase: Math.random() * Math.PI * 2,
      flapSpeed: 9 + Math.random() * 8,
      bank: 0,
      targetBank: 0,
      size: (12 + Math.random() * 14) * depth,
      alpha: 0.45 + depth * 0.5,
      isBurst: false
    });
  }

  feathers.length = 0;
  for (let i = 0; i < FEATHER_COUNT; i++) {
    feathers.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -(0.5 + Math.random() * 1.2),
      vy: 0.6 + Math.random() * 1.8,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 1.5 + Math.random() * 2.5,
      length: 10 + Math.random() * 18,
      width: 2.5 + Math.random() * 3.5,
      crimson: Math.random() > 0.6,
      alpha: 0.4 + Math.random() * 0.5,
      isBurst: false
    });
  }
}
initDashSimulation();

function triggerCrowBurst(clickX, clickY) {
  const burstCount = 14;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = 4.5 + Math.random() * 6.5;
    const depth = 0.65 + Math.random() * 0.65;
    crows.push({
      x: clickX,
      y: clickY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      depth,
      wingspan: (16 + Math.random() * 20) * depth,
      wingPhase: Math.random() * Math.PI * 2,
      flapSpeed: 16 + Math.random() * 8,
      bank: 0,
      targetBank: 0,
      size: (14 + Math.random() * 14) * depth,
      alpha: 0.95,
      isBurst: true,
      life: 1.0
    });
  }

  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5.5;
    feathers.push({
      x: clickX,
      y: clickY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 2 + Math.random() * 3,
      length: 12 + Math.random() * 16,
      width: 3 + Math.random() * 3,
      crimson: Math.random() > 0.35,
      alpha: 1.0,
      isBurst: true,
      life: 1.0
    });
  }

  shockwaves.push({
    x: clickX,
    y: clickY,
    radius: 10,
    maxRadius: 180 + Math.random() * 80,
    alpha: 0.85
  });

  try {
    amaterasuSfx.currentTime = 0;
    amaterasuSfx.play().catch(() => {});
  } catch (e) {}
}

if (dashSection) {
  dashSection.addEventListener('pointerdown', e => {
    const stickyEl = dashSection.querySelector('.dash__sticky') || dashSection;
    const r = stickyEl.getBoundingClientRect();
    triggerCrowBurst(e.clientX - r.left, e.clientY - r.top);
  });
}

function drawCrow(ctx, crow, t) {
  ctx.save();
  ctx.translate(crow.x, crow.y);
  const heading = Math.atan2(crow.vy, crow.vx);
  ctx.rotate(heading + crow.bank);
  ctx.scale(crow.depth, crow.depth);
  ctx.globalAlpha = Math.min(1, Math.max(0, crow.alpha));

  const flap = Math.sin(crow.wingPhase);
  const span = crow.wingspan;
  const tipY = flap * (span * 0.55);

  // Body
  ctx.fillStyle = crow.depth > 0.9 ? '#050205' : '#0a0509';
  ctx.beginPath();
  ctx.ellipse(0, 0, span * 0.42, span * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head and beak
  ctx.beginPath();
  ctx.ellipse(span * 0.38, -span * 0.04, span * 0.14, span * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(span * 0.46, -span * 0.08);
  ctx.lineTo(span * 0.62, -span * 0.02);
  ctx.lineTo(span * 0.44, span * 0.06);
  ctx.closePath();
  ctx.fill();

  // Red eye
  if (crow.depth > 0.65) {
    ctx.fillStyle = '#ff1a35';
    ctx.beginPath();
    ctx.arc(span * 0.42, -span * 0.06, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wings
  ctx.fillStyle = '#060206';
  ctx.beginPath();
  ctx.moveTo(-span * 0.1, 0);
  ctx.quadraticCurveTo(span * 0.1, tipY - span * 0.4, -span * 0.35, tipY - span * 0.85);
  ctx.quadraticCurveTo(span * 0.25, tipY - span * 0.4, span * 0.2, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-span * 0.1, 0);
  ctx.quadraticCurveTo(span * 0.1, -tipY + span * 0.4, -span * 0.35, -tipY + span * 0.85);
  ctx.quadraticCurveTo(span * 0.25, -tipY + span * 0.4, span * 0.2, 0);
  ctx.closePath();
  ctx.fill();

  if (crow.depth > 0.75) {
    ctx.strokeStyle = 'rgba(255, 26, 53, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-span * 0.35, tipY - span * 0.85);
    ctx.lineTo(span * 0.1, tipY - span * 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFeather(ctx, f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rot);
  ctx.globalAlpha = Math.min(1, Math.max(0, f.alpha));

  const l = f.length;
  const w = f.width;

  const grad = ctx.createLinearGradient(0, -l * 0.5, 0, l * 0.5);
  if (f.crimson) {
    grad.addColorStop(0, 'rgba(220, 20, 50, 0.85)');
    grad.addColorStop(0.5, 'rgba(140, 10, 30, 0.75)');
    grad.addColorStop(1, 'rgba(40, 2, 8, 0.8)');
  } else {
    grad.addColorStop(0, 'rgba(28, 20, 30, 0.85)');
    grad.addColorStop(0.5, 'rgba(12, 8, 14, 0.9)');
    grad.addColorStop(1, 'rgba(4, 2, 5, 0.95)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -l * 0.5);
  ctx.bezierCurveTo(w * 1.8, -l * 0.2, w * 1.8, l * 0.25, 0, l * 0.5);
  ctx.bezierCurveTo(-w * 1.8, l * 0.25, -w * 1.8, -l * 0.2, 0, -l * 0.5);
  ctx.fill();

  ctx.strokeStyle = f.crimson ? 'rgba(255, 100, 120, 0.6)' : 'rgba(180, 180, 200, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -l * 0.52);
  ctx.lineTo(0, l * 0.58);
  ctx.stroke();

  ctx.restore();
}

function paintDash(dt = 16, t = performance.now()) {
  const r = dashSection.getBoundingClientRect();
  if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
  const stickyEl = dashSection.querySelector('.dash__sticky') || dashSection;
  const rSticky = stickyEl.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  const p = clamp(-r.top / (span || 1));

  // smooth momentum range
  const eased = clamp((p - 0.04) / 0.92);
  dashEaseProgress = lerp(dashEaseProgress, eased, 0.12);

  // Parallax zoom and mouse track on 4K background
  const mouseNormX = (curX / window.innerWidth - 0.5) * 2;
  const mouseNormY = (curY / window.innerHeight - 0.5) * 2;
  const zoom = 1.0 + dashEaseProgress * 0.22;
  const panY = dashEaseProgress * -26;
  const panX = mouseNormX * -14;

  if (dashBg) {
    dashBg.style.transform = `scale(${zoom.toFixed(4)}) translate3d(${panX.toFixed(1)}px, ${(panY + mouseNormY * -10).toFixed(1)}px, 0)`;
    dashBg.style.filter = `brightness(${(1.0 + dashEaseProgress * 0.16).toFixed(2)}) contrast(${(1.05 + dashEaseProgress * 0.12).toFixed(2)})`;
  }

  if (dashEyeGlows.length > 0) {
    const eyeScale = 1.0 + dashEaseProgress * 0.45;
    const eyeAlpha = 0.75 + dashEaseProgress * 0.25;
    dashEyeGlows.forEach(glow => {
      glow.style.transform = `scale(${eyeScale.toFixed(3)})`;
      glow.style.opacity = eyeAlpha.toFixed(2);
    });
  }

  dashReadout.textContent = `${(dashEaseProgress * 0.071).toFixed(3)} s`;

  // Autonomous canvas simulation
  if (stale(dashCanvas)) dashCtx = fitCanvas(dashCanvas);
  const cw = dashCanvas.width;
  const ch = dashCanvas.height;
  dashCtx.clearRect(0, 0, cw, ch);

  const deltaSec = Math.min(dt, 50) / 1000;

  // Update & draw shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += deltaSec * 350;
    sw.alpha *= 0.93;
    if (sw.alpha < 0.02 || sw.radius > sw.maxRadius) {
      shockwaves.splice(i, 1);
      continue;
    }
    dashCtx.save();
    dashCtx.strokeStyle = `rgba(255, 26, 53, ${sw.alpha.toFixed(3)})`;
    dashCtx.lineWidth = 2.5;
    dashCtx.beginPath();
    dashCtx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    dashCtx.stroke();
    dashCtx.restore();
  }

  // Update & draw feathers
  const mouseDistFeather = 120;
  for (let i = feathers.length - 1; i >= 0; i--) {
    const f = feathers[i];
    f.swayPhase += f.swaySpeed * deltaSec;
    const swayX = Math.sin(f.swayPhase) * 1.4;

    const dx = curX - f.x;
    const dy = (curY - rSticky.top) - f.y;
    const dist = Math.hypot(dx, dy);
    if (dist < mouseDistFeather) {
      const force = (1 - dist / mouseDistFeather) * 4;
      f.vx -= (dx / dist) * force;
      f.vy -= (dy / dist) * force;
      f.rotSpeed += (Math.random() - 0.5) * 0.1;
    }

    f.vx *= 0.97;
    f.vy = lerp(f.vy, 1.2, 0.04);
    f.x += (f.vx + swayX) * (deltaSec * 60);
    f.y += f.vy * (deltaSec * 60);
    f.rot += f.rotSpeed;

    if (f.isBurst) {
      f.life -= deltaSec * 0.6;
      f.alpha = f.life;
      if (f.life <= 0) {
        feathers.splice(i, 1);
        continue;
      }
    } else {
      if (f.y > ch + 40) { f.y = -30; f.x = Math.random() * cw; }
      if (f.x < -40) f.x = cw + 30;
      if (f.x > cw + 40) f.x = -30;
    }

    drawFeather(dashCtx, f);
  }

  // Update & draw crows
  const mouseDistCrow = 150;
  for (let i = crows.length - 1; i >= 0; i--) {
    const c = crows[i];
    c.wingPhase += c.flapSpeed * deltaSec;

    const dx = curX - c.x;
    const dy = (curY - rSticky.top) - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < mouseDistCrow) {
      const repel = (1 - dist / mouseDistCrow) * 5.5;
      c.vx -= (dx / dist) * repel;
      c.vy -= (dy / dist) * repel;
      c.targetBank = (dx > 0 ? -0.4 : 0.4);
    } else {
      c.targetBank = (c.vx < 0 ? -0.1 : 0.1);
    }

    c.bank = lerp(c.bank, c.targetBank, 0.08);
    c.vx = lerp(c.vx, -2.2 * c.depth, 0.03);
    c.vy = lerp(c.vy, Math.sin(t * 0.002 + i) * 0.8 * c.depth, 0.04);

    c.x += c.vx * (deltaSec * 60);
    c.y += c.vy * (deltaSec * 60);

    if (c.isBurst) {
      c.life -= deltaSec * 0.5;
      c.alpha = c.life;
      if (c.life <= 0) {
        crows.splice(i, 1);
        continue;
      }
    } else {
      if (c.x < -c.wingspan * 2) {
        c.x = cw + c.wingspan * 2;
        c.y = Math.random() * ch;
      }
      if (c.x > cw + c.wingspan * 3) {
        c.x = -c.wingspan * 2;
        c.y = Math.random() * ch;
      }
      if (c.y < -60) c.y = ch + 40;
      if (c.y > ch + 60) c.y = -40;
    }

    drawCrow(dashCtx, c, t);
  }
}

/* ═══════════════ ACT V — rasengan tracked left to right ═══════════════ */
// hoisted

let handX = 0.5;      // raw pointer, 0..1 across the section
let easedX = 0.5;     // what the frames actually follow
let handVel = 0;
let rasDrawn = -1;
let touchedRas = false;

function trackHand(clientX) {
  const r = rasSection.getBoundingClientRect();
  const x = clamp((clientX - r.left) / Math.max(1, r.width));
  handVel = lerp(handVel, Math.abs(x - handX) * 60, 0.3);
  handX = x;
  if (!touchedRas) { touchedRas = true; rasTrack.classList.add('live'); }
}

rasSection.addEventListener('pointermove', e => trackHand(e.clientX), { passive: true });
rasSection.addEventListener('touchmove', e => {
  if (e.touches[0]) trackHand(e.touches[0].clientX);
}, { passive: true });

function paintRas(dt) {
  const r = rasSection.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return;

  // before you touch it, the sphere drifts across on its own
  if (!touchedRas && !reduceMotion) handX = 0.5 + 0.42 * Math.sin(performance.now() * 0.00045);

  easedX = lerp(easedX, handX, 0.16);
  handVel *= Math.exp(-2.4 * dt / 1000);

  const idx = clamp(Math.round(easedX * (RAS_COUNT - 1)), 0, RAS_COUNT - 1);
  if (idx !== rasDrawn || stale(rasCanvas)) {
    if (stale(rasCanvas)) rasCtx = fitCanvas(rasCanvas);
    const w = rasCanvas.width, h = rasCanvas.height;
    const targetImg = (rasFrames[idx] && rasFrames[idx].naturalWidth)
      ? rasFrames[idx]
      : ((rasDrawn >= 0 && rasFrames[rasDrawn] && rasFrames[rasDrawn].naturalWidth)
        ? rasFrames[rasDrawn]
        : rasFrames[0]);
    if (targetImg && targetImg.naturalWidth) {
      rasCtx.clearRect(0, 0, w, h);
      drawCover(rasCtx, targetImg, w, h, 2.2);
      if (rasFrames[idx] && rasFrames[idx].naturalWidth) {
        rasDrawn = idx;
      }
    }
  }

  rasFill.style.width = (easedX * 100).toFixed(1) + '%';
  rasPos.textContent = `浸食 ${easedX < 0.5 ? '左' : '右'} ${String(Math.round(easedX * 100)).padStart(2, '0')}%`;
  rasFrameEl.textContent = `FRAME ${String(idx + 1).padStart(2, '0')} / ${RAS_COUNT}`;
  rasTrack.style.setProperty('--x', (easedX * 100).toFixed(1) + '%');

  paintChakra(dt);
}

/* chakra motes that hang around the sphere and get dragged along with it */
const orbit = [];
function seedOrbit() {
  orbit.length = 0;
  const n = coarse ? 50 : 110;
  for (let i = 0; i < n; i++) {
    orbit.push({
      a: Math.random() * 6.2832,
      r: rand(0.04, 0.16),
      sp: rand(0.4, 1.6),
      z: rand(0.3, 1),
    });
  }
}

function paintChakra(dt) {
  if (stale(chakra)) chakraCtx = fitCanvas(chakra);
  const w = chakra.width, h = chakra.height;
  chakraCtx.clearRect(0, 0, w, h);

  // the sphere sits roughly where the frames put it: it sweeps the full width
  const cx = lerp(w * 0.24, w * 0.76, easedX);
  const cy = h * 0.56;
  const R = Math.min(w, h);
  const drive = 0.0012 + handVel * 0.0009;

  chakraCtx.globalCompositeOperation = 'lighter';
  for (const p of orbit) {
    p.a += drive * p.sp * dt;
    const x = cx + Math.cos(p.a) * p.r * R;
    const y = cy + Math.sin(p.a) * p.r * R * 0.9;
    chakraCtx.globalAlpha = (0.10 + Math.min(handVel, 1) * 0.4) * p.z;
    chakraCtx.fillStyle = p.z > 0.72 ? '#ffd1d8' : '#ff1a35';
    chakraCtx.beginPath();
    chakraCtx.arc(x, y, (0.8 + p.z) * 1.6, 0, 6.2832);
    chakraCtx.fill();
  }
  chakraCtx.globalCompositeOperation = 'source-over';
  chakraCtx.globalAlpha = 1;
}

/* ═══════════════ ACT VI — legacy: ghost cursor + thunder ═══════════════ */
// hoisted

let ghost = { resize() {}, move() {}, leave() {}, render() {}, ok: false };
import('./ghost-cursor.js')
  .then(({ createGhostCursor }) => {
    ghost = createGhostCursor(ghostCanvas, {
      color: '#ff1a35',     // mangekyo crimson
      trailLength: 28,
      brightness: 1.1,      // the plate is near-black now, so the smoke can run hot
      edgeIntensity: 0.4,
      fadeDelayMs: 700,
      fadeDurationMs: 1200,
    });
    ghost.resize();
    legacy.classList.toggle('has-ghost', ghost.ok);
  })
  .catch(() => {});

legacy.addEventListener('pointermove', e => {
  const r = legacy.getBoundingClientRect();
  const px = (e.clientX - r.left) / Math.max(1, r.width);
  const py = (e.clientY - r.top) / Math.max(1, r.height);
  ghost.move(px, py, true);
  // the torch mask follows the pointer
  legacy.style.setProperty('--rx', (px * 100).toFixed(2) + '%');
  legacy.style.setProperty('--ry', (py * 100).toFixed(2) + '%');
  legacy.classList.add('lit');
}, { passive: true });
legacy.addEventListener('pointerleave', () => {
  ghost.leave();
  legacy.classList.remove('lit');
}, { passive: true });

/* ── yellow thunder, viewport-wide: it runs over every act, not just the last ── */
const THUNDER_EVERY = 420;
const thunder = [];
let nextStrike = 0;

/* one channel dropped from above the fold to somewhere down the screen */
function dropBolt(w, h, x0, reach = 1) {
  const x1 = x0 + rand(-w * 0.2, w * 0.2);
  const y1 = rand(h * 0.45, h * 1.05) * reach;
  const main = boltPath(x0, -h * 0.08, x1, y1, 1, 24);
  thunder.push({ pts: main, life: 1, decay: 0.16, weight: 1 });

  // one or two forks peeling off the main channel
  const forks = 1 + ((Math.random() * 2) | 0);
  for (let f = 0; f < forks; f++) {
    const k = 6 + ((Math.random() * (main.length - 10)) | 0);
    const [fx, fy] = main[clamp(k, 1, main.length - 2)];
    thunder.push({
      pts: boltPath(fx, fy, fx + rand(-w * 0.16, w * 0.16), fy + rand(h * 0.12, h * 0.32), 1.2, 12),
      life: 0.7, decay: 0.2, weight: 0.55,
    });
  }
}

function strikeThunder() {
  const w = thunderCanvas.width, h = thunderCanvas.height;
  if (!w || !h) return;

  // two or three channels per strike, spread across thirds so the storm
  // reads as full-width instead of one lonely bolt in the middle
  const lanes = [0.18, 0.5, 0.82].sort(() => Math.random() - 0.5);
  const n = 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < n; i++) {
    dropBolt(w, h, w * lanes[i % lanes.length] + rand(-w * 0.12, w * 0.12), 0.7 + Math.random() * 0.4);
  }

  if (legacyFlash) { legacyFlash.classList.remove('fire'); void legacyFlash.offsetWidth; legacyFlash.classList.add('fire'); }
}

function paintThunder(t) {
  if (stale(thunderCanvas)) thunderCtx = fitCanvas(thunderCanvas);
  if (!reduceMotion && t >= nextStrike) {
    nextStrike = t + THUNDER_EVERY * (0.7 + Math.random() * 0.6);
    strikeThunder();
  }
  thunderCtx.clearRect(0, 0, thunderCanvas.width, thunderCanvas.height);
  strokeBolts(thunderCtx, thunder);
}

function paintLegacy() {
  const r = legacy.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return;
  const centred = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
  // the torch copy has to ride the exact same parallax or it won't register
  const t = `scale(1.14) translate3d(0, ${(centred * -46).toFixed(1)}px, 0)`;
  legacyPlate.style.transform = t;
  legacyReveal.style.transform = t;
  ghost.render();
}

/* ═══════════════ cursor + chrome ═══════════════ */
// hoisted
let curX = innerWidth / 2, curY = innerHeight / 2, cx = curX, cy = curY;

addEventListener('pointermove', e => { curX = e.clientX; curY = e.clientY; }, { passive: true });
addEventListener('touchmove', e => {
  if (e.touches && e.touches[0]) {
    curX = e.touches[0].clientX;
    curY = e.touches[0].clientY;
  }
}, { passive: true });
addEventListener('touchstart', e => {
  if (e.touches && e.touches[0]) {
    curX = e.touches[0].clientX;
    curY = e.touches[0].clientY;
  }
}, { passive: true });
document.querySelectorAll('a, .tilt, .stat, .ras__sticky').forEach(el => {
  el.addEventListener('pointerenter', () => cursorEl.classList.add('hot'));
  el.addEventListener('pointerleave', () => cursorEl.classList.remove('hot'));
});

// hoisted
let lastY = scrollY, scrollVel = 0;

function readScroll() {
  const y = scrollY;
  const d = y - lastY;
  scrollVel = lerp(scrollVel, Math.min(Math.abs(d) / 40, 1), 0.12);
  lastY = y;
  railScroll.textContent = `CHAKRA ${String(Math.round(scrollVel * 999)).padStart(3, '0')}`;
  heroHint.classList.toggle('hide', y > innerHeight * 0.35);
  badge.classList.toggle('show', y > innerHeight * 0.6);
}

/* ═══════════════ resize ═══════════════ */
function resizeAll() {
  skyCtx = fitCanvas(skyCanvas);
  sparkCtx = fitCanvas(sparkCanvas);
  gazeCtx = fitCanvas(gazeCanvas);
  dashCtx = fitCanvas(dashCanvas);
  rasCtx = fitCanvas(rasCanvas);
  chakraCtx = fitCanvas(chakra);
  boltCtx = fitCanvas(boltCanvas);
  thunderCtx = fitCanvas(thunderCanvas);
  lastDrawn = -1; rasDrawn = -1; dashDrawn = -1;
  seedSky(); seedOrbit(); measureVelo();
  layoutParticles();
  particles?.resize();
  ghost.resize();
}
addEventListener('resize', resizeAll, { passive: true });

/* ═══════════════ one loop ═══════════════ */
seedSky(); seedOrbit(); measureVelo();

let prev = performance.now();
const clock0 = performance.now();

function frame(t) {
  const dt = Math.min(t - prev, 50);
  prev = t;

  readScroll();
  readScrub();

  cx = lerp(cx, curX, 0.22);
  cy = lerp(cy, curY, 0.22);
  cursorEl.style.transform = `translate(${cx}px, ${cy}px)`;

  if (!reduceMotion) paintSky(t);
  paintSparks();
  paintScrub();
  paintVelo(dt);
  paintBolts(t);
  paintDash(dt, t);
  paintRas(dt);
  paintThunder(t);
  paintLegacy();

  chromeClock.textContent = ((t - clock0) / 1000).toFixed(1) + ' s';

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


let siteReady = false;
function markReady() {
  if (siteReady) return;
  siteReady = true;
  loaderEl.classList.add('done');
  document.body.classList.add('ready');
  resizeAll();
  fireFlash();
  startBgm();

  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  setTimeout(() => {
    window.__lockInitialScroll = false;
    if (window.__forceTop) {
      window.removeEventListener('scroll', window.__forceTop);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, 300);

  setTimeout(() => { loaderEl.style.display = 'none'; }, 900);
}

Promise.all(jobs).then(() => setTimeout(markReady, 360)).catch(markReady);
setTimeout(markReady, 2500);
