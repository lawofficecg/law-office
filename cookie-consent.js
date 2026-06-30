/* ============================================================
   Law Office of Caroline Golian — Cookie Consent
   ============================================================
   Behaviour:
   - On first visit, show banner (bottom of screen).
   - Accept → stores 'accepted', fires loadAnalytics().
   - Reject  → stores 'rejected', no tracking scripts load.
   - Banner is skipped on subsequent visits unless preference is cleared.
   - "Cookie Preferences" footer button re-opens banner for change.
   - loadAnalytics() is the single integration point: add any
     analytics/tracking script injection here when ready.
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'cg_cookie_consent';

  /* ── Analytics gate ────────────────────────────────────────
     Drop any tracking script injection here.
     Called only when the user clicks Accept.
  ─────────────────────────────────────────────────────────── */
  function loadAnalytics() {
    /* Example (commented out — uncomment and fill in GA4 ID when ready):
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
    */
  }

  /* ── Banner ─────────────────────────────────────────────── */
  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<p>We use cookies to keep the site running smoothly. ' +
      'No tracking or analytics cookies are set without your consent. ' +
      '<a href="privacy-policy.html">Privacy Policy</a></p>' +
      '<div class="cookie-actions">' +
        '<button id="cookie-reject">Reject</button>' +
        '<button id="cookie-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);

    /* Slide in after a short delay so the page render isn't blocked */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('visible');
        /* Move focus to Accept for keyboard users */
        var acceptBtn = document.getElementById('cookie-accept');
        if (acceptBtn) acceptBtn.focus({ preventScroll: true });
      });
    });

    document.getElementById('cookie-accept').addEventListener('click', function () {
      saveChoice('accepted');
      hideBanner();
      loadAnalytics();
    });

    document.getElementById('cookie-reject').addEventListener('click', function () {
      saveChoice('rejected');
      hideBanner();
    });

    /* Trap focus inside banner while it's open */
    banner.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = banner.querySelectorAll('a, button');
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    return banner;
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.classList.remove('visible');
    banner.addEventListener('transitionend', function () { banner.remove(); }, { once: true });
  }

  function saveChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function getChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  /* ── Footer "Cookie Preferences" link ───────────────────── */
  function wirePreferenceLinks() {
    document.querySelectorAll('.cookie-pref-link').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        /* Clear stored choice so banner logic runs fresh */
        try { localStorage.removeItem(STORAGE_KEY); } catch (ex) {}
        if (!document.getElementById('cookie-banner')) {
          buildBanner();
        }
      });
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    wirePreferenceLinks();
    var choice = getChoice();
    if (choice === 'accepted') {
      loadAnalytics();
      return;
    }
    if (choice === 'rejected') {
      return;
    }
    /* No stored choice — show banner */
    buildBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
