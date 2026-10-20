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
    const fill = () => {
      while (track.children.length > 1) track.lastChild.remove();
      const need = innerWidth * 2 + set.offsetWidth;
      for (let n = 1; set.offsetWidth * n < need; n++) {
        const clone = set.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.append(clone);
      }
    };
    fill();
    addEventListener('resize', fill);
    let x = 0, dir = -1, lastY = scrollY, vel = 0;
    const drift = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      vel += (Math.abs(dy) - vel) * 0.12;
      if (dy > 0) dir = -1; else if (dy < 0) dir = 1;
      x += dir * (0.6 + vel * 0.55);
      const w = set.offsetWidth;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (marqueeVisible) requestAnimationFrame(drift);
    };
    new IntersectionObserver(([e]) => {
      const was = marqueeVisible;
      marqueeVisible = e.isIntersecting;
      if (marqueeVisible && !was) requestAnimationFrame(drift);
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
      const open = !item.classList.contains('is-open');
      items.forEach((other) => {
        const isThis = other === item;
        other.classList.toggle('is-open', isThis && open);
        $('.acc__btn', other).setAttribute('aria-expanded', String(isThis && open));
      });
    });
  });

  // The plate follows the lower border: --drop is the panel's height, updated every frame while it opens or closes
  // (a ResizeObserver fires after layout and before paint, so the two stay in step, opening and closing alike).
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const lid = $('.cloche', e.target.closest('.acc__item'));
      lid.style.setProperty('--drop', e.target.getBoundingClientRect().height.toFixed(2) + 'px');
    });
  });
  $$('.acc__panel').forEach((panel) => ro.observe(panel));

  // --- Service cards: each one tucks back a little as the next slides over it -------------------
  const cards = $$('.scard');

  // --- The lid in the "Every Event Is Unique" band lifts as it scrolls through the middle -------------
  const serve = $('#serve');
  if (serve && reduced) serve.style.setProperty('--lift', '.7');

  // --- Scroll-linked updates (one rAF-throttled pass) -----------------------------------------
  const nav = $('.nav');
  const progress = $('#progress');
  let lastScroll = scrollY, ticking = false;
  function update() {
    ticking = false;
    const vh = innerHeight, y = scrollY;

    // progress line + nav (slides away while scrolling down, returns on the way up)
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max).toFixed(4) : 0})`;
    if (y < 120 || y < lastScroll - 2) nav.classList.remove('nav--hidden');
    else if (y > lastScroll + 2 && y > 240) nav.classList.add('nav--hidden');
    lastScroll = y;

    if (reduced) return;

    // sentence lights up
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
      const n = words.length;
      words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(p * (n + 4) - i)).toFixed(3); });
    }

    // lid lifts
    if (serve) {
      const r = serve.getBoundingClientRect();
      const p = clamp((vh - r.top - r.height * 0.25) / (vh * 0.75));
      serve.style.setProperty('--lift', easeOut(p).toFixed(3));
    }

    // stacked cards
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const stuckAt = parseFloat(getComputedStyle(card).top) || 0;
      const p = clamp(1 - (next.getBoundingClientRect().top - stuckAt) / (card.offsetHeight * 0.9));
      card.style.transform = `scale(${(1 - 0.055 * p).toFixed(4)})`;
    });
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
