// Page behaviour: how far the footer has scrolled into view (--footer-p) for the cloche choreography.
// The contact and newsletter forms live in forms.js (submitted to Wix Forms).
(() => {
  // --- Scroll: how far the footer has come into view ----------------------------------------
  // 0 = footer not yet on screen, 1 = scrolled to the end. Exposed as --footer-p for the cloche choreography;
  // that can also listen for the "reach:scroll" event.
  const footer = document.getElementById('footer');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const top = footer.getBoundingClientRect().top + scrollY;
    const p = Math.min(1, Math.max(0, (scrollY + innerHeight - top) / (footer.offsetHeight * 0.85)));
    document.documentElement.style.setProperty('--footer-p', p.toFixed(3));
    dispatchEvent(new CustomEvent('reach:scroll', { detail: { footerProgress: p, scrollY } }));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  document.getElementById('year').textContent = new Date().getFullYear();
  onScroll();
})();
