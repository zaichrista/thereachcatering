// Expanding image section. Inside it: the pinned frame (position: sticky), a run of scroll distance, the enquiry form (also sticky) and a half-screen tail.
// t = screens scrolled since the section's top rose to 60% of the window height (so the strip is still visible at the top
// while the image sits small in the middle). The timeline, in screens:
//   0 → 1        the image grows from a small centred frame to fill the window; the "To yours" strip stays stuck to the top as its header
//   1 → 1.45     the header slides up out of the window, under the photo (so it is not there for the shrink)
//   1.2 → 4.15   two content panels fade in and out in turn over the photo (first on the left, then on the right), on a scrim that keeps the words legible
//   4.2 → 5.4    the photo shrinks back (a long, soft ease), uncovering "Planning your / next event?" which rides on the frame's edges
//   5.4 → 5.9    the frame rests, small and still, exactly as at the start: half a scroll of pause
//   5.9          TRIGGER. From here the finale is on a clock, not on the scroll: in ~0.8 s the little frame bounces slightly more open and then
//                closes completely, and the two halves of the question, fastened to its edges, squish with it. Scroll back above 5.9 and the frame
//                reopens on the same clock but WITHOUT the bounce (the bounce belongs to closing only).
//   6.0 →        the form (pulled up under this section) rises into view directly beneath the squished question, then holds for the tail.
// Everything scroll-driven is a function of t alone, so scrolling back up plays it in reverse. t is damped (it chases the scroll position a
// little behind it), which is what makes the movement glide.
(() => {
  const sec = document.querySelector('.xstage');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const header = document.querySelector('.fromto');
  const panels = [...sec.querySelectorAll('.xpanel')];
  const contact = sec.querySelector('.contact');
  const qTop = sec.querySelector('.xq--top');

  // Layout the scroll scene depends on, measured in pixels: (1) the form's sticky `top`, chosen so its bottom edge meets the bottom of the window
  // (then the form and the pinned question let go at the very same moment, after the half-screen tail); (2) where the question's centre line
  // ends up: as high as it can go, just under the nav.
  function measure() {
    const vh = innerHeight;
    if (!qTop || !contact) return;
    const gap = Math.min(19.2, Math.max(8, 0.014 * innerWidth));         // = var(--xq-gap): clamp(.5rem, 1.4vw, 1.2rem)
    const half = gap + qTop.offsetHeight;                                  // one half of the question plus its gap
    const cyend = 72 + half;                                               // centre line of the question: just under the nav (~72px)
    const top = cyend + half + 8;                                          // the form (starting with its subtitle) sits directly under the question
    const fill = Math.max(0, vh - top).toFixed(1) + 'px';                  // the form's section runs from under the question to the bottom of the window
    if (contact.style.minHeight !== fill) contact.style.minHeight = fill;
    const d = Math.max(0, vh - (top + contact.offsetHeight));              // any room left under it (none, unless the form is taller than the space)
    sec.style.setProperty('--cyend', cyend.toFixed(1) + 'px');
    sec.style.setProperty('--d', d.toFixed(1) + 'px');                     // lets the pin release exactly when the form does (see .xstage__scene)
    contact.style.top = top.toFixed(1) + 'px';
  }
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); }; // smootherstep
  const outBack = (u) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };       // eases out with an overshoot
  // [fade in from, fully in, start fading out, fully out]
  const WINDOWS = [[1.2, 1.55, 2.4, 2.7], [2.7, 3.0, 4.0, 4.2]];
  const TRIGGER = 5.9;   // screens: where the timed finale starts (the frame rests, small and still, from 5.4 until here: half a scroll)
  const DURATION = 0.8;  // seconds for the whole finale (open, then close)
  const OPEN = 0.14;     // how far past its resting size the frame opens, as a fraction of the way to full-window

  let target = 0, cur = null, seq = 0, seqTarget = 0, raf = 0, last = '', lastTime = 0;
  let bounce = 0; // 1 while the frame is closing (the bounce is played), 0 while it is reopening (it opens plainly, with no bounce)
  const readTarget = () => { const vh = innerHeight; return (vh * 0.6 - sec.getBoundingClientRect().top) / vh; };

  function render(t, s) {
    // g: how far the frame has opened towards full-window (0 = the small resting frame). c: how far it has closed to nothing.
    let g = t < 4.2 ? smooth(0, 1, t) : t < 5.4 ? smooth(0, 1, (5.4 - t) / 1.2) : 0;
    g += bounce * OPEN * outBack(clamp(s / 0.3)) * (1 - smooth(0.3, 0.62, s)); // the timed bounce (closing only): open a little more, then back
    const c = smooth(0.3, 1, s);                                     // and shut completely
    const h = 32 * (1 - c) + 68 * g, w = 38 * (1 - c) + 62 * g;      // the frame's size, % of the window
    const itb = (100 - h) / 2, ilr = (100 - w) / 2;
    const rad = 2 * Math.max(0, 1 - g);
    const scl = smooth(1, 1.4, t) * (1 - smooth(2.6, 3.1, t));       // scrim behind the left panel
    const scr = smooth(2.2, 2.7, t) * (1 - smooth(4.1, 4.45, t));    // scrim behind the right panel
    const hd = smooth(1, 1.45, t);                                   // header slides away
    // "Planning your / next event?" must never be seen while the photo grows: it is switched on only once the photo covers the whole window
    // (so it flips on out of sight). From then on it is fastened to the frame's edges (CSS, using --h) and shows as the frame shrinks.
    const q = t > 1.02 ? 1 : 0;
    const up = smooth(6.1, 6.7, t);                                 // the question travels up to the top as the form rises beneath it
    const key = [g, c, scl, scr, hd, q, up].map((v) => v.toFixed(4)).join();
    if (key === last) return;
    last = key;
    const set = (k, v) => sec.style.setProperty(k, v);
    set('--g', g.toFixed(4));
    set('--h', h.toFixed(3));
    set('--itb', itb.toFixed(3) + '%');
    set('--ilr', ilr.toFixed(3) + '%');
    set('--rad', rad.toFixed(3) + 'rem');
    set('--s', (1.25 - 0.25 * Math.min(1, g)).toFixed(4));
    set('--scl', scl.toFixed(4));
    set('--scr', scr.toFixed(4));
    set('--q', q);
    set('--up', up.toFixed(4));
    if (header) {
      header.style.transform = hd > 0 ? `translate3d(0,${(-hd * 101).toFixed(2)}%,0)` : '';
      header.style.pointerEvents = hd > 0.5 ? 'none' : '';
    }
    panels.forEach((p, i) => {
      const win = WINDOWS[i] || WINDOWS[WINDOWS.length - 1];
      const o = smooth(win[0], win[1], t) * (1 - smooth(win[2], win[3], t));
      p.style.setProperty('--o', o.toFixed(4));
      p.classList.toggle('is-on', o > 0.02);
    });
  }
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
    cur += (target - cur) * 0.12;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    // The finale runs at a fixed speed whatever the scroll speed (its target flips when t crosses TRIGGER, in either direction).
    const step = dt / DURATION;
    seq = seq < seqTarget ? Math.min(seqTarget, seq + step) : Math.max(seqTarget, seq - step);
    // The bounce belongs to closing only: fade it in when heading to closed, out (quickly) when reopening, so the frame never springs on the way back.
    const bTarget = seqTarget === 1 ? 1 : 0;
    bounce += (bTarget - bounce) * Math.min(1, dt * 14);
    if (Math.abs(bTarget - bounce) < 0.002) bounce = bTarget;
    render(cur, seq);
    raf = (cur === target && seq === seqTarget && bounce === bTarget) ? 0 : requestAnimationFrame(frame);
  }
  function onScroll() {
    target = readTarget();
    seqTarget = target >= TRIGGER ? 1 : 0;
    if (cur === null) { cur = target; seq = seqTarget; bounce = seqTarget; } // first read: no glide from nothing
    if (!raf) { lastTime = performance.now(); raf = requestAnimationFrame(frame); }
  }
  // "Request a proposal" JUMPS to the form (no scrolling through the whole sequence): the page is moved instantly to the end of the timeline, and the
  // animation state is set straight to what it would be there, with no glide and no finale clock to wait for.
  const JUMP_T = 7;      // screens: far enough that the question has travelled to the top and the form is fully risen
  function snap() {
    target = readTarget();
    seqTarget = target >= TRIGGER ? 1 : 0;
    cur = target; seq = seqTarget; bounce = seqTarget; last = '';
    render(cur, seq);
  }
  function jumpToContact() {
    const vh = innerHeight;
    const secTop = sec.getBoundingClientRect().top + scrollY;
    const y = Math.round(secTop + (JUMP_T - 0.6) * vh);
    const root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';            // the page's CSS smooth-scroll would otherwise animate this
    scrollTo(0, y);
    root.style.scrollBehavior = prev;
    snap();
    history.replaceState(null, '', location.pathname + location.search + '#contact');
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const u = new URL(a.href, location.href);
    if (u.hash !== '#contact' || u.pathname !== location.pathname) return;
    e.preventDefault();
    jumpToContact();
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); onScroll(); });
  if ('ResizeObserver' in window && contact) new ResizeObserver(() => { measure(); onScroll(); }).observe(contact); // e.g. an error message appears under the form
  measure();
  onScroll();
  // Arriving from another page (or a link) with #contact in the address: land on the form straight away.
  if (location.hash === '#contact') {
    const go = () => { measure(); jumpToContact(); };
    go();
    addEventListener('load', go, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  }
})();
