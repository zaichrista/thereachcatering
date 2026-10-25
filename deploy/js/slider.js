// Testimonial slider: one slide per frame, advancing slowly on its own (home page only).
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
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
