// Hero animation: the A sits alone in the centre, R E C H fall in stretched and retract into the logo, one cloche
// rises from the bottom of the page and its lid settles onto the plate, then "the" and "catering" appear.
// Hover the cloche and it rattles. The cloche itself is fixed to the viewport: its plate stays at the bottom of the
// screen but behind the page sections (see css/site.css), while the lid lives in the hero and scrolls away with it.
(() => {
  // --- Letter shapes -----------------------------------------------------------------
  // END = reach ending point.svg. FALL = reach falling.svg. Both have identical command structure once
  // normalised, so we morph by interpolating the numbers; that is what makes the strokes retract along their own outlines.
  const END = {
    R: "M18.51,45.49h24.2c4.8,0,8.98.86,12.55,2.59,3.57,1.73,6.32,4.18,8.25,7.35,1.93,3.18,2.9,6.8,2.9,10.88,0,5.57-1.67,10.14-5,13.7-3.33,3.57-7.4,5.75-12.2,6.53,4.07.55,7.47,2.12,10.2,4.71,2.73,2.59,4.47,6.39,5.2,11.41l1.7,12.35c.6,4.39,1.37,7.88,2.3,10.47h-2.3c-.93-2.67-1.67-6.04-2.2-10.12l-1.5-11.76c-.67-5.49-2.68-9.49-6.05-12-3.37-2.51-8.18-3.76-14.45-3.76h-21.4v37.64h-2.2V45.49ZM41.31,85.49c7.13,0,12.72-1.69,16.75-5.06,4.03-3.37,6.05-8.04,6.05-14s-1.97-10.45-5.9-13.7c-3.93-3.25-9.53-4.88-16.8-4.88h-20.7v37.64h20.6Z",
    E: "M82.81,45.49h42.3v2.35h-40.1v35.76h36.9v2.35h-36.9v37.17h41.2v2.35h-43.4V45.49Z",
    C: "M210.46,122.13c-4.83-3.02-8.63-7.61-11.4-13.76-2.77-6.16-4.15-13.78-4.15-22.88s1.38-16.72,4.15-22.88c2.77-6.15,6.57-10.74,11.4-13.76,4.83-3.02,10.42-4.53,16.75-4.53,7.67,0,14.13,2.25,19.4,6.76,5.27,4.51,8.5,11.47,9.7,20.88h-2.3c-1.13-8.23-4.08-14.49-8.85-18.76-4.77-4.27-10.78-6.41-18.05-6.41-5.93,0-11.13,1.43-15.6,4.29-4.47,2.86-7.95,7.2-10.45,13-2.5,5.8-3.75,12.94-3.75,21.41s1.25,15.61,3.75,21.41c2.5,5.8,6,10.14,10.5,13,4.5,2.86,9.72,4.29,15.65,4.29,7.47,0,13.63-2.23,18.5-6.7,4.87-4.47,7.8-10.98,8.8-19.53h2.4c-1.07,9.33-4.25,16.45-9.55,21.35-5.3,4.9-12.02,7.35-20.15,7.35-6.33,0-11.92-1.51-16.75-4.53Z",
    H: "M320.11,85.96h-48.3v39.52h-2.2V45.49h2.2v38.11h48.3v-38.11h2.2v79.99h-2.2v-39.52Z",
  };
  const FALL = {
    R: "M12.23,10.29h24.2c4.8,0,8.98.95,12.55,2.84,3.57,1.89,6.32,4.58,8.25,8.07,1.93,3.48,2.9,7.47,2.9,11.94,0,6.11-1.67,11.12-5,15.04-3.33,3.92-7.4,6.3-12.2,7.16,4.07.6,7.47,2.32,10.2,5.16,2.73,2.84,4.47,7.01,5.2,12.52l1.7,233.78c.6,4.82,1.37,8.65,2.3,11.49h-2.3c-.93-2.92-1.67-6.63-2.2-11.1l-1.5-233.14c-.67-6.02-2.68-10.41-6.05-13.17-3.37-2.75-8.18-4.13-14.45-4.13H14.43v261.53h-2.2V10.29ZM35.03,54.18c7.13,0,12.72-1.85,16.75-5.55,4.03-3.7,6.05-8.82,6.05-15.36s-1.97-11.47-5.9-15.04c-3.93-3.57-9.53-5.36-16.8-5.36H14.43v41.31h20.6Z",
    E: "M76.53,10.29h42.3v2.58h-40.1v39.24h36.9v2.58h-36.9v261.15h41.2v2.58h-43.4V10.29Z",
    C: "M206.61,313.46c-4.83-3.31-8.63-8.35-11.4-15.1-2.77-6.75-4.15-15.12-4.15-25.11s-1.05-237.42,1.71-244.18c2.77-6.75,6.57-11.79,11.4-15.1,4.83-3.31,10.42-4.97,16.75-4.97,7.67,0,14.13,2.47,19.4,7.42,5.27,4.95,8.5,12.59,9.7,22.91h-2.3c-1.13-9.04-4.08-15.9-8.85-20.59-4.77-4.69-10.78-7.03-18.05-7.03-5.93,0-11.13,1.57-15.6,4.71-4.47,3.14-7.95,7.9-10.45,14.26-2.5,6.37-1.31,233.27-1.31,242.56s1.25,17.13,3.75,23.49c2.5,6.37,6,11.12,10.5,14.26,4.5,3.14,9.72,4.71,15.65,4.71,7.47,0,13.63-2.45,18.5-7.36,4.87-4.91,7.8-12.05,8.8-21.43h2.4c-1.07,10.24-4.25,18.05-9.55,23.43-5.3,5.38-12.02,8.07-20.15,8.07-6.33,0-11.92-1.66-16.75-4.97Z",
    H: "M313.83,54.69h-48.3v263.73h-2.2V10.29h2.2v41.82h48.3V10.29h2.2v308.13h-2.2V54.69Z",
  };
  // reach falling.svg uses a different origin. Shift it into ending-point coordinates so the FEET line up with the
  // baseline of the A (y = 125.48): the stretch then rises above the A and the tops retract down.
  const DX = 6.28;
  const DY = { R: -192.94, E: -192.94, H: -192.94, C: -191.33 }; // C aligned on its own start point (its bottom curve overshoots the baseline)
  const C_X_FIX = -2.43; // the C in the falling file sits 2.43 right of where it lands; line it up
  const LETTERS = ['R', 'E', 'C', 'H'];

  // Normalise a path to absolute commands (M L H V C S Z) so two paths drawn with a mix of relative and
  // absolute commands can be compared and interpolated point for point.
  const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Z: 0 };
  function normalise(d) {
    const toks = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g);
    const segs = [];
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
      else if (cmd === 'M') cmd = 'L';
      else if (cmd === 'm') cmd = 'l';
      const up = cmd.toUpperCase(), rel = cmd !== up;
      const a = toks.slice(i, i + ARGS[up]).map(parseFloat);
      i += ARGS[up];
      if (up === 'Z') { segs.push({ c: 'Z', n: [] }); x = sx; y = sy; continue; }
      if (up === 'H') { const nx = rel ? x + a[0] : a[0]; segs.push({ c: 'H', n: [nx] }); x = nx; continue; }
      if (up === 'V') { const ny = rel ? y + a[0] : a[0]; segs.push({ c: 'V', n: [ny] }); y = ny; continue; }
      const abs = a.map((v, j) => (rel ? v + (j % 2 ? y : x) : v));
      segs.push({ c: up, n: abs });
      x = abs[abs.length - 2]; y = abs[abs.length - 1];
      if (up === 'M') { sx = x; sy = y; }
    }
    return segs;
  }

  const shapes = {};
  for (const k of LETTERS) {
    const from = normalise(FALL[k]);
    const to = normalise(END[k]);
    if (from.map((s) => s.c).join('') !== to.map((s) => s.c).join('')) console.error('Path structure mismatch for', k);
    const dx = DX + (k === 'C' ? C_X_FIX : 0), dy = DY[k];
    from.forEach((s) => {
      s.n = s.n.map((v, j) => (s.c === 'V' ? v + dy : s.c === 'H' ? v + dx : v + (j % 2 ? dy : dx)));
    });
    shapes[k] = { from, to };
  }
  const dAt = (k, t) => {
    const { from, to } = shapes[k];
    let out = '';
    for (let i = 0; i < to.length; i++) {
      out += to[i].c + to[i].n.map((v, j) => (from[i].n[j] + (v - from[i].n[j]) * t).toFixed(3)).join(' ');
    }
    return out;
  };

  // --- Elements ----------------------------------------------------------------------
  const root = document.documentElement;
  const svg = document.getElementById('logo');
  const A = document.getElementById('A');
  const the = document.getElementById('the');
  const cat = document.getElementById('catering');
  // Right-align "catering" so the ink of its last letter ends flush with the right edge of the H (x = 322.31).
  const H_RIGHT = 322.31;
  function alignCat() {
    cat.setAttribute('text-anchor', 'end');
    const cs = getComputedStyle(cat);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText('g');
    const bearing = m.width - m.actualBoundingBoxRight; // space between the g's ink and its advance edge
    const y = cat.transform.baseVal.consolidate().matrix.f;
    cat.setAttribute('transform', `translate(${(H_RIGHT + bearing).toFixed(2)} ${y})`);
  }
  alignCat();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignCat);
  const els = Object.fromEntries(LETTERS.map((k) => [k, document.getElementById(k)]));
  const plate = document.getElementById('plate');
  const dome = document.getElementById('lid');
  const shadow = document.getElementById('plate-shadow');
  // The height everything is laid out against. On phones window.innerHeight changes every time the address bar slides
  // in or out, which used to re-lay-out the cloche mid-scroll (the plate hopped). .plate-layer is sized in svh units,
  // so its height only changes on a real resize or rotation.
  const plateLayer = document.querySelector('.plate-layer');
  const stableH = () => plateLayer.clientHeight || innerHeight;

  // The logo is drawn in SVG units; the viewBox is sized to the hero and centred on the A, so the A is always
  // dead centre and the logo keeps a fixed size (px per unit) however tall or wide the window is.
  let viewTop = 0, logoBottom = 0; // logoBottom: screen y (px) of the bottom of "catering" when the page is at the top
  function layout() {
    const vw = svg.clientWidth || innerWidth, vh = svg.clientHeight || innerHeight;
    const scale = Math.min(vw * 0.78, 760) / 304; // the logo's ink is ~304 units wide
    const b = A.getBBox();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const W = vw / scale, H = vh / scale;
    svg.setAttribute('viewBox', `${cx - W / 2} ${cy - H / 2} ${W} ${H}`);
    viewTop = cy - H / 2;
    logoBottom = vh / 2 + (LOGO_BOTTOM - cy) * scale;
  }

  // --- Timeline (ms) -----------------------------------------------------------------
  const HOLD = 250;        // A alone in the centre, after the loader hands it back (REACH falls straight after)
  const FALL_MS = 950;     // letters fall in, already stretched
  const SQUASH_MS = 1250;  // strokes retract up their own lines to the final letterform
  const STAGGER = 110;
  const TEXT_MS = 800;
  const TEXT_GAP = 150;    // pause after everything settles, before the words appear
  const RISE_MS = 1100, LOWER_AT = 950, LOWER_MS = 380; // cloche: rises, then the lid lowers onto the plate
  const CLOCHE_AT = HOLD + 100;
  const JIGGLE_MS = 1000;

  const clamp = (x) => Math.min(1, Math.max(0, x));
  const easeInQuad = (x) => x * x;
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  const easeOutCubic = (x) => 1 - (1 - x) ** 3;
  const decay = (u, tau) => Math.exp(-u / tau);
  const TAU = Math.PI * 2;

  const lettersDone = HOLD + (LETTERS.length - 1) * STAGGER + FALL_MS + SQUASH_MS;
  const clocheDone = CLOCHE_AT + LOWER_AT + LOWER_MS;
  const textStart = Math.max(lettersDone, clocheDone + 600) + TEXT_GAP;
  const END_MS = textStart + 250 + TEXT_MS;

  // --- Cloche ------------------------------------------------------------------------
  // One image (cloche-cobalt.png: dome floating above its plate) cut into two parts. The plate is the lower part; the
  // lid is the upper part, which lowers by `domeSeat` to sit on the plate.
  const SRC = 'images/cloche-cobalt.webp';
  const ART = {
    plateW: 0.869,   // width of the plate as a fraction of the image width
    foot: 0.962,     // where the plate meets the ground, as a fraction of the image height
    split: 0.68,     // the image is cut here into lid (above) and plate (below)
    domeSeat: 0.195, // how far the lid drops to sit on the plate, as a fraction of the image height
  };
  const FOOT_Y = 0.93;       // the plate's base sits at 93% of the viewport height
  const LOGO_BOTTOM = 160;   // bottom of "catering" (descenders included) in logo units
  const KNOB_CLEARANCE = 12; // px of clear space between "catering" and the top of the lid's knob
  plate.style.clipPath = `inset(${ART.split * 100}% 0 0 0)`;
  dome.style.clipPath = `inset(0 0 ${(1 - ART.split) * 100}% 0)`;
  dome.style.transformOrigin = '50% 64%'; // the lid rocks about its rim
  const c = { W: 0, H: 0, footY: 0, plateW: 0, sign: 1 };

  function placeCloche() {
    const vw = innerWidth, vh = stableH();
    c.footY = vh * FOOT_Y;
    // Size the cloche so the top of its knob stops below "catering": the visible cloche (knob to plate base) is
    // ~70.8% of the image height. Never bigger than 30% of the width (60% on phones).
    const room = c.footY - (logoBottom + KNOB_CLEARANCE);
    const fitW = (Math.max(room, 80) / 0.708) * 1.5 * ART.plateW;
    c.plateW = Math.min(fitW, vw < 700 ? vw * 0.6 : vw * 0.3);
    c.W = c.plateW / ART.plateW;      // image width, so the plate is plateW wide
    c.H = (c.W * 2) / 3;              // the image is 3:2
    for (const el of [plate, dome]) {
      Object.assign(el.style, {
        width: `${c.W}px`,
        left: `${(vw - c.W) / 2}px`,
        top: `${c.footY - ART.foot * c.H}px`,
      });
    }
    plate.style.transformOrigin = `50% ${ART.foot * 100}%`;
    const sw = c.plateW * 1.05, sh = c.plateW * 0.17;
    Object.assign(shadow.style, {
      width: `${sw}px`, height: `${sh}px`,
      left: `${(vw - sw) / 2}px`, top: `${c.footY - sh * 0.45}px`,
    });
    // The footer's landing slot is this tall (plate rim to base), so the plate lands exactly in it.
    root.style.setProperty('--plate-vis', `${0.25 * c.H}px`);
    updateLanding();
  }

  // The plate stays pinned to the bottom of the screen until the landing slot (under "Who's hungry?") reaches its
  // resting place; from then on it moves up with the page, so the footer details sit below the plate.
  const slot = document.getElementById('plate-slot');
  let lastLift = 0;
  function updateLanding() {
    if (!slot) return;
    const lift = Math.round(Math.min(0, slot.getBoundingClientRect().bottom - c.footY) * 2) / 2;
    if (lift === lastLift) return;
    lastLift = lift;
    plateLayer.style.transform = lift ? `translate3d(0, ${lift}px, 0)` : '';
  }

  let jigAt = null;
  function renderCloche(ms) {
    const vh = stableH(), H = c.H, W = c.W;
    const seat = ART.domeSeat * H;
    // Rise from below the page as the open set (lid floating above the plate), then the lid lowers onto the plate.
    const riseFrom = vh - c.footY + 0.95 * H;                              // the whole set starts below the bottom edge
    const dy = riseFrom * (1 - easeOutCubic(clamp((ms - CLOCHE_AT) / RISE_MS))); // positive = below its resting place
    const lp = clamp((ms - CLOCHE_AT - LOWER_AT) / LOWER_MS);
    const ud = ms - CLOCHE_AT - LOWER_AT - LOWER_MS;                       // ms since the lid seated
    let plateDy = dy, plateRz = 0, plateX = 0;
    let domeDy = dy + seat * easeInQuad(lp), domeRz = 0, domeX = 0;
    if (isFinite(ud) && ud > 0 && ud < 1800) {
      domeDy -= 0.03 * H * decay(ud, 200) * Math.abs(Math.sin((ud * Math.PI) / 260));          // the lid bounces
      domeRz = 3.2 * -c.sign * decay(ud, 240) * Math.sin((ud * Math.PI) / 170);                // and clinks
      plateDy += 0.012 * H * decay(ud, 110) * Math.sin((ud * Math.PI) / 150);                  // the plate jolts under it
      plateRz += 1.4 * c.sign * decay(ud, 230) * Math.sin((ud * Math.PI) / 190);
    }
    // Hover: the lid rattles on its plate, the plate shudders underneath.
    const j = jigAt === null ? Infinity : ms - jigAt;
    if (j >= 0 && j < JIGGLE_MS) {
      const env = decay(j, 280);
      domeRz += 6 * env * Math.sin((j / 105) * TAU);
      domeX = 0.012 * W * env * Math.sin((j / 68) * TAU);
      domeDy -= 0.014 * H * env * Math.abs(Math.sin((j / 105) * TAU));
      plateRz += 1.8 * env * Math.sin((j / 125) * TAU + 1);
      plateX = 0.004 * W * env * Math.sin((j / 60) * TAU);
    }
    const on = ms >= CLOCHE_AT ? 'visible' : 'hidden';
    dome.style.visibility = plate.style.visibility = on;
    dome.style.transform = `translate(${domeX.toFixed(1)}px, ${domeDy.toFixed(1)}px) rotate(${domeRz.toFixed(2)}deg)`;
    plate.style.transform = `translate(${plateX.toFixed(1)}px, ${plateDy.toFixed(1)}px) rotate(${plateRz.toFixed(2)}deg)`;

    // Shadow: marks the landing spot before anything arrives, then firms up and tightens as the set comes in.
    const air = clamp(Math.abs(dy) / (vh * 0.6));
    const show = clamp((ms - Math.max(CLOCHE_AT - 380, 1)) / 380); // 0 at ms = 0, so no ghost shadow while the loader plays
    shadow.style.opacity = (show * (0.3 + 0.7 * (1 - air))).toFixed(3);
    shadow.style.transform = `scale(${(0.6 + 0.4 * (1 - air)).toFixed(3)})`;
  }

  // --- Render one moment of the whole hero ---------------------------------------------
  let lastMs = 0;
  function render(ms) {
    lastMs = ms;
    renderCloche(ms);
    const startY = viewTop - 140; // start with the whole stretched letter above the viewport
    LETTERS.forEach((k, i) => {
      const t0 = HOLD + i * STAGGER;
      const fall = clamp((ms - t0) / FALL_MS);
      const squash = clamp((ms - t0 - FALL_MS) / SQUASH_MS);
      els[k].setAttribute('d', dAt(k, easeInOutCubic(squash)));
      els[k].setAttribute('transform', `translate(0 ${(startY * (1 - easeInQuad(fall))).toFixed(2)})`);
      els[k].style.visibility = ms < t0 ? 'hidden' : 'visible';
    });
    [the, cat].forEach((el, i) => {
      const p = easeOutCubic(clamp((ms - textStart - i * 250) / TEXT_MS));
      el.setAttribute('opacity', p.toFixed(3));
      el.setAttribute('dy', ((1 - p) * 6).toFixed(2));
    });
  }

  // --- Loader: "A class [word]" ------------------------------------------------------------
  // The A slides left. Only once it has cleared the centre do "class" and the cycling word fade in, with the percentage
  // under them. The words start slowly (service, food, events) and then keep speeding up until the count reaches 100%
  // and it lands on the last word. Then "class", the word and the percentage fade, the A glides slowly back to the
  // centre, and the logo plays (REACH falls, the cloche rises from the ground).
  let loaderActive = false; // true while the loader plays, so a resize or a late font re-measures it
  const pre = document.getElementById('pre');
  const preClass = document.getElementById('pre-class');
  const preW = [document.getElementById('pre-w1'), document.getElementById('pre-w2')];
  const prePct = document.getElementById('pre-pct');
  const preClip = document.getElementById('pre-clip-rect');

  // The words, in order. The last one is where it lands. Keep them short: the slot is as wide as the widest.
  const WORDS = ['service', 'food', 'events', 'weddings', 'canapés', 'feasts', 'dining', 'drinks', 'buffets', 'flavour',
    'catering', 'parties', 'taste', 'style', 'welcome', 'detail', 'care', 'events'];
  const SLOW_N = 3, SLOW_MS = 600;          // the first three words hold for this long each...
  const FAST_MS = 430, FAST_DECAY = 0.75, MIN_STEP = 95; // ...then each word is shown 25% shorter than the one before
  const starts = [0], steps = [];
  for (let i = 1; i < WORDS.length; i++) {
    const hold = i <= SLOW_N ? SLOW_MS : Math.max(MIN_STEP, FAST_MS * FAST_DECAY ** (i - SLOW_N - 1)); // how long word i-1 was shown
    steps.push(hold);
    starts.push(starts[i - 1] + hold);
  }
  const swapMs = (i) => Math.min(380, 0.7 * steps[i - 1]); // how long the roll from word i-1 to word i lasts
  const SCHEDULE_MS = starts[WORDS.length - 1] + swapMs(WORDS.length - 1); // the last word has finished rolling in (= 100%)

  const BASE_Y = 125.48;      // the A's baseline, in logo units
  const GAP = 24;             // space between "class" and the word
  const GAP_A = 6;            // space between the A and the hyphen (the hyphen belongs to "-class", so it hugs both)
  const RISE = 70;            // how far a word travels as it rolls in and out
  const pl = { dx: 0, s: 1, cx: 0, cy: 0 }; // dx: how far the A shifts left; s: fit-to-screen scale of the whole line

  // Measure the line with the real fonts, then place everything. Centres the whole "A class [word]" line on the screen.
  function layoutPre() {
    const b = A.getBBox();
    pl.cx = b.x + b.width / 2;
    pl.cy = b.y + b.height / 2;
    preClass.textContent = '-class';  // "A-class"
    const wClass = preClass.getComputedTextLength();
    let wWord = 0;
    WORDS.forEach((w) => { preW[0].textContent = w; wWord = Math.max(wWord, preW[0].getComputedTextLength()); });
    const total = b.width + GAP_A + wClass + GAP + wWord;
    pl.dx = (total - b.width) / 2;
    const left = pl.cx - total / 2;
    const classX = left + b.width + GAP_A, wordX = classX + wClass + GAP;
    preClass.setAttribute('x', classX); preClass.setAttribute('y', BASE_Y);
    preW.forEach((t) => { t.setAttribute('x', wordX + wWord / 2); t.setAttribute('y', BASE_Y); }); // words are centred in their slot
    preClip.setAttribute('x', wordX - 8); preClip.setAttribute('y', BASE_Y - 88);
    preClip.setAttribute('width', wWord + 16); preClip.setAttribute('height', 88 + 26);
    prePct.setAttribute('x', pl.cx); prePct.setAttribute('y', BASE_Y + 46);
    // Shrink the whole line if it would not fit the screen (phones), about the centre of the A.
    const unitPx = svg.clientWidth / (svg.viewBox.baseVal.width || 1);
    pl.s = Math.min(1, (svg.clientWidth * 0.84) / (total * unitPx));
    pre.setAttribute('transform', `translate(${pl.cx} ${pl.cy}) scale(${pl.s}) translate(${-pl.cx} ${-pl.cy})`);
  }

  // What the loader shows at a point in the word schedule (tau, in ms): which word, whether it is mid-roll, and the %.
  function stateAt(tau) {
    let idx = 0;
    while (idx < WORDS.length - 1 && starts[idx + 1] <= tau) idx++;
    const into = tau - starts[idx];
    const u = idx > 0 ? clamp(into / swapMs(idx)) : 1;
    const x = clamp(tau / SCHEDULE_MS);
    return { idx, u, p: 0.5 - Math.cos(Math.PI * x) / 2 };
  }

  // Draw the loader at one moment.
  //   appear: the A slides left (0-1) · textIn: "class", the word and the % fade in (0-1) · st: from stateAt()
  //   fade: all the text fades out (0-1) · glide: the A glides back to the centre (0-1)
  const setText = (node, v) => { if (node.textContent !== v) node.textContent = v; };
  function drawPre({ appear, textIn, st, fade, glide }) {
    const left = easeInOutCubic(appear) * (1 - easeInOutCubic(glide));     // 0 = centred and full size, 1 = shifted left
    const sc = 1 + (pl.s - 1) * left;
    A.setAttribute('transform', left < 0.0005 ? '' : `translate(${pl.cx} ${pl.cy}) scale(${sc.toFixed(4)}) translate(${-pl.cx} ${-pl.cy}) translate(${(-pl.dx * left).toFixed(3)} 0)`);
    pre.setAttribute('opacity', (clamp(textIn) * (1 - clamp(fade))).toFixed(3));
    setText(prePct, `${Math.floor(clamp(st.p) * 100)}%`);
    // each word always lives in the same one of the two text elements (even / odd), so nothing has to be tracked
    const cur = preW[st.idx % 2], prev = preW[(st.idx + 1) % 2];
    setText(cur, WORDS[st.idx]);
    if (st.idx > 0 && st.u < 1) {
      const u = easeInOutCubic(st.u);
      setText(prev, WORDS[st.idx - 1]);
      prev.setAttribute('transform', `translate(0 ${(-RISE * u).toFixed(2)})`); prev.setAttribute('opacity', (1 - u).toFixed(3));
      cur.setAttribute('transform', `translate(0 ${(RISE * (1 - u)).toFixed(2)})`); cur.setAttribute('opacity', u.toFixed(3));
    } else {
      cur.setAttribute('transform', ''); cur.setAttribute('opacity', 1);
      prev.setAttribute('opacity', 0);
    }
  }

  function endLoading() {
    try { sessionStorage.setItem('reach-loader', '1'); } catch (e) {}
    root.classList.remove('is-loading');
    document.body.removeAttribute('aria-busy');
  }

  // Runs the loader and resolves when the A is back in the centre. `readiness` reports real loading progress (0-1):
  // the count never runs ahead of the fonts and the cloche image actually arriving (it waits at ~90% until they have).
  const APPEAR_MS = 950, TEXT_IN_AT = 0.9, TEXT_IN_MS = 500; // the text only starts to show once the A has (nearly) arrived
  const LAND_HOLD = 550, FADE_MS = 650, GLIDE_AFTER = 300, GLIDE_MS = 1800;
  const MAX_WAIT = 4500; // on a slow connection the count stops waiting for the fonts / image after this long
  function runLoader(readiness) {
    loaderActive = true;
    return new Promise((resolve) => {
      const t0 = performance.now();
      let last = t0, tau = 0, doneAt = -1;
      const tick = (now) => {
        const t = now - t0, dt = Math.min(50, now - last);
        last = now;
        const appear = clamp(t / APPEAR_MS);
        const textIn = clamp((t - APPEAR_MS * TEXT_IN_AT) / TEXT_IN_MS);
        if (t >= APPEAR_MS * TEXT_IN_AT) {                      // the schedule starts when the text does
          const ready = now - t0 > MAX_WAIT ? 1 : readiness();
          const cap = ready >= 1 ? 1 : 0.3 + 0.6 * ready;       // hold back until the real work is done
          tau = Math.min(SCHEDULE_MS * cap, tau + dt);
        }
        const st = stateAt(tau);
        if (tau >= SCHEDULE_MS && doneAt < 0) doneAt = t;      // landed on the last word at 100%
        const since = doneAt < 0 ? -1 : t - doneAt;
        const fade = since < LAND_HOLD ? 0 : clamp((since - LAND_HOLD) / FADE_MS);
        const glide = since < LAND_HOLD + GLIDE_AFTER ? 0 : clamp((since - LAND_HOLD - GLIDE_AFTER) / GLIDE_MS);
        drawPre({ appear, textIn, st, fade, glide });
        if (glide < 1) requestAnimationFrame(tick);
        else { A.removeAttribute('transform'); pre.setAttribute('opacity', 0); loaderActive = false; resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }

  // --- Playback ----------------------------------------------------------------------
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, startAt = 0, interactive = false, hoverLoop = 0;
  function play() {
    layout();
    placeCloche();
    if (reduced) { render(Infinity); return; } // final state, no motion
    const frozen = new URLSearchParams(location.search).get('t'); // ?t=1800 freezes the timeline at 1800ms (for tuning)
    if (frozen !== null) { render(parseFloat(frozen)); interactive = true; startAt = performance.now() - parseFloat(frozen); return; }
    interactive = true;
    startAt = performance.now();
    const tick = (now) => {
      const ms = now - startAt;
      render(ms);
      if (ms < END_MS) raf = requestAnimationFrame(tick);
    };
    render(0);
    raf = requestAnimationFrame(tick);
  }

  // --- Hover: the cloche shakes and jiggles ----------------------------------------------
  // Hit-test an ellipse around the cloche (the image box is mostly transparent). Only while the hero is on screen:
  // after that the lid has scrolled away and the plate is behind the sections.
  function overCloche(x, y) {
    if (scrollY > innerHeight * 0.2) return false;
    const dx = (x - innerWidth / 2) / (c.plateW * 0.5);
    const dy = (y - (c.footY - 0.36 * c.H)) / (0.4 * c.H);
    return dx * dx + dy * dy <= 1;
  }
  function jiggleFrame() {
    const ms = performance.now() - startAt;
    renderCloche(ms);
    hoverLoop = jigAt !== null && ms - jigAt < JIGGLE_MS ? requestAnimationFrame(jiggleFrame) : 0;
  }
  function poke(e) {
    if (!interactive) return;
    const ms = performance.now() - startAt;
    const over = ms > CLOCHE_AT + LOWER_AT + LOWER_MS && overCloche(e.clientX, e.clientY); // only once it has landed
    document.body.style.cursor = over ? 'pointer' : '';
    if (over && (jigAt === null || ms - jigAt > JIGGLE_MS * 0.7)) { // re-rattle if you keep hovering
      jigAt = ms;
      if (!hoverLoop) hoverLoop = requestAnimationFrame(jiggleFrame);
    }
  }
  addEventListener('pointermove', poke);
  addEventListener('pointerdown', poke);
  let landTick = false;
  addEventListener('scroll', () => { if (!landTick) { landTick = true; requestAnimationFrame(() => { landTick = false; updateLanding(); }); } }, { passive: true });
  addEventListener('load', updateLanding);
  // Phones fire "resize" whenever the address bar slides in or out; nothing needs re-laying-out for that.
  let seenW = innerWidth, seenH = stableH();
  addEventListener('resize', () => {
    const w = innerWidth, h = stableH();
    if (w === seenW && h === seenH) return;
    seenW = w; seenH = h;
    layout();
    placeCloche();
    render(lastMs);
    if (loaderActive) layoutPre();
  });

  // --- Start up --------------------------------------------------------------------------
  // The loader waits for the fonts and the cloche image (never more than 8s: if the font kit is slow or blocked on this
  // domain it carries on with the fallback font) and shows how far along that is. It is skipped when the visitor asked for
  // no motion, jumped straight to a section (#contact), arrived scrolled, or when ?t= is used for tuning.
  layout();
  placeCloche();
  render(0);
  const qs = new URLSearchParams(location.search);
  // the loader plays once per visit (tab session); later page loads go straight to the logo
  let seen = false;
  try { seen = sessionStorage.getItem('reach-loader') === '1'; } catch (e) {}
  const skipLoader = reduced || seen || qs.has('t') || qs.has('pre') || location.hash || scrollY > 4 || !pre;
  let tasks = 0;
  const TASKS = 3;
  const done = () => { tasks = Math.min(TASKS, tasks + 1); };
  const fontReady = document.fonts.ready
    .then(() => Promise.all([document.fonts.load('100 100px "sets-grotesk-m"'), document.fonts.load('600 100px "sets-grotesk-m"'), document.fonts.load('300 20px "sets-grotesk-m"')]))
    .catch(() => {}).then(done);
  const imageReady = new Image();
  imageReady.src = SRC;
  const imgDone = imageReady.decode().catch(() => {}).then(done);
  const pageDone = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }))).then(done);
  const capped = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  if (skipLoader) {
    const why = reduced ? 'reduced motion is on' : seen ? 'already played this visit' : qs.has('t') || qs.has('pre') ? 'a ?t= / ?pre= tuning parameter is in the URL' : location.hash ? 'the URL has a #section' : scrollY > 4 ? 'the page was already scrolled' : 'loader markup missing (stale cached index.html?)';
    console.info('[hero] loader skipped:', why);
    endLoading();
    // ?pre=0.5 freezes the loader at 50% for tuning (add &fade=1 or &glide=0.5 for the later moments)
    if (qs.has('pre') && !reduced) {
      document.fonts.ready.then(() => {
        layoutPre();
        const x = clamp(parseFloat(qs.get('pre')));  // 0-1 through the word schedule
        drawPre({ appear: 1, textIn: 1, st: stateAt(x * SCHEDULE_MS), fade: parseFloat(qs.get('fade') || 0), glide: parseFloat(qs.get('glide') || 0) });
      });
    } else {
      Promise.race([Promise.all([fontReady, imgDone]), capped(2000)]).then(play);
    }
  } else {
    document.body.setAttribute('aria-busy', 'true');
    // lay the loader out as soon as the thin font is there (or after 700ms), then play
    Promise.race([Promise.all([document.fonts.load('100 100px "sets-grotesk-m"'), document.fonts.load('600 100px "sets-grotesk-m"')]).catch(() => {}), capped(700)]).then(() => {
      layoutPre();
      return runLoader(() => tasks / TASKS);
    }).then(() => { endLoading(); play(); });
    // if the fonts arrive after the loader was measured with the fallback font, measure it again (the words would
    // otherwise be mis-centred or clipped for the rest of the loader)
    fontReady.then(() => { if (loaderActive) layoutPre(); });
    // never leave a visitor waiting on the loader
    setTimeout(() => { if (root.classList.contains('is-loading')) { loaderActive = false; endLoading(); A.removeAttribute('transform'); pre.setAttribute('opacity', 0); play(); } }, 14000);
  }
})();
