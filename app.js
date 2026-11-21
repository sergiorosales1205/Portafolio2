document.documentElement.classList.add('js');
document.querySelector('.menu').hidden = false;

const services = document.querySelector('#servicios');
const image = services.querySelector('.services-image');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;

function moveBackground() {
  frame = 0;
  if (motion.matches) return;
  const rect = services.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight) return;
  const progress = (innerHeight - rect.top) / (innerHeight + rect.height);
  const travel = Math.min(180, rect.height * 0.3);
  image.style.setProperty('--desplazamiento', ((progress - 0.5) * 2 * travel) + 'px');
}

function scheduleBackground() {
  if (!frame && !motion.matches) frame = requestAnimationFrame(moveBackground);
}

addEventListener('scroll', scheduleBackground, { passive: true });
addEventListener('resize', scheduleBackground);
motion.addEventListener('change', scheduleBackground);
scheduleBackground();

const social = document.querySelector('.social');
const socialStatus = social.querySelector('.social-status');
const publicPage = ['https:', 'http:'].includes(location.protocol)
  && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
social.hidden = false;

if (publicPage) {
  const url = encodeURIComponent(location.origin + location.pathname);
  const shares = {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
    whatsapp: 'https://wa.me/?text=' + url,
    x: 'https://twitter.com/intent/tweet?url=' + url,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url
  };
  social.querySelectorAll('[data-red]').forEach((button) => {
    button.addEventListener('click', () => window.open(shares[button.dataset.red], '_blank', 'noopener,noreferrer'));
  });
} else {
  social.addEventListener('click', (event) => {
    if (event.target.closest('[data-red]')) {
      socialStatus.textContent = 'Abre el portafolio publicado para compartirlo.';
    }
  });
  social.addEventListener('focusout', (event) => {
    if (!social.contains(event.relatedTarget)) socialStatus.textContent = '';
  });
}

const menu = document.querySelector('.menu');
const nav = document.querySelector('#navegacion');

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
}

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || menu.getAttribute('aria-expanded') !== 'true') return;
  setMenu(false);
  const section = document.querySelector(link.hash);
  section.setAttribute('tabindex', '-1');
  section.focus({ preventScroll: true });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});

const form = document.querySelector('#formulario');
const status = document.querySelector('#estado');
const submit = form.querySelector('[type="submit"]');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = 'Enviando mensaje…';
  status.dataset.error = 'false';

  try {
    if (!['http:', 'https:'].includes(location.protocol)) {
      throw new Error('Abre el sitio desde un servidor con PHP y MySQL para enviar el mensaje.');
    }
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('El servidor no ejecutó el formulario. Comprueba que PHP esté habilitado.');
    }
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.mensaje);
    form.reset();
    status.textContent = result.mensaje;
  } catch (error) {
    status.dataset.error = 'true';
    status.textContent = error instanceof TypeError
      ? 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.'
      : error.message;
  } finally {
    submit.disabled = false;
  }
});
