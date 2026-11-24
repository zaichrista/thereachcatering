// Sizes [data-fit] text so that its single line spans exactly the width of its parent, edge to edge.
// Measures at a known size, then scales; runs again when the window resizes and once the web font has loaded.
(() => {
  const els = [...document.querySelectorAll('[data-fit]')];
  if (!els.length) return;
  function fit() {
    els.forEach((el) => {
      const box = el.parentElement;
      const cs = getComputedStyle(box.parentElement);
      const avail = box.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      box.style.fontSize = '100px';
      const w = el.getBoundingClientRect().width;
      if (w > 0 && avail > 0) box.style.fontSize = (100 * avail / w).toFixed(2) + 'px';
    });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  addEventListener('resize', fit);
  addEventListener('load', fit);
})();

// Closing line is fixed to the bottom of the window, behind the page; the footer scrolls up off it to reveal it.
(() => {
  const sec = document.querySelector('.closing');
  const foot = document.querySelector('.footer');
  if (!sec || !foot) return;
  function size() { document.documentElement.style.setProperty('--closing-h', sec.offsetHeight + 'px'); update(); }
  function update() { sec.classList.toggle('is-on', foot.getBoundingClientRect().bottom - 2 < innerHeight); } // only once the footer's bottom edge is on screen
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', size);
  addEventListener('load', size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
  size();
})();
