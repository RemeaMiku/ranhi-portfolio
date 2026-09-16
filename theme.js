(() => {
  const key = 'ranhi-theme';
  const saved = localStorage.getItem(key) || 'auto';
  document.documentElement.dataset.theme = saved;

  const labels = { auto: 'AUTO', dark: 'DARK', light: 'LIGHT' };
  const order = ['auto', 'dark', 'light'];

  function updateButton(theme) {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.textContent = `THEME / ${labels[theme]}`;
    button.setAttribute('aria-label', `Colour theme: ${labels[theme]}. Activate to change.`);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header--overlay');
    if (header) {
      const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
      updateHeader();
      window.addEventListener('scroll', updateHeader, { passive: true });
      window.addEventListener('pageshow', updateHeader);
    }
    let theme = document.documentElement.dataset.theme || 'auto';
    updateButton(theme);
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      theme = order[(order.indexOf(theme) + 1) % order.length];
      document.documentElement.dataset.theme = theme;
      localStorage.setItem(key, theme);
      updateButton(theme);
    });
  });
})();
