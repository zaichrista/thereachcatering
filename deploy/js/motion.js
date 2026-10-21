// Scroll and interaction motion for everything below the hero:
//   headings whose words rise into place · blocks that fade up · a sideways marquee that follows your scrolling
//   · a year that counts up · a sentence that lights up word by word · menus that open as the cloche lid lifts
//   · a lid that lifts as the band scrolls through · service cards that stack · a swipeable testimonial slider
//   · a nav that slides away on the way down and back on the way up, plus a scroll progress line.
// With "reduce motion" switched on, nothing moves: everything simply appears.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const easeOut = (x) => 1 - (1 - x) ** 3;

  // --- Headings: wrap each word so it can rise into place -------------------------------
  $$('[data-split]').forEach((h) => {
    const text = h.textContent.trim().replace(/\s+/g, ' ');
    h.setAttribute('aria-label', text);
    h.textContent = '';
    text.split(' ').forEach((word, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      w.style.setProperty('--wi', i);
      const inner = document.createElement('span');
      inner.textContent = word;
      w.append(inner);
      h.append(w, ' ');
    });
  });

  // --- Reveal on scroll ---------------------------------------------------------------
  // Siblings that reveal together arrive one after another.
  const groups = new Map();
  $$('.reveal').forEach((el) => {
    const list = groups.get(el.parentElement) || [];
    el.style.setProperty('--d', `${Math.min(list.length, 5) * 0.09}s`);
    list.push(el);
    groups.set(el.parentElement, list);
  });
  const revealTargets = $$('.reveal, [data-split]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }

  // --- Marquee: drifts sideways; scrolling speeds it up and sets its direction ---------------------
  const marquee = $('#marquee');
  const track = $('#marquee-track');
  const set = $('.marquee__set', track);
  let marqueeVisible = false;
  if (reduced) {
    track.style.width = 'auto';
    set.style.flexWrap = 'wrap';
    set.style.whiteSpace = 'normal';
    set.style.justifyContent = 'center';
  } else {
    let setW = 0, fillW = 0;
    const fill = () => {
      while (track.children.length > 1) track.lastChild.remove();
      setW = set.offsetWidth;
      fillW = innerWidth;
      const need = innerWidth * 2 + setW;
      for (let n = 1; setW * n < need; n++) {
        const clone = set.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.append(clone);
      }
    };
    fill();
    // Rebuilding the track on every "resize" made the marquee hop whenever a phone's address bar slid in or out, so only
    // rebuild when the width changed (rotation) or the font arrived and changed the width of the words.
    addEventListener('resize', () => { if (innerWidth !== fillW) fill(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (set.offsetWidth !== setW) fill(); });
    let x = 0, dir = -1, lastY = scrollY, vel = 0;
    const drift = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      vel += (Math.abs(dy) - vel) * 0.12;
      if (dy > 0) dir = -1; else if (dy < 0) dir = 1;
      x += dir * (0.6 + vel * 0.55);
      const w = setW;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (marqueeVisible) requestAnimationFrame(drift);
    };
    new IntersectionObserver(([e]) => {
      const was = marqueeVisible;
      marqueeVisible = e.isIntersecting;
      // lastY is stale after the marquee has been off screen: without this reset the first frame sees the whole distance
      // scrolled as one huge step and the marquee sprints.
      if (marqueeVisible && !was) { lastY = scrollY; vel = 0; requestAnimationFrame(drift); }
    }).observe(marquee);
  }

  // --- The year counts up when it comes into view ----------------------------------------
  const year = $('#year-big');
  if (year && !reduced && 'IntersectionObserver' in window) {
    const target = Number(year.dataset.count) || 2002, from = target - 112;
    year.textContent = String(from);
    const yio = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      yio.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const p = clamp((now - t0) / 1800);
        year.textContent = String(Math.round(from + (target - from) * easeOut(p)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    yio.observe(year);
  }

  // --- "What we offer": the sentence lights up word by word ----------------------------------
  const statement = $('#statement');
  const words = [];
  if (statement && !reduced) {
    const text = statement.textContent.trim().replace(/\s+/g, ' ');
    statement.textContent = '';
    text.split(' ').forEach((word) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.textContent = word;
      words.push(s);
      statement.append(s, ' ');
    });
  }

  // --- Menus: one open at a time; opening lifts the lid --------------------------------------
  const items = $$('.acc__item');
  items.forEach((item) => {
    const btn = $('.acc__btn', item);
    if (btn.getAttribute('aria-expanded') === 'true') item.classList.add('is-open');
    btn.addEventListener('click', () => {
      const before = btn.getBoundingClientRect().top;
      const open = !item.classList.contains('is-open');
      items.forEach((other) => {
        const isThis = other === item;
        other.classList.toggle('is-open', isThis && open);
        $('.acc__btn', other).setAttribute('aria-expanded', String(isThis && open));
      });
      if (!reduced) holdPosition(btn, before);
    });
  });

  // Opening one menu closes another, and if that one is above, everything below it (the row just tapped included) used
  // to slide up the screen. Browsers without scroll anchoring (iOS Safari) did this every time. For the length of the
  // transition, scroll by whatever the row has moved so it stays under the finger. A touch or wheel hands control back.
  let holdId = 0, rowHold = null;
  const applyHold = () => {
    if (!rowHold) return;
    const d = rowHold.btn.getBoundingClientRect().top - rowHold.before;
    if (Math.abs(d) > 0.5) scrollTo(0, scrollY + d);
  };
  function holdPosition(btn, before) {
    const id = ++holdId, t0 = performance.now(), root = document.documentElement;
    rowHold = { btn, before };
    root.style.scrollBehavior = 'auto';
    const stop = () => { if (holdId === id) holdId++; };
    addEventListener('touchstart', stop, { passive: true, once: true });
    addEventListener('wheel', stop, { passive: true, once: true });
    const tick = (now) => {
      if (holdId !== id || now - t0 > 800) { if (holdId === id) { holdId++; rowHold = null; } root.style.scrollBehavior = ''; return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // The plate follows the lower border: --drop is the panel's height, updated every frame while it opens or closes
  // (a ResizeObserver fires after layout and before paint, so the two stay in step, opening and closing alike).
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const lid = $('.cloche', e.target.closest('.acc__item'));
      lid.style.setProperty('--drop', e.target.getBoundingClientRect().height.toFixed(2) + 'px');
    });
    applyHold(); // same frame, after layout and before paint: the tapped row never visibly moves
  });
  $$('.acc__panel').forEach((panel) => ro.observe(panel));

  // --- Service cards: each one tucks back a little as the next slides over it -------------------
  const cards = $$('.scard');
  const svcHead = $('#services-head'), svcStack = $('#stack');
  // --head-h: how tall the pinned copy is (the cards stick just below it). --tail: how far the last card travels once stuck,
  // so the copy lets go exactly as the stacked cards do and nothing slides underneath it.
  const sizeHead = () => {
    const sec = svcHead.closest('.services');
    sec.style.setProperty('--head-h', svcHead.offsetHeight + 'px');
    // size the cards so the last one, stuck beneath the copy, ends fully on screen
    const stepPx = (parseFloat(getComputedStyle(cards[1]).top) || 0) - (parseFloat(getComputedStyle(cards[0]).top) || 0);
    const fit = innerHeight - svcHead.offsetHeight - stepPx * (cards.length - 1) - 24;
    sec.style.setProperty('--card-h', Math.max(270, Math.min(420, fit)) + 'px');
    sec.style.setProperty('--tail', (cards[0].offsetHeight + (parseFloat(getComputedStyle(cards[0]).marginBottom) || 0)) + 'px');
  };
  // what each card's sticky offset and height are (they only change on a real resize), so the scroll pass never has to ask
  const stuckAt = [], cardH = [];
  const measureCards = () => {
    cards.forEach((card, i) => { stuckAt[i] = parseFloat(getComputedStyle(card).top) || 0; cardH[i] = card.offsetHeight; });
  };
  if (svcHead && svcStack) {
    let sizedW = innerWidth, sizedH = innerHeight;
    const resized = () => {
      // phones fire "resize" as the address bar moves; only a real change in size needs the cards measuring again
      if (innerWidth === sizedW && Math.abs(innerHeight - sizedH) < 150) return;
      sizedW = innerWidth; sizedH = innerHeight;
      sizeHead(); measureCards();
    };
    sizeHead(); measureCards();
    addEventListener('resize', resized);
    addEventListener('load', () => { sizeHead(); measureCards(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sizeHead(); measureCards(); });
  }

  // --- The lid in the "Every Event Is Unique" band lifts as it scrolls through the middle -------------
  const serve = $('#serve');
  if (serve && reduced) serve.style.setProperty('--lift', '.7');

  // --- Scroll-linked updates (one rAF-throttled pass) -----------------------------------------
  const nav = $('.nav');
  const progress = $('#progress');
  const darkSections = $$('.marquee, .band, .testimonials');
  let lastScroll = scrollY, ticking = false;
  let lastP = -1, lastLift = -1, lastDark = null, lastProg = '', lastSolid = null;
  const lastScale = [];
  function update() {
    ticking = false;
    const vh = innerHeight, y = scrollY;

    // ---- reads (one layout) ----
    const max = document.documentElement.scrollHeight - vh;
    const probe = nav.offsetHeight / 2;
    const behind = darkSections.some((el) => { const r = el.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    const sr = words.length ? statement.getBoundingClientRect() : null;
    const lr = !reduced && serve ? serve.getBoundingClientRect() : null;
    const tops = !reduced && cards.length ? cards.map((card, i) => (cards[i + 1] ? cards[i + 1].getBoundingClientRect().top : 0)) : null;

    // ---- writes ----
    // progress line (the nav stays pinned to the top)
    const prog = `scaleX(${max > 0 ? clamp(y / max).toFixed(3) : 0})`;
    if (prog !== lastProg) { progress.style.transform = prog; lastProg = prog; }
    // flip the nav text to white while a dark section sits behind it
    if (behind !== lastDark) { nav.classList.toggle('nav--light', behind); lastDark = behind; }
    const solid = y > 24;
    if (solid !== lastSolid) { nav.classList.toggle('nav--solid', solid); lastSolid = solid; }
    lastScroll = y;

    if (reduced) return;

    // sentence lights up (skipped while it is fully dark or fully lit and nothing has changed)
    if (sr) {
      const p = clamp((vh * 0.82 - sr.top) / (sr.height + vh * 0.25));
      if (Math.abs(p - lastP) > 0.0005) {
        lastP = p;
        const n = words.length;
        words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(p * (n + 4) - i)).toFixed(2); });
      }
    }

    // lid lifts
    if (lr) {
      const lift = easeOut(clamp((vh - lr.top - lr.height * 0.25) / (vh * 0.75))).toFixed(3);
      if (lift !== lastLift) { serve.style.setProperty('--lift', lift); lastLift = lift; }
    }

    // stacked cards
    if (tops) {
      cards.forEach((card, i) => {
        if (!cards[i + 1]) return;
        const p = clamp(1 - (tops[i] - stuckAt[i]) / (cardH[i] * 0.9));
        const scale = (1 - 0.055 * p).toFixed(3);
        if (scale !== lastScale[i]) { card.style.transform = `scale(${scale})`; lastScale[i] = scale; }
      });
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();

  // --- Testimonial slider: one slide per frame, advancing slowly on its own -------------------------
  // Auto-advance pauses while the slider is hovered, focused, touched or dragged, while it is off screen and while the
  // tab is hidden, and it never runs with "reduce motion". The arrows, swiping and mouse-dragging always work.
  const sliderEl = $('#slider');
  const sliderTrack = $('#slider-track');
  const slides = $$('.slide', sliderTrack);
  const counter = $('#slider-n');
  const fill = $('#slider-progress');
  const AUTO_MS = 8000, GLIDE_MS = 1700;
  sliderEl.style.setProperty('--auto', `${AUTO_MS}ms`);

  const step = () => {
    const a = slides[0].getBoundingClientRect(), b = slides[1] ? slides[1].getBoundingClientRect() : a;
    return slides[1] ? b.left - a.left : a.width;
  };
  const indexNow = () => clamp(Math.round(sliderTrack.scrollLeft / step()), 0, slides.length - 1);
  const mark = () => { counter.textContent = String(indexNow() + 1).padStart(2, '0'); };
  sliderTrack.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
  addEventListener('resize', mark);
  mark();

  // A slow, eased glide to a slide (the browser's own smooth scroll is too quick for this).
  let glideRaf = 0;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  function glideTo(i, ms = GLIDE_MS) {
    cancelAnimationFrame(glideRaf);
    const to = clamp(i, 0, slides.length - 1) * step();
    if (reduced) { sliderTrack.scrollLeft = to; return; }
    const from = sliderTrack.scrollLeft, t0 = performance.now();
    sliderTrack.style.scrollSnapType = 'none';
    const tick = (now) => {
      const p = clamp((now - t0) / ms);
      sliderTrack.scrollLeft = from + (to - from) * easeInOut(p);
      mark();
      if (p < 1) glideRaf = requestAnimationFrame(tick);
      else sliderTrack.style.scrollSnapType = '';
    };
    glideRaf = requestAnimationFrame(tick);
  }
  const stopGlide = () => { cancelAnimationFrame(glideRaf); sliderTrack.style.scrollSnapType = ''; };

  // Next testimonial; after the last one, fade out and back in on the first instead of rewinding across them all.
  function advance() {
    const i = indexNow();
    if (i < slides.length - 1) return glideTo(i + 1);
    sliderTrack.classList.add('is-fading');
    setTimeout(() => {
      stopGlide();
      sliderTrack.style.scrollSnapType = 'none';
      sliderTrack.scrollLeft = 0;
      mark();
      requestAnimationFrame(() => { sliderTrack.style.scrollSnapType = ''; sliderTrack.classList.remove('is-fading'); });
    }, 600);
  }

  // Auto-advance
  let timer = 0, holds = 0, onScreen = false;
  const canRun = () => !reduced && holds === 0 && onScreen && !document.hidden;
  function restartFill() {
    fill.classList.remove('is-running');
    void fill.offsetWidth; // restart the CSS animation
    if (canRun()) fill.classList.add('is-running');
  }
  function arm() {
    clearTimeout(timer);
    restartFill();
    if (!canRun()) return;
    timer = setTimeout(() => { advance(); arm(); }, AUTO_MS);
  }
  const hold = () => { holds++; stopGlide(); arm(); };
  const release = () => { holds = Math.max(0, holds - 1); arm(); };
  sliderEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold(); });
  sliderEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') release(); });
  sliderEl.addEventListener('focusin', hold);
  sliderEl.addEventListener('focusout', release);
  let touchHold = 0;
  sliderTrack.addEventListener('touchstart', () => { stopGlide(); clearTimeout(touchHold); if (!sliderEl.dataset.touch) { sliderEl.dataset.touch = '1'; hold(); } }, { passive: true });
  sliderTrack.addEventListener('touchend', () => { touchHold = setTimeout(() => { delete sliderEl.dataset.touch; release(); }, 6000); }, { passive: true });
  document.addEventListener('visibilitychange', arm);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; arm(); }, { threshold: 0.35 }).observe(sliderEl);
  }

  // Arrows (these also restart the timer so the next slide isn't due a moment later)
  $('#slider-prev').addEventListener('click', () => { glideTo(indexNow() - 1, 900); arm(); });
  $('#slider-next').addEventListener('click', () => { glideTo(indexNow() + 1, 900); arm(); });

  // Click-and-drag with a mouse (touch and trackpads already scroll it natively).
  let drag = null;
  sliderTrack.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    stopGlide();
    drag = { x: e.clientX, left: sliderTrack.scrollLeft };
    sliderTrack.style.scrollSnapType = 'none';
    sliderTrack.style.cursor = 'grabbing';
  });
  addEventListener('pointermove', (e) => {
    if (drag) sliderTrack.scrollLeft = drag.left - (e.clientX - drag.x);
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    sliderTrack.style.cursor = '';
    glideTo(indexNow(), 600);
  });
})();

// Magnetic buttons: while hovered, a button is drawn toward the cursor, eased frame by frame (so it glides rather than
// snaps), then settles back on leave. Fine pointers only (no touch), and never with "reduce motion".
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const PULL = 0.4, MAX = 16, EASE = 0.14; // fraction of the cursor offset, cap in px, share of the gap closed per frame
  document.querySelectorAll('.btn').forEach((btn) => {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      const done = Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05;
      if (done) { x = tx; y = ty; }
      btn.style.setProperty('--mx', x.toFixed(2) + 'px');
      btn.style.setProperty('--my', y.toFixed(2) + 'px');
      raf = done ? 0 : requestAnimationFrame(tick);
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      tx = Math.max(-MAX, Math.min(MAX, (e.clientX - (r.left + r.width / 2)) * PULL));
      ty = Math.max(-MAX, Math.min(MAX, (e.clientY - (r.top + r.height / 2)) * PULL));
      go();
    });
    btn.addEventListener('pointerleave', () => { tx = ty = 0; go(); });
  });
})();
