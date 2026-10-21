/* Motion is progressive enhancement only: content remains readable without JS. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reveals = Array.from(document.querySelectorAll(
    '.section-head, .project, .about-grid > div, .facts > div, .skills > div, .qualifications > div, .contact .wrap'
  ));
  let revealObserver = null;
  function initializeReveals() {
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    reveals.forEach((element) => {
      element.classList.remove('is-visible');
      element.removeAttribute('data-reveal');
    });
    document.documentElement.classList.remove('motion-ready');
    if (reduced.matches || !('IntersectionObserver' in window)) { return; }
    // Mark only elements currently below the initial viewport, so already visible content never flashes away.
    const viewportHeight = window.innerHeight;
    reveals.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight * .94) { return; }
      element.setAttribute('data-reveal', '');
      element.style.setProperty('--reveal-delay', String((index % 3) * 65) + 'ms');
    });
    document.documentElement.classList.add('motion-ready');
    revealObserver = new IntersectionObserver((items, observer) => {
      items.forEach((item) => {
        if (item.isIntersecting) {
          item.target.classList.add('is-visible');
          observer.unobserve(item.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .07 });
    reveals.filter((e) => e.hasAttribute('data-reveal')).forEach((element) => revealObserver.observe(element));
  }
  initializeReveals();
  reduced.addEventListener?.('change', initializeReveals);

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  let ticking = false;
  function updateProgress() {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = documentHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / documentHeight)) : 1;
    progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    ticking = false;
  }
  function scheduleProgress() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }
  window.addEventListener('scroll', scheduleProgress, {passive:true});
  window.addEventListener('resize', scheduleProgress, {passive:true});
  scheduleProgress();

  const cards = Array.from(document.querySelectorAll('.project'));
  let moveQueued = false;
  let latestCard = null;
  let latestEvent = null;
  function paintCard() {
    moveQueued = false;
    if (!latestCard || !latestEvent) return;
    const rect = latestCard.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (latestEvent.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (latestEvent.clientY - rect.top) / rect.height));
    latestCard.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    latestCard.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    latestCard.style.setProperty('--gx', ((x - .5) * 12).toFixed(1) + 'px');
    latestCard.style.setProperty('--gy', ((y - .5) * 10 - 5).toFixed(1) + 'px');
  }
  cards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (!canHover.matches || reduced.matches) return;
      latestCard = card;
      latestEvent = event;
      if (!moveQueued) { moveQueued = true; requestAnimationFrame(paintCard); }
    }, {passive:true});
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--gx');
      card.style.removeProperty('--gy');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
  // Highlight navigation section unobtrusively as readers scroll.
  const ids = ['work','about','skills','contact'];
  const navLinks = new Map(ids.map((id) => [id, document.querySelector('nav a[href="#' + id + '"]')]));
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link, id) => {
          if (!link) return;
          if (id === entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin:'-25% 0px -60% 0px', threshold:0 });
    ids.map((id) => document.getElementById(id)).filter(Boolean).forEach((e) => navObserver.observe(e));
  }
})();
