/* ============================================================
   Law Office of Caroline Golian — Site JavaScript
   Scroll reveals · Header scroll state · Mobile nav
   ============================================================ */

(function () {
  'use strict';

  /* ----- HEADER: shadow on scroll ----- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----- MOBILE NAV ----- */
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !header.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    /* Close on nav link click (mobile) */
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----- SCROLL REVEAL via IntersectionObserver ----- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    /* Immediately show all for reduced-motion or unsupported browsers */
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('visible');
    });
  }

  /* ----- STAGGER: apply per-child delays inside .stagger wrappers ----- */
  document.querySelectorAll('.stagger').forEach((parent) => {
    const children = parent.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * 80}ms`;
    });
  });

})();
