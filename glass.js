/* Destaca o atalho ativo no menu conforme a rolagem. */
(() => {
  const links = [...document.querySelectorAll('.side-nav .nav-link')];
  const ids = ['inicio', 'estudar', 'tutora', 'revisao', 'agenda', 'criar', 'materiais'];
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const setActive = id => links.forEach(a => {
    const match = a.getAttribute('href') === '#' + id;
    if (match || a.classList.contains('active')) a.classList.toggle('active', match);
  });
  const io = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .25, .5, 1] });
  sections.forEach(s => io.observe(s));
})();
