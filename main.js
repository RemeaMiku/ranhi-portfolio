document.querySelectorAll('[data-variant-switcher]').forEach((switcher) => {
  const image = document.getElementById(switcher.dataset.variantSwitcher);
  const buttons = switcher.querySelectorAll('button');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.image === image.getAttribute('src')) return;
      image.classList.add('is-changing');
      window.setTimeout(() => {
        image.setAttribute('src', button.dataset.image);
        image.setAttribute('alt', button.dataset.alt);
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        image.classList.remove('is-changing');
      }, 110);
    });
  });
});
