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

  onScroll();
})();

// Clicking the REACH wordmark returns to the hero at the very top of the page.
document.querySelector('.nav__brand')?.addEventListener('click', (e) => {
  if (!e.currentTarget.getAttribute('href').startsWith('#')) return; // on other pages the wordmark is an ordinary link home
  e.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
});

// A button that carries data-event (the service cards) pre-selects that event type in the enquiry form, and one that carries
// data-menu (a menu's "Enquire for pricing") records which menu the enquiry is about. From the menus page the menu arrives as ?menu=.
const enquiry = (name) => document.querySelector(`#contact-form [name="${name}"]`);
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-event], [data-menu]');
  if (!a) return;
  if (a.dataset.event && enquiry('event')) enquiry('event').value = a.dataset.event;
  if (enquiry('menu')) enquiry('menu').value = a.dataset.menu || '';
});
const menuParam = new URLSearchParams(location.search).get('menu');
if (menuParam && enquiry('menu')) enquiry('menu').value = menuParam;
