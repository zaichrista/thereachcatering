// "From our table to yours": the strip under the hero (after gourouindianfood.fr's "From India to Paris").
// A strip twice the window's width holds two panels. As the strip scrolls into view the panels slide right, so
// "FROM OUR TABLE" is carried out of view and "TO YOURS" arrives, eased in (power3.in) and smoothed so it trails the scroll.
// The cloche on each panel sits still until the page scrolls (either way); then its lid rattles and hops off the plate a little,
// settling back when scrolling stops. All of it runs in one requestAnimationFrame loop, only while the strip is on screen.
(() => {
  const sec = document.querySelector('.fromto');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS shows both lines stacked instead
  const panels = [...sec.querySelectorAll('.fromto__panel')];
  const cloches = [...sec.querySelectorAll('.fromto .cloche')];
  const clamp = (x) => Math.min(1, Math.max(0, x));
  let cur = 0, vel = 0, k = 0, lastY = scrollY, on = false, raf = 0;

  function frame(now) {
    const vh = innerHeight, vw = document.documentElement.clientWidth;
    // Scrub: 0 when the strip's top is at 95% of the window, 1 when it has risen to 20% (like the original's start / end).
    const target = clamp((vh * 0.95 - sec.getBoundingClientRect().top) / (vh * 0.75));
    cur += (target - cur) * 0.09;
    const x = -(1 - cur ** 3) * vw;
    // The whole page fades to the deep red of the "Every Event" band as the words change.
    document.documentElement.style.setProperty('--f', cur.toFixed(3));
    // The strip itself stays hero-yellow, so the nav keeps its dark text (no is-red).
    panels.forEach((p) => { p.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`; });

    // Scroll speed (either direction) drives the rattle: smoothed so it builds quickly and settles when scrolling stops.
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    vel += (dy - vel) * 0.2;
    k += (clamp(vel / 30) - k) * 0.25;
    const lift = k * (0.16 + 0.1 * Math.sin(now / 35));        // the lid hops off the plate, only slightly
    const jx = Math.sin(now / 27) * 2.5 * k, rot = Math.sin(now / 32) * 3 * k; // and rocks side to side
    cloches.forEach((c) => {
      c.style.setProperty('--lift', Math.max(0, lift).toFixed(3));
      c.style.setProperty('--jx', jx.toFixed(2) + 'px');
      c.style.setProperty('--rot', rot.toFixed(2) + 'deg');
    });
    raf = on ? requestAnimationFrame(frame) : 0;
  }
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    if (on && !raf) { lastY = scrollY; raf = requestAnimationFrame(frame); }
  }, { rootMargin: '100px 0px' }).observe(sec);
})();
