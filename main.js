/* ============================================================
   Law Office of Caroline Golian — Site JavaScript
   ============================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── SCROLL REVEAL ──
     Deliberately the very first thing this script does, wrapped in its
     own try/catch, so a bug anywhere else on the page (custom cursor,
     intake form config, third-party interference, etc.) can never stop
     real content from becoming visible — if anything above throws, the
     catch block below force-reveals everything immediately. There is no
     additional blanket timeout beyond that: a fixed timeout that fires
     regardless of scroll position would force-reveal below-the-fold
     sections (e.g. Fees) before the visitor ever scrolls to them,
     silently skipping their entrance animation. */
  try {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const showAll = () => revealEls.forEach((el) => el.classList.add('visible'));

    if (prefersReduced || !('IntersectionObserver' in window)) {
      showAll();
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => observer.observe(el));
    }

    /* Stagger delays */
    document.querySelectorAll('.stagger').forEach((parent) => {
      const children = parent.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 80}ms`;
      });
    });
  } catch (err) {
    /* If anything above threw, fall back to showing everything
       immediately rather than leaving the page blank. */
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
      el.classList.add('visible');
    });
  }

  /* ── PAGE TRANSITION OVERLAY ── */
  const overlay = document.querySelector('.page-overlay');
  if (overlay) {
    /* Fade out on entry */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('fade-out'));
    });

    /* When a page is restored from the browser's back/forward cache
       (e.g. clicking the Back button), this script does not re-run, so
       the overlay would otherwise stay stuck in the opaque state it was
       left in right before navigating away — showing as a solid color
       screen. Force it transparent again on any bfcache restore. */
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) overlay.classList.add('fade-out');
    });

    if (!prefersReduced) {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') ||
            href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript')) return;
        if (link.target === '_blank') return;
        e.preventDefault();
        overlay.classList.remove('fade-out');
        setTimeout(() => { window.location.href = href; }, 520);
      });
    }
  }

  /* ── HEADER: shadow on scroll ── */
  const header = document.getElementById('site-header');
  if (header) {
    const onHeaderScroll = () => header.classList.toggle('scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* ── MOBILE NAV ── */
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !header.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── ANIMATED DIVIDERS ── */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const dividerObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          dividerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.divider').forEach(el => dividerObs.observe(el));
  } else {
    document.querySelectorAll('.divider').forEach(el => el.classList.add('visible'));
  }

  /* Section label line animation (also uses .visible) */
  if ('IntersectionObserver' in window) {
    const labelObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          labelObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.section-label').forEach(el => labelObs.observe(el));
  } else {
    document.querySelectorAll('.section-label').forEach(el => el.classList.add('visible'));
  }

  /* ── COUNTER ANIMATION — resets to 0 on leave, replays on re-enter ──
     The HTML starts with the correct final amounts already in place (for
     no-JS users, search engines, and AI previews). We only ever blank a
     counter to 0 AFTER it has animated at least once, so a visitor who
     never scrolls the results into view always sees the real number. */
  const counterEls = document.querySelectorAll('[data-target]');
  /* Track active rAF id per element so we can cancel in-flight animations */
  const counterRafs = new WeakMap();
  const counterStarted = new WeakSet();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    counterStarted.add(el);
    const target = parseInt(el.dataset.target, 10);
    const start  = parseInt(el.dataset.start  || '0', 10);
    const prefix = el.dataset.prefix || '';
    const duration = 1800;
    let startTime = null;

    /* Cancel any previous animation on this element */
    if (counterRafs.has(el)) cancelAnimationFrame(counterRafs.get(el));

    function step(now) {
      if (!startTime) startTime = now;
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(start + easeOutCubic(progress) * (target - start));
      el.textContent = prefix + value.toLocaleString();
      if (progress < 1) {
        counterRafs.set(el, requestAnimationFrame(step));
      } else {
        counterRafs.delete(el);
        el.classList.add('pulse-done');
        el.addEventListener('animationend', () => el.classList.remove('pulse-done'), { once: true });
      }
    }
    counterRafs.set(el, requestAnimationFrame(step));
  }

  function resetCounter(el) {
    /* Never blank a counter that hasn't animated yet — leave the correct
       static HTML value in place until it actually enters the viewport. */
    if (!counterStarted.has(el)) return;
    if (counterRafs.has(el)) { cancelAnimationFrame(counterRafs.get(el)); counterRafs.delete(el); }
    const prefix = el.dataset.prefix || '';
    const start  = parseInt(el.dataset.start || '0', 10);
    el.textContent = prefix + start.toLocaleString();
  }

  if (counterEls.length && 'IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!prefersReduced) animateCounter(entry.target);
          else {
            counterStarted.add(entry.target);
            const prefix = entry.target.dataset.prefix || '';
            entry.target.textContent = prefix + parseInt(entry.target.dataset.target, 10).toLocaleString();
          }
        } else {
          resetCounter(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    counterEls.forEach(el => counterObs.observe(el));
  }

  /* ── SCROLL-LINKED HERO OPACITY ── */
  const heroH1 = document.querySelector('.hero h1');
  if (heroH1 && !prefersReduced) {
    const heroEl  = document.querySelector('.hero');
    const heroH   = heroEl ? heroEl.offsetHeight : window.innerHeight;
    window.addEventListener('scroll', () => {
      const opacity = Math.max(0.1, 1 - (window.scrollY / (heroH * 0.55)));
      heroH1.style.opacity = opacity;
    }, { passive: true });
  }

  /* ── FLOATING LABELS ── */
  document.querySelectorAll('.float-group').forEach((group) => {
    const input = group.querySelector('input, select, textarea');
    if (!input) return;

    const updateState = () => {
      const hasVal = input.value !== '' && input.value !== null;
      group.classList.toggle('has-value', hasVal);
    };

    input.addEventListener('focus',  () => group.classList.add('focused'));
    input.addEventListener('blur',   () => { group.classList.remove('focused'); updateState(); });
    input.addEventListener('input',  updateState);
    input.addEventListener('change', updateState);
    updateState();
  });

  /* ── INLINE FORM VALIDATION ── */
  /* ── INTAKE FORM SUBMISSION CONFIG ──
     The intake form POSTs to Web3Forms (api.web3forms.com) — a hosted form
     backend chosen specifically because it supports a dynamically
     interpolated email subject (via {full_name}/{case_type} placeholders)
     without a paid plan, keeps the destination inbox private (you never
     put an email address in the frontend, only an access key), and never
     requires frontend JS to talk to an SMTP/email API directly.
     ACCESS_KEY is intentionally blank. A Web3Forms access key is designed
     to be public/client-side (like a Stripe publishable key) — it only
     identifies which inbox a submission routes to in their dashboard and
     is not a secret credential. It is left blank here so the form stays
     inert until the office provides the real key. */
  const INTAKE_FORM_CONFIG = {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: '', // TODO: paste the Web3Forms access key here once issued
  };

  const intakeForm = document.getElementById('intake-form');
  if (intakeForm) {
    const validations = {
      'full-name':  { required: true, minLen: 2, message: 'Please enter your full name.' },
      'phone':      { required: true, pattern: /^[\d\s\-\+\(\)\.]{7,}$/, message: 'Please enter a valid phone number.' },
      'email':      { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.' },
      'case-type':  { required: true, message: 'Please select a case type.' },
    };

    function validateField(input) {
      const id    = input.id;
      const rules = validations[id];
      if (!rules) return true;
      const group = input.closest('.form-group, .float-group');
      if (!group) return true;

      /* Ensure message el exists */
      let msgEl = group.querySelector('.field-message');
      if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.className = 'field-message';
        msgEl.setAttribute('role', 'alert');
        group.appendChild(msgEl);
      }

      const val = input.value.trim();

      if (rules.required && !val) {
        group.classList.add('field-error');
        group.classList.remove('field-valid');
        msgEl.textContent = rules.message;
        return false;
      }
      if (rules.minLen && val.length < rules.minLen) {
        group.classList.add('field-error');
        group.classList.remove('field-valid');
        msgEl.textContent = rules.message;
        return false;
      }
      if (rules.pattern && val && !rules.pattern.test(val)) {
        group.classList.add('field-error');
        group.classList.remove('field-valid');
        msgEl.textContent = rules.message;
        return false;
      }

      group.classList.remove('field-error');
      if (val) {
        group.classList.add('field-valid');
        msgEl.textContent = '';
      }
      return true;
    }

    /* Validate on blur */
    Object.keys(validations).forEach(id => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('blur', () => validateField(input));
    });

    /* ── FORM PROGRESS BAR ── */
    const progressBar = document.getElementById('form-progress-bar');
    const requiredFields = ['full-name', 'phone', 'email', 'case-type'];

    function updateProgress() {
      if (!progressBar) return;
      let filled = 0;
      requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== '') filled++;
      });
      progressBar.style.width = ((filled / requiredFields.length) * 100) + '%';
    }

    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateProgress);
      if (el) el.addEventListener('change', updateProgress);
    });

    /* ── SUBMIT: validate, then POST to the form backend via fetch ── */
    const resultMsgEl = document.getElementById('form-result-message');
    const SUCCESS_MESSAGE = "Thank you. Your inquiry has been received. Submitting this form does not create an attorney-client relationship. Our office will review the information provided and respond if appropriate.";
    const ERROR_MESSAGE   = "Your message could not be submitted. Please contact the office directly.";

    function showResultMessage(kind, text) {
      if (!resultMsgEl) return;
      resultMsgEl.hidden = false;
      resultMsgEl.textContent = text;
      resultMsgEl.classList.remove('success', 'error');
      resultMsgEl.classList.add(kind);
      resultMsgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    intakeForm.addEventListener('submit', (e) => {
      e.preventDefault();

      /* Honeypot check — bots fill hidden fields; silently no-op */
      const hp = document.getElementById('website');
      if (hp && hp.value) return;

      /* Validate all required fields */
      let valid = true;
      Object.keys(validations).forEach(id => {
        const input = document.getElementById(id);
        if (input && !validateField(input)) valid = false;
      });

      /* Validate required consent checkbox */
      const consentLegal = document.getElementById('consent-legal');
      if (consentLegal && !consentLegal.checked) {
        valid = false;
        const group = consentLegal.closest('.form-group');
        if (group) {
          group.classList.add('field-error');
          let msgEl = group.querySelector('.field-message');
          if (!msgEl) {
            msgEl = document.createElement('p');
            msgEl.className = 'field-message';
            msgEl.setAttribute('role', 'alert');
            group.appendChild(msgEl);
          }
          msgEl.textContent = 'You must agree to the terms before submitting.';
        }
      } else if (consentLegal) {
        const group = consentLegal.closest('.form-group');
        if (group) group.classList.remove('field-error');
      }

      if (!valid) {
        /* Focus first error */
        const firstErr = intakeForm.querySelector('.field-error input, .field-error select');
        if (firstErr) firstErr.focus();
        return;
      }

      /* Online submission is intentionally inactive until a real provider
         access key is configured (see INTAKE_FORM_CONFIG above). Surface
         the existing inactive notice rather than attempting a request. */
      if (!INTAKE_FORM_CONFIG.endpoint || !INTAKE_FORM_CONFIG.accessKey) {
        const notice = document.getElementById('form-inactive-notice');
        if (notice) notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      /* Build the dynamic subject: "[Full Name] submitted a [Case Type] intake form" */
      const fullName = document.getElementById('full-name').value.trim();
      const caseType = document.getElementById('case-type').value.trim();
      const subjectEl = document.getElementById('email-subject');
      if (subjectEl) subjectEl.value = `${fullName} submitted a ${caseType} intake form`;

      const accessKeyEl = document.getElementById('access-key');
      if (accessKeyEl) accessKeyEl.value = INTAKE_FORM_CONFIG.accessKey;

      const submittedAtEl = document.getElementById('submitted-at');
      if (submittedAtEl) submittedAtEl.value = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

      const btn = document.getElementById('submit-btn');
      if (btn) btn.classList.add('loading');

      fetch(INTAKE_FORM_CONFIG.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(intakeForm),
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok && data && data.success !== false) {
            showResultMessage('success', SUCCESS_MESSAGE);
            intakeForm.reset();
            if (progressBar) progressBar.style.width = '0%';
          } else {
            showResultMessage('error', ERROR_MESSAGE);
          }
        })
        .catch(() => showResultMessage('error', ERROR_MESSAGE))
        .finally(() => { if (btn) btn.classList.remove('loading'); });
    });
  }

  /* Testimonials now use a pure CSS marquee — no JS needed */

  /* ── SCROLL PROGRESS BAR ── */
  const scrollBar = document.getElementById('scroll-progress');
  if (scrollBar) {
    window.addEventListener('scroll', () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (docH > 0 ? (window.scrollY / docH) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ── CUSTOM CURSOR (desktop pointer devices only) ── */
  const cursorDot  = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let hasMoved = false;

    /* Both cursor elements default to their CSS position (0, 0) until the
       first real mousemove — without this they render as a circle stuck
       in the top-left corner of the page on load. */
    cursorDot.style.opacity = '0';
    cursorRing.style.opacity = '0';

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top  = my + 'px';
      if (!hasMoved) {
        hasMoved = true;
        rx = mx; ry = my;
        cursorDot.style.opacity = '';
        cursorRing.style.opacity = '';
      }
    });

    (function lerpRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
      requestAnimationFrame(lerpRing);
    })();

    const hoverEls = document.querySelectorAll('a, button, [role="button"], .practice-card, label');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('hovering');
        cursorRing.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('hovering');
        cursorRing.classList.remove('hovering');
      });
    });

    document.addEventListener('mousedown', () => {
      cursorDot.classList.add('clicking');
      cursorRing.classList.add('clicking');
    });
    document.addEventListener('mouseup', () => {
      cursorDot.classList.remove('clicking');
      cursorRing.classList.remove('clicking');
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '';
      cursorRing.style.opacity = '';
    });
  }

  /* ── WORD-SPLIT REVEAL ── */
  if (!prefersReduced) {
    document.querySelectorAll('.word-split').forEach(el => {
      const words = el.textContent.split(/(\s+)/);
      el.innerHTML = words.map(w =>
        w.trim()
          ? `<span class="word"><span class="word-inner">${w}</span></span>`
          : w
      ).join('');
    });
  }
  if ('IntersectionObserver' in window) {
    const wsObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); wsObs.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.word-split').forEach(el => wsObs.observe(el));
  } else {
    document.querySelectorAll('.word-split').forEach(el => el.classList.add('visible'));
  }

  /* ── 3D TILT + CURSOR-SPOTLIGHT CARDS ──
     .tilt-card gets the 3D rotation (and spotlight); .spotlight-hover-only
     cards (ones that already have their own hover transform, like sliding
     or lifting) get just the cursor-following glow so it doesn't fight
     with their existing transform. */
  if (!prefersReduced) {
    document.querySelectorAll('.tilt-card, .spotlight-hover').forEach(card => {
      const doTilt = card.classList.contains('tilt-card');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spotlight-x', ((e.clientX - rect.left) / rect.width  * 100) + '%');
        card.style.setProperty('--spotlight-y', ((e.clientY - rect.top)  / rect.height * 100) + '%');
        if (doTilt) {
          const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
          const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
          card.style.setProperty('--rx', (-dy * 7) + 'deg');
          card.style.setProperty('--ry', ( dx * 7) + 'deg');
        }
      });
      card.addEventListener('mouseleave', () => {
        if (doTilt) {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        }
      });
    });
  }

  /* ── MAGNETIC BUTTONS ── */
  if (!prefersReduced) {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width  / 2) * 0.28;
        const dy = (e.clientY - rect.top  - rect.height / 2) * 0.28;
        btn.style.setProperty('--mx', dx + 'px');
        btn.style.setProperty('--my', dy + 'px');
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

})();
