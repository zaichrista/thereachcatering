// Scroll and interaction motion for everything below the hero:
//   headings whose words rise into place · blocks that fade up
//   · a year that counts up · a sentence that lights up word by word · menus that open as the cloche lid lifts
//   · a lid that lifts as the band scrolls through
//   · a nav that slides away on the way down and back on the way up, plus a scroll progress line.
// With "reduce motion" switched on, nothing moves: everything simply appears.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const easeOut = (x) => 1 - (1 - x) ** 3;

  // The words of an element, each flagged if it sat inside a <b> / <strong> (that is how a heading marks its heavy words).
  function wordsOf(el) {
    const out = [];
    const walk = (node, bold) => node.childNodes.forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach((text) => out.push({ text, bold }));
      else if (n.nodeType === 1) walk(n, bold || /^(B|STRONG)$/.test(n.tagName));
    });
    walk(el, false);
    return out;
  }

  // --- Headings: wrap each word so it can rise into place -------------------------------
  $$('[data-split]').forEach((h) => {
    const list = wordsOf(h);
    h.setAttribute('aria-label', list.map((w) => w.text).join(' '));
    h.textContent = '';
    list.forEach(({ text, bold }, i) => {
      const w = document.createElement('span');
      w.className = bold ? 'w w--b' : 'w';
      w.setAttribute('aria-hidden', 'true');
      w.style.setProperty('--wi', i);
      const inner = document.createElement('span');
      inner.textContent = text;
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

  // --- The lid in the "Every Event Is Unique" band lifts as it scrolls through the middle -------------
  const serve = $('#serve');
  if (serve && reduced) serve.style.setProperty('--lift', '.7');

  // --- Scroll-linked updates (one rAF-throttled pass) -----------------------------------------
  const nav = $('.nav');
  const progress = $('#progress');
  const darkSections = $$('.band, .testimonials, .landing, .footer');
  const accentSection = $('.testimonials');
  const heroSection = $('.hero');
  let lastScroll = scrollY, ticking = false;
  let lastLift = -1, lastDark = null, lastProg = '', lastSolid = null;
  function update() {
    ticking = false;
    const vh = innerHeight, y = scrollY;

    // ---- reads (one layout) ----
    const max = document.documentElement.scrollHeight - vh;
    const probe = nav.offsetHeight / 2;
    const behind = darkSections.some((el) => { const r = el.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    const onAccent = !!accentSection && (() => { const r = accentSection.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; })();
    const pastHero = !heroSection || heroSection.getBoundingClientRect().bottom <= nav.offsetHeight;
    const lr = !reduced && serve ? serve.getBoundingClientRect() : null;

    // ---- writes ----
    // progress line (the nav stays pinned to the top)
    const prog = `scaleX(${max > 0 ? clamp(y / max).toFixed(3) : 0})`;
    if (prog !== lastProg) { progress.style.transform = prog; lastProg = prog; }
    // flip the nav text to white while a dark section sits behind it
    if (behind !== lastDark) { nav.classList.toggle('nav--light', behind); lastDark = behind; }
    nav.classList.toggle('nav--accent', onAccent);
    nav.classList.toggle('nav--past-hero', pastHero); // the frost only starts once the hero has scrolled away
    const solid = y > 24;
    if (solid !== lastSolid) { nav.classList.toggle('nav--solid', solid); lastSolid = solid; }
    lastScroll = y;

    if (reduced) return;

    // lid lifts
    if (lr) {
      const lift = easeOut(clamp((vh - lr.top - lr.height * 0.25) / (vh * 0.75))).toFixed(3);
      if (lift !== lastLift) { serve.style.setProperty('--lift', lift); lastLift = lift; }
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
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
