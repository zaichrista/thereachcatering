// Contact + newsletter forms, submitted to Wix Forms through the shipped form store (js/wix/).
// The page keeps its own markup; each page control is matched to a schema field by control kind, so the owner
// can rename or reorder fields in the Wix dashboard without a code change here.
import { createFormStore, FORM_ERROR } from './wix/form-store.js';

const CONTACT_FORM_ID = 'ea11eeba-67bc-4ac0-9775-524d15f1138d';
const NEWSLETTER_FORM_ID = '13812d54-ff20-4b22-a148-cdf7d1400c7c';

// Page control name -> how to find its schema field.
const CONTACT_MAP = { name: 'text', phone: 'phone', email: 'email', message: 'textarea' };
const NEWSLETTER_MAP = { email: 'email', optin: 'checkbox' };

function wire({ formEl, statusEl, formId, map, honeypot, okMessage }) {
  if (!formEl) return;
  const store = createFormStore({ formId });
  store.start();

  const setStatus = (message, kind) => {
    statusEl.textContent = message;
    statusEl.className = 'form__status' + (kind ? ` is-${kind}` : '');
  };
  const clearErrors = () => {
    formEl.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
    formEl.querySelectorAll('.field__error').forEach((n) => n.remove());
  };
  const showFieldError = (pageName, message) => {
    const field = formEl.elements[pageName] && formEl.elements[pageName].closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    const err = document.createElement('span');
    err.className = 'field__error';
    err.textContent = message;
    field.append(err);
  };
  const waitForSchema = () => new Promise((resolve) => {
    if (!store.getState().loading) return resolve();
    const off = store.subscribe(() => { if (!store.getState().loading) { off(); resolve(); } });
  });

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    setStatus('');
    // Honeypot: bots fill it, humans never see it. Pretend success and send nothing.
    if (honeypot && formEl.elements[honeypot] && formEl.elements[honeypot].value) {
      formEl.reset();
      return setStatus(okMessage, 'ok');
    }
    const button = formEl.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('Sending…');
    try {
      await waitForSchema();
      const { form } = store.getState();
      if (!form) return setStatus('Sorry, this form is unavailable right now. Please try again later.', 'error');

      const pageByTarget = {};
      for (const [pageName, control] of Object.entries(map)) {
        const field = form.fields.find((f) => f.control === control && !pageByTarget[f.target]);
        const input = formEl.elements[pageName];
        if (!field || !input) continue;
        pageByTarget[field.target] = pageName;
        store.setValue(field.target, input.type === 'checkbox' ? input.checked : input.value.trim());
      }

      const outcome = await store.submit({ currentTarget: formEl, preventDefault() {} });
      if (outcome) {
        formEl.reset();
        store.reset();
        return setStatus((outcome.message || okMessage).split('\n')[0], 'ok');
      }
      const errors = store.getState().errors;
      let shown = 0;
      for (const [key, message] of Object.entries(errors)) {
        const pageName = pageByTarget[key.split('/')[0]];
        if (pageName) { showFieldError(pageName, message); shown++; }
      }
      setStatus(errors[FORM_ERROR] || (shown ? 'Please check the highlighted fields.' : 'Something went wrong. Please try again.'), 'error');
    } catch (err) {
      setStatus((err && err.message) || 'Something went wrong. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}

wire({
  formEl: document.getElementById('contact-form'),
  statusEl: document.getElementById('form-status'),
  formId: CONTACT_FORM_ID,
  map: CONTACT_MAP,
  honeypot: 'website',
  okMessage: 'Thank you! We have your message and will be in touch soon.',
});

wire({
  formEl: document.getElementById('newsletter-form'),
  statusEl: document.getElementById('news-status'),
  formId: NEWSLETTER_FORM_ID,
  map: NEWSLETTER_MAP,
  okMessage: 'Thank you for subscribing!',
});
