// "Customer certified" badge. The ring of text turns slowly on its own (CSS). The gold star spins while the page scrolls
// (faster the faster you scroll) and while the badge is hovered or focused, then eases to a stop.
(() => {
  const badge = document.querySelector('.badge');
  const star = badge && badge.querySelector('.badge__star');
  if (!star || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let rot = 0, vel = 0, hover = false, lastY = scrollY, raf = 0, onScreen = false;
  const frame = () => {
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    const targetVel = hover ? 9 : Math.min(dy * 0.7, 24); // degrees per frame
    vel += (targetVel - vel) * 0.12;
    rot = (rot + vel) % 360;
    star.style.transform = `rotate(${rot.toFixed(2)}deg)`;
    raf = (onScreen && (hover || vel > 0.05 || dy > 0)) ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => { if (!raf && onScreen) raf = requestAnimationFrame(frame); };
  badge.addEventListener('pointerenter', () => { hover = true; wake(); });
  badge.addEventListener('pointerleave', () => { hover = false; wake(); });
  badge.addEventListener('focus', () => { hover = true; wake(); });
  badge.addEventListener('blur', () => { hover = false; wake(); });
  addEventListener('scroll', wake, { passive: true });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) { lastY = scrollY; wake(); } }).observe(badge);
})();
