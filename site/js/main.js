// Page behaviour: the contact form (POST /api/contact), a placeholder newsletter form, and how far the footer has
// scrolled into view (--footer-p) for the cloche choreography.
(() => {
  const API = (document.querySelector('meta[name="reach-api"]') || {}).content || '/api';

  // Small DOM helper for building elements without innerHTML.
  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    node.append(...kids.flat().filter((x) => x != null && x !== false));
    return node;
  };

  async function post(path, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(API + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { details: data.details });
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Contact form -------------------------------------------------------------------
  // The API's contact endpoint takes name, email and message, so the phone number travels at the top of the message.
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  const clearErrors = () => {
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
    form.querySelectorAll('.field__error').forEach((n) => n.remove());
  };
  const showFieldError = (name, message) => {
    const field = form.elements[name] && form.elements[name].closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    field.append(el('span', { class: 'field__error', text: message }));
  };
  const setStatus = (message, kind) => {
    status.textContent = message;
    status.className = 'form__status' + (kind ? ` is-${kind}` : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    setStatus('');
    const data = Object.fromEntries(new FormData(form));
    const missing = ['name', 'phone', 'email'].filter((k) => !String(data[k] || '').trim());
    if (missing.length) {
      missing.forEach((k) => showFieldError(k, 'Required'));
      return setStatus('Please fill in the highlighted fields.', 'error');
    }
    const note = String(data.message || '').trim();
    const body = {
      name: data.name.trim(),
      email: data.email.trim(),
      subject: 'Website contact form',
      message: `Phone: ${data.phone.trim()}${note ? `\n\n${note}` : ''}`,
      website: data.website || '',
    };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('Sending…');
    try {
      await post('/contact', body);
      form.reset();
      setStatus('Thank you! We have your message and will be in touch soon.', 'ok');
    } catch (err) {
      (err.details || []).forEach((d) => showFieldError(d.field, d.message));
      setStatus(err.details && err.details.length ? 'Please check the highlighted fields.' : err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  // --- Newsletter (placeholder) ---------------------------------------------------------
  // TODO: not connected yet. The API has no newsletter endpoint, so nothing is sent anywhere.
  const news = document.getElementById('newsletter-form');
  const newsStatus = document.getElementById('news-status');
  news.addEventListener('submit', (e) => {
    e.preventDefault();
    newsStatus.textContent = 'Newsletter sign-up is not connected yet.';
  });

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

// Clicking the REACH wordmark returns to the hero at the very top of the page.
document.querySelector('.nav__brand')?.addEventListener('click', (e) => {
  e.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
});
