/* ============================================================
   LATWO — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const initSteps = [
    initCookieConsent,
    initHeader,
    initScrollReveal,
    initScrollZoom,
    initLangSwitcher,
    initMobileNav,
    initFAQ,
    initContactForm,
    initChecklist,
    initPricingContactPrefill,
    initTestimonialsHoverCarousel,
    initSocialProofInfiniteRows,
    initSocialProofAvatars,
    initFooterNavAnimationLabels
  ];

  initSteps.forEach((step) => {
    try {
      step();
    } catch (error) {
      console.error('[LATWO init error]', error);
    }
  });
});

const COOKIE_CONSENT_VERSION = '2026-05-17';
const COOKIE_CONSENT_STORAGE_KEY = 'latwo_cookie_consent_v1';
const COOKIE_CONSENT_HISTORY_KEY = 'latwo_cookie_consent_history_v1';
const COOKIE_CONSENT_COOKIE_NAME = 'latwo_cookie_consent';
const COOKIE_CONSENT_MAX_AGE_DAYS = 180;
const COOKIE_CONSENT_LOG_ENDPOINT = '/api/consent';
const COOKIE_MANAGE_ICON_VARIANT = 'shield-lock'; // 'cookie-gear' | 'sliders' | 'shield-lock'
const GA_MEASUREMENT_ID = 'G-N5GLEV2DST';

/* ============================================================
   HEADER — scroll transparent effect
   ============================================================ */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const themeBlocks = Array.from(document.querySelectorAll('section[data-header-theme], footer[data-header-theme]'));

  function updateHeaderTheme() {
    const probeY = header.offsetHeight + 8;
    const activeBlock = themeBlocks.find(block => {
      const rect = block.getBoundingClientRect();
      return rect.top <= probeY && rect.bottom > probeY;
    });
    const theme = (activeBlock && activeBlock.dataset.headerTheme) ? activeBlock.dataset.headerTheme : 'light';

    header.classList.toggle('header-theme-light', theme === 'light');
    header.classList.toggle('header-theme-dark', theme === 'dark');
  }

  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateHeaderTheme();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateHeaderTheme);
  onScroll();
}

/* ============================================================
   SCROLL REVEAL — fade in + scale on scroll
   ============================================================ */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.scroll-reveal');
  const scaleEls = document.querySelectorAll('.scroll-scale');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
  scaleEls.forEach(el => observer.observe(el));
}

/* ============================================================
   SCROLL ZOOM — photo zoom on scroll
   ============================================================ */
function initScrollZoom() {
  const photoWrapper = document.getElementById('spas-photo');
  if (!photoWrapper) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        photoWrapper.classList.add('zoom');
      } else {
        photoWrapper.classList.remove('zoom');
      }
    });
  }, { threshold: 0.3 });

  observer.observe(photoWrapper);
}

/* ============================================================
   LANGUAGE SWITCHER
   ============================================================ */
function initLangSwitcher() {
  const switchers = document.querySelectorAll('.lang-switcher');
  if (!switchers.length) return;

  switchers.forEach((switcher) => {
    const dropdown = switcher.querySelector('.lang-dropdown');
    if (!dropdown) return;

    const trigger = switcher.querySelector('.mobile-lang-trigger') || switcher;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();

      switchers.forEach((otherSwitcher) => {
        if (otherSwitcher === switcher) return;
        const otherDropdown = otherSwitcher.querySelector('.lang-dropdown');
        if (otherDropdown) otherDropdown.classList.remove('open');
        otherSwitcher.classList.remove('is-open');
      });

      dropdown.classList.toggle('open');
      switcher.classList.toggle('is-open', dropdown.classList.contains('open'));
    });
  });

  document.addEventListener('click', () => {
    switchers.forEach((switcher) => {
      const dropdown = switcher.querySelector('.lang-dropdown');
      if (dropdown) dropdown.classList.remove('open');
      switcher.classList.remove('is-open');
    });
  });
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (!nav) return;
  nav.classList.toggle('open');
  document.body.classList.toggle('mobile-menu-open', nav.classList.contains('open'));
}

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (nav) nav.classList.remove('open');
  document.body.classList.remove('mobile-menu-open');
}

/* ============================================================
   MOBILE NAV INIT
   ============================================================ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

  const closeMenu = () => {
    closeMobileNav();
    hamburger.classList.remove('open');
  };

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    toggleMobileNav();
  });

  document.querySelectorAll('#mobile-nav a, .mobile-nav-close').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.querySelectorAll('.mobile-lang-option').forEach(button => {
    button.addEventListener('click', closeMenu);
  });
}

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.setAttribute('tabindex', '0');
    question.addEventListener('click', () => toggleFaq(question));
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFaq(question);
      }
    });
  });
}

function toggleFaq(questionEl) {
  const item = questionEl.closest('.faq-item');
  if (!item) return;

  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(openItem => {
    openItem.classList.remove('open');
  });

  // Open clicked if it was closed
  if (!isOpen) {
    item.classList.add('open');
  }
}

/* ============================================================
   COOKIE CONSENT — GDPR/ePrivacy style controls
   ============================================================ */
function initCookieConsent() {
  if (window.__latwoCookieConsentInitialized) return;
  window.__latwoCookieConsentInitialized = true;

  ensureCookieConsentUi();
  bindCookieConsentEvents();

  const stored = readCookieConsentRecord();
  if (stored && isConsentRecordValid(stored) && stored.version === COOKIE_CONSENT_VERSION) {
    applyConsentRecord(stored, { log: false });
  } else {
    showCookieBanner();
  }
}

function getConsentLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'uk';
}

function getCookiePolicyPath() {
  return getConsentLang() === 'en' ? '/en/cookie-policy' : '/cookie-policy';
}

function getCookieConsentCopy() {
  const isEn = getConsentLang() === 'en';
  if (isEn) {
    return {
      title: 'We respect your privacy',
      text: 'We use essential cookies for website operation and optional cookies for analytics and embedded media. You can accept, reject, or configure your preferences.',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      customize: 'Customize',
      settingsTitle: 'Cookie settings',
      essential: 'Essential cookies (always on)',
      essentialDesc: 'Required for core site functionality and security.',
      analytics: 'Analytics cookies',
      analyticsDesc: 'Help us understand website usage to improve content and UX.',
      marketing: 'Marketing and media cookies',
      marketingDesc: 'Allow third-party embeds (for example, video players) and related tracking.',
      save: 'Save choices',
      openSettings: 'Cookie settings',
      policy: 'Cookie policy'
    };
  }

  return {
    title: 'Ми поважаємо вашу приватність',
    text: 'Ми використовуємо обовʼязкові кукі для роботи сайту та опційні кукі для аналітики і вбудованого медіа. Ви можете прийняти, відхилити або налаштувати.',
    acceptAll: 'Прийняти все',
    rejectAll: 'Відхилити все',
    customize: 'Налаштувати',
    settingsTitle: 'Налаштування кукі',
    essential: 'Обовʼязкові кукі (завжди увімкнені)',
    essentialDesc: 'Потрібні для базової роботи сайту та безпеки.',
    analytics: 'Аналітичні кукі',
    analyticsDesc: 'Допомагають розуміти використання сайту та покращувати контент.',
    marketing: 'Маркетингові та медіа кукі',
    marketingDesc: 'Дозволяють сторонні вбудовані сервіси (наприклад, відео) і повʼязані трекери.',
    save: 'Зберегти вибір',
    openSettings: 'Налаштування кукі',
    policy: 'Політика cookies'
  };
}

function getCookieManageIconMarkup() {
  switch (COOKIE_MANAGE_ICON_VARIANT) {
    case 'sliders':
      return `
        <svg class="cookie-manage-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M4 6a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2v.2h9A1.3 1.3 0 0 1 19 7.5 1.3 1.3 0 0 1 17.5 8.8h-9V9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm2 9a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5a2 2 0 0 0 2-2v-.2h9A1.3 1.3 0 0 0 19 16.5 1.3 1.3 0 0 0 17.5 15.2h-9V15a2 2 0 0 0-2-2Zm10-5a2 2 0 0 0-2 2v.2H6.5A1.3 1.3 0 0 0 5 13.5a1.3 1.3 0 0 0 1.5 1.3H14v.2a2 2 0 0 0 2 2h.5a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z"/>
        </svg>
      `;
    case 'shield-lock':
      return `
        <svg class="cookie-manage-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 2.2 4.5 5v6.4c0 5.2 3.3 8.7 7.5 10.5 4.2-1.8 7.5-5.3 7.5-10.5V5L12 2.2Zm0 2.2 5.3 2v5c0 4.1-2.4 7-5.3 8.4-2.9-1.4-5.3-4.3-5.3-8.4v-5Zm0 4.1a2.7 2.7 0 0 0-2.7 2.7v1H9a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V13a1 1 0 0 0-1-1h-.3v-1A2.7 2.7 0 0 0 12 8.5Zm-1 3a1 1 0 1 1 2 0v1h-2Z"/>
        </svg>
      `;
    case 'cookie-gear':
    default:
      return `
        <svg class="cookie-manage-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M8.3 3.6a3.1 3.1 0 1 1 6.2 0h1.1a3.1 3.1 0 1 1 3.1 3.1v1.1a3.1 3.1 0 1 1 0 6.2v1.1a3.1 3.1 0 1 1-3.1 3.1h-1.1a3.1 3.1 0 1 1-6.2 0H7.2a3.1 3.1 0 1 1-3.1-3.1v-1.1a3.1 3.1 0 1 1 0-6.2V6.7A3.1 3.1 0 1 1 7.2 3.6Zm3.7 3.3a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2Zm0 2.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4Z"/>
        </svg>
      `;
  }
}

function ensureCookieConsentUi() {
  if (document.getElementById('cookie-consent-root')) return;

  const copy = getCookieConsentCopy();
  const policyPath = getCookiePolicyPath();

  const root = document.createElement('div');
  root.id = 'cookie-consent-root';
  root.innerHTML = `
    <div class="cookie-consent-backdrop" id="cookie-consent-backdrop" hidden></div>

    <section class="cookie-consent-banner" id="cookie-consent-banner" hidden aria-live="polite">
      <div class="cookie-consent-banner-inner">
        <div class="cookie-consent-content">
          <h3>${escapeHtmlText(copy.title)}</h3>
          <p>${escapeHtmlText(copy.text)}</p>
          <a href="${policyPath}" class="cookie-consent-policy-link">${escapeHtmlText(copy.policy)}</a>
        </div>
        <div class="cookie-consent-actions">
          <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-accept-all">${escapeHtmlText(copy.acceptAll)}</button>
          <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-reject-all">${escapeHtmlText(copy.rejectAll)}</button>
          <button type="button" class="cookie-btn cookie-btn-ghost" id="cookie-open-settings">${escapeHtmlText(copy.customize)}</button>
        </div>
      </div>
    </section>

    <section class="cookie-consent-modal" id="cookie-consent-modal" hidden role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
      <div class="cookie-consent-modal-card">
        <div class="cookie-consent-modal-head">
          <h3 id="cookie-consent-title">${escapeHtmlText(copy.settingsTitle)}</h3>
          <button type="button" class="cookie-consent-close" id="cookie-close-settings" aria-label="Close">×</button>
        </div>
        <div class="cookie-consent-option is-locked">
          <div>
            <h4>${escapeHtmlText(copy.essential)}</h4>
            <p>${escapeHtmlText(copy.essentialDesc)}</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" checked disabled />
            <span></span>
          </label>
        </div>
        <div class="cookie-consent-option">
          <div>
            <h4>${escapeHtmlText(copy.analytics)}</h4>
            <p>${escapeHtmlText(copy.analyticsDesc)}</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookie-opt-analytics" />
            <span></span>
          </label>
        </div>
        <div class="cookie-consent-option">
          <div>
            <h4>${escapeHtmlText(copy.marketing)}</h4>
            <p>${escapeHtmlText(copy.marketingDesc)}</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookie-opt-marketing" />
            <span></span>
          </label>
        </div>
        <div class="cookie-consent-modal-actions">
          <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-reject-all">${escapeHtmlText(copy.rejectAll)}</button>
          <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-save">${escapeHtmlText(copy.save)}</button>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="cookie-manage-btn"
      id="cookie-manage-btn"
      hidden
      aria-label="${escapeHtmlText(copy.openSettings)}"
      title="${escapeHtmlText(copy.openSettings)}"
    >
      ${getCookieManageIconMarkup()}
    </button>
  `;

  document.body.appendChild(root);
}

function bindCookieConsentEvents() {
  const acceptAll = document.getElementById('cookie-accept-all');
  const rejectAll = document.getElementById('cookie-reject-all');
  const openSettings = document.getElementById('cookie-open-settings');
  const closeSettings = document.getElementById('cookie-close-settings');
  const modalRejectAll = document.getElementById('cookie-modal-reject-all');
  const modalSave = document.getElementById('cookie-modal-save');
  const manageBtn = document.getElementById('cookie-manage-btn');
  const backdrop = document.getElementById('cookie-consent-backdrop');

  if (acceptAll) {
    acceptAll.addEventListener('click', () => saveConsentAndApply({ analytics: true, marketing: true }, 'banner-accept-all'));
  }
  if (rejectAll) {
    rejectAll.addEventListener('click', () => saveConsentAndApply({ analytics: false, marketing: false }, 'banner-reject-all'));
  }
  if (openSettings) {
    openSettings.addEventListener('click', () => openCookieSettingsModal({ fromBanner: true }));
  }
  if (closeSettings) {
    closeSettings.addEventListener('click', () => closeCookieSettingsModal({ restoreBanner: true, autoRejectOnFirstVisit: true }));
  }
  if (modalRejectAll) {
    modalRejectAll.addEventListener('click', () => saveConsentAndApply({ analytics: false, marketing: false }, 'modal-reject-all'));
  }
  if (modalSave) {
    modalSave.addEventListener('click', () => {
      const analytics = Boolean(document.getElementById('cookie-opt-analytics')?.checked);
      const marketing = Boolean(document.getElementById('cookie-opt-marketing')?.checked);
      saveConsentAndApply({ analytics, marketing }, 'modal-save');
    });
  }
  if (manageBtn) {
    manageBtn.addEventListener('click', () => openCookieSettingsModal({ fromBanner: false }));
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => closeCookieSettingsModal({ restoreBanner: true, autoRejectOnFirstVisit: true }));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const modal = document.getElementById('cookie-consent-modal');
    if (modal && !modal.hidden) {
      closeCookieSettingsModal({ restoreBanner: true, autoRejectOnFirstVisit: true });
    }
  });
}

function saveConsentAndApply(choices, source) {
  const previous = window.latwoCookieConsent && window.latwoCookieConsent.consent
    ? {
        analytics: Boolean(window.latwoCookieConsent.consent.analytics),
        marketing: Boolean(window.latwoCookieConsent.consent.marketing)
      }
    : null;

  const record = buildConsentRecord(choices, source);
  saveConsentRecord(record);
  applyConsentRecord(record, { log: true });

  const disabledAfterBeingEnabled = Boolean(
    previous &&
    (
      (previous.analytics && !record.consent.analytics) ||
      (previous.marketing && !record.consent.marketing)
    )
  );

  if (disabledAfterBeingEnabled) {
    setTimeout(() => {
      window.location.reload();
    }, 120);
  }
}

function buildConsentRecord(choices, source) {
  return {
    id: createConsentId(),
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    source: source || 'unknown',
    locale: getConsentLang(),
    path: window.location.pathname,
    consent: {
      essential: true,
      analytics: Boolean(choices && choices.analytics),
      marketing: Boolean(choices && choices.marketing)
    }
  };
}

function createConsentId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `cc-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function isConsentRecordValid(record) {
  return Boolean(
    record &&
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.version === 'string' &&
      typeof record.timestamp === 'string' &&
      record.consent &&
      record.consent.essential === true &&
      typeof record.consent.analytics === 'boolean' &&
      typeof record.consent.marketing === 'boolean'
  );
}

function saveConsentRecord(record) {
  const minimalCookieRecord = {
    id: record.id,
    version: record.version,
    timestamp: record.timestamp,
    consent: {
      essential: true,
      analytics: record.consent.analytics,
      marketing: record.consent.marketing
    }
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
    const historyRaw = window.localStorage.getItem(COOKIE_CONSENT_HISTORY_KEY);
    let history = [];
    if (historyRaw) {
      const parsedHistory = JSON.parse(historyRaw);
      if (Array.isArray(parsedHistory)) {
        history = parsedHistory;
      }
    }
    history.push(record);
    const normalized = history.slice(-25);
    window.localStorage.setItem(COOKIE_CONSENT_HISTORY_KEY, JSON.stringify(normalized));
  } catch (_error) {
    // Ignore storage errors (private mode, blocked storage, etc.)
  }

  const cookieValue = encodeURIComponent(JSON.stringify(minimalCookieRecord));
  const maxAgeSeconds = COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${cookieValue}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax; Secure`;
}

function readConsentCookie() {
  const all = document.cookie ? document.cookie.split(';') : [];
  const pair = all.find((row) => row.trim().startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`));
  if (!pair) return null;
  const value = pair.slice(pair.indexOf('=') + 1).trim();

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (_error) {
    return null;
  }
}

function readCookieConsentRecord() {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw) {
      const record = JSON.parse(raw);
      if (isConsentRecordValid(record)) return record;
    }
  } catch (_error) {
    // Ignore parse/storage errors.
  }

  const fromCookie = readConsentCookie();
  if (fromCookie && isConsentRecordValid(fromCookie)) {
    return fromCookie;
  }

  return null;
}

function showCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.hidden = false;
}

function hideCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.hidden = true;
}

function openCookieSettingsModal(options = {}) {
  const modal = document.getElementById('cookie-consent-modal');
  const backdrop = document.getElementById('cookie-consent-backdrop');
  if (!modal || !backdrop) return;

  if (options.fromBanner) {
    hideCookieBanner();
  }

  const current = window.latwoCookieConsent;
  const analytics = Boolean(current && current.consent && current.consent.analytics);
  const marketing = Boolean(current && current.consent && current.consent.marketing);
  const analyticsInput = document.getElementById('cookie-opt-analytics');
  const marketingInput = document.getElementById('cookie-opt-marketing');
  if (analyticsInput) analyticsInput.checked = analytics;
  if (marketingInput) marketingInput.checked = marketing;

  backdrop.hidden = false;
  modal.hidden = false;
}

function closeCookieSettingsModal(options = {}) {
  const hadConsent = Boolean(readCookieConsentRecord());

  if (!hadConsent && options.autoRejectOnFirstVisit) {
    saveConsentAndApply({ analytics: false, marketing: false }, 'modal-close-reject');
    return;
  }

  const modal = document.getElementById('cookie-consent-modal');
  const backdrop = document.getElementById('cookie-consent-backdrop');
  if (modal) modal.hidden = true;
  if (backdrop) backdrop.hidden = true;

  const shouldRestoreBanner = Boolean(options.restoreBanner);
  if (shouldRestoreBanner && !hadConsent) {
    showCookieBanner();
  }
}

function applyConsentRecord(record, options = {}) {
  window.latwoCookieConsent = record;
  hideCookieBanner();
  closeCookieSettingsModal();
  syncConsentToForm(record);
  runConsentGatedScripts(record.consent);

  const manageBtn = document.getElementById('cookie-manage-btn');
  if (manageBtn) manageBtn.hidden = false;

  if (options.log) {
    logConsentRecord(record);
  }
}

function runConsentGatedScripts(consent) {
  ensureGoogleAnalytics(consent);

  const placeholders = Array.from(document.querySelectorAll('script[data-consent-src][data-consent-category]'));
  placeholders.forEach((placeholder) => {
    if (placeholder.dataset.consentLoaded === '1') return;

    const category = String(placeholder.dataset.consentCategory || '').trim();
    const src = String(placeholder.dataset.consentSrc || '').trim();
    if (!category || !src) return;
    if (!consent || !consent[category]) return;

    const script = document.createElement('script');
    script.src = src;
    if (placeholder.hasAttribute('async')) script.async = true;
    if (placeholder.hasAttribute('defer')) script.defer = true;
    script.dataset.consentCategory = category;
    script.dataset.injectedByConsent = '1';

    placeholder.parentNode.insertBefore(script, placeholder.nextSibling);
    placeholder.dataset.consentLoaded = '1';
  });
}

function ensureGoogleAnalytics(consent) {
  if (!GA_MEASUREMENT_ID) return;
  if (!consent || !consent.analytics) return;
  if (window.__latwoGaInitialized) return;

  window.__latwoGaInitialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  script.dataset.consentCategory = 'analytics';
  script.dataset.injectedByConsent = '1';
  document.head.appendChild(script);
}

function syncConsentToForm(record) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  ensureHiddenField(form, 'form_started_at');
  ensureHiddenField(form, 'consent_id');
  ensureHiddenField(form, 'consent_version');
  ensureHiddenField(form, 'consent_timestamp');
  ensureHiddenField(form, 'consent_source');
  ensureHiddenField(form, 'consent_snapshot');

  const consentId = form.querySelector('input[name="consent_id"]');
  const consentVersion = form.querySelector('input[name="consent_version"]');
  const consentTimestamp = form.querySelector('input[name="consent_timestamp"]');
  const consentSource = form.querySelector('input[name="consent_source"]');
  const consentSnapshot = form.querySelector('input[name="consent_snapshot"]');

  if (record && isConsentRecordValid(record)) {
    if (consentId) consentId.value = record.id;
    if (consentVersion) consentVersion.value = record.version;
    if (consentTimestamp) consentTimestamp.value = record.timestamp;
    if (consentSource) consentSource.value = String(record.source || '');
    if (consentSnapshot) consentSnapshot.value = JSON.stringify(record.consent);
  } else {
    if (consentId) consentId.value = '';
    if (consentVersion) consentVersion.value = '';
    if (consentTimestamp) consentTimestamp.value = '';
    if (consentSource) consentSource.value = '';
    if (consentSnapshot) consentSnapshot.value = '';
  }
}

function ensureHiddenField(form, name) {
  if (!form || !name) return null;
  let field = form.querySelector(`input[name="${name}"]`);
  if (!field) {
    field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    form.prepend(field);
  }
  return field;
}

function ensureHoneypotField(form) {
  if (!form) return;
  if (form.querySelector('input[name="website"]')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'form-honeypot';
  wrapper.setAttribute('aria-hidden', 'true');

  const label = document.createElement('label');
  label.setAttribute('for', 'website-field-auto');
  label.textContent = 'Website';

  const input = document.createElement('input');
  input.id = 'website-field-auto';
  input.type = 'text';
  input.name = 'website';
  input.tabIndex = -1;
  input.autocomplete = 'off';

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  form.prepend(wrapper);
}

async function logConsentRecord(record) {
  try {
    await fetch(COOKIE_CONSENT_LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consent_id: record.id,
        consent_version: record.version,
        consent_timestamp: record.timestamp,
        consent_source: record.source,
        consent_locale: record.locale,
        consent_path: record.path,
        consent: record.consent
      })
    });
  } catch (_error) {
    // Non-blocking on purpose.
  }
}

function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   CONTACT FORM — submit via backend API (Vercel + Resend)
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  ensureHoneypotField(form);
  syncConsentToForm(window.latwoCookieConsent || null);

  const startedAtField = form.querySelector('input[name="form_started_at"]');
  if (startedAtField) {
    startedAtField.value = String(Date.now());
  }

  form.addEventListener('submit', submitForm);
}

async function submitForm(e) {
  e.preventDefault();
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');
  const submitBtn = form ? form.querySelector('.form-submit-btn') : null;
  if (!form || !successMsg || !submitBtn) return;

  const data = new FormData(form);
  const payload = {
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim(),
    company: String(data.get('company') || '').trim(),
    service: String(data.get('service') || '').trim(),
    message: String(data.get('message') || '').trim(),
    discovery_call: Boolean(data.get('discovery_call')),
    website: String(data.get('website') || '').trim(),
    form_started_at: Number(data.get('form_started_at') || 0),
    consent_id: String(data.get('consent_id') || '').trim(),
    consent_version: String(data.get('consent_version') || '').trim(),
    consent_timestamp: String(data.get('consent_timestamp') || '').trim(),
    consent_source: String(data.get('consent_source') || '').trim(),
    consent_snapshot: String(data.get('consent_snapshot') || '').trim()
  };
  const trackingMeta = getContactTrackingMeta(payload);

  // Fast client-side guard for the most common validation error.
  if (payload.message.length < 10) {
    trackContactFormEvent('contact_form_submit_error', {
      ...trackingMeta,
      error_code: 'invalid-message'
    });
    setFormError(errorMsg, getContactErrorMessage('invalid-message'));
    setSubmitLoading(submitBtn, false);
    return;
  }

  setFormError(errorMsg, '');
  setSubmitLoading(submitBtn, true);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      const errorCode = result && typeof result.error === 'string'
        ? result.error
        : `http-${response.status}`;
      throw new Error(errorCode);
    }

    trackContactFormEvent('contact_form_submit_success', trackingMeta);
    showFormSuccess(form, successMsg);
  } catch (error) {
    console.error('[contact-form]', error);
    const errorCode = typeof error?.message === 'string' ? error.message : '';
    trackContactFormEvent('contact_form_submit_error', {
      ...trackingMeta,
      error_code: errorCode || 'unknown'
    });
    setFormError(errorMsg, getContactErrorMessage(errorCode));
  } finally {
    setSubmitLoading(submitBtn, false);
  }
}

function getContactTrackingMeta(payload = {}) {
  return {
    locale: document.documentElement.lang === 'en' ? 'en' : 'uk',
    service: payload.service || 'unknown',
    has_company: Boolean(payload.company),
    discovery_call: Boolean(payload.discovery_call)
  };
}

function trackContactFormEvent(eventName, eventParams = {}) {
  if (!eventName) return;
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', eventName, eventParams);
  } catch (_error) {
    // Non-blocking by design.
  }
}

function showFormSuccess(form, successMsg) {
  const errorMsg = document.getElementById('form-error');
  const startedAtField = form.querySelector('input[name="form_started_at"]');
  if (errorMsg) {
    setFormError(errorMsg, '');
  }
  form.style.display = 'none';
  successMsg.style.display = 'block';

  // Reset after 8 seconds
  setTimeout(() => {
    form.style.display = 'flex';
    successMsg.style.display = 'none';
    form.reset();
    syncConsentToForm(window.latwoCookieConsent || null);
    if (startedAtField) {
      startedAtField.value = String(Date.now());
    }
  }, 8000);
}

function setFormError(errorElement, message) {
  if (!errorElement) return;
  if (!message) {
    errorElement.style.display = 'none';
    return;
  }
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function setSubmitLoading(button, isLoading) {
  const defaultText = button.querySelector('.btn-text.default');
  const hoverText = button.querySelector('.btn-text.hover');
  if (!defaultText || !hoverText) return;

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = defaultText.textContent.trim();
  }

  const defaultLabel = button.dataset.defaultLabel;
  const loadingLabel = getContactSendingLabel();

  button.disabled = isLoading;
  defaultText.textContent = isLoading ? loadingLabel : defaultLabel;
  hoverText.textContent = isLoading ? loadingLabel : defaultLabel;
}

function getContactSendingLabel() {
  return document.documentElement.lang === 'en' ? 'Sending...' : 'Надсилаємо...';
}

function getContactErrorMessage(errorCode = '') {
  const isEn = document.documentElement.lang === 'en';

  if (errorCode === 'invalid-message') {
    return isEn
      ? 'Please describe your request in at least 10 characters.'
      : 'Опишіть запит щонайменше 10 символами.';
  }

  if (errorCode === 'invalid-email') {
    return isEn
      ? 'Please enter a valid email address.'
      : 'Введіть коректну email-адресу.';
  }

  if (errorCode === 'invalid-name') {
    return isEn
      ? 'Please enter your name (at least 2 characters).'
      : "Введіть ім'я (щонайменше 2 символи).";
  }

  if (errorCode === 'invalid-service') {
    return isEn
      ? 'Please select a service option.'
      : 'Оберіть варіант послуги.';
  }

  if (errorCode === 'rate-limited') {
    return isEn
      ? 'Too many attempts. Please wait a few minutes and try again.'
      : 'Забагато спроб. Зачекайте кілька хвилин і спробуйте знову.';
  }

  if (errorCode === 'payload-too-large') {
    return isEn
      ? 'Your message is too large. Please shorten it and try again.'
      : 'Повідомлення завелике. Скоротіть текст і спробуйте ще раз.';
  }

  if (errorCode === 'forbidden-origin') {
    return isEn
      ? 'Security check failed. Please reload the page and try again.'
      : 'Перевірка безпеки не пройдена. Оновіть сторінку і спробуйте ще раз.';
  }

  return isEn
    ? 'Something went wrong. Please try again or email us at contact@latwo.eu.'
    : 'Сталася помилка під час відправки. Спробуйте ще раз або напишіть нам на contact@latwo.eu.';
}

/* ============================================================
   CHECKLIST DOWNLOAD — placeholder
   ============================================================ */
function initChecklist() {
  const btns = document.querySelectorAll('#checklist-btn, #why-checklist-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll to contact form as fallback
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   PRICING → CONTACT prefill
   ============================================================ */
function initPricingContactPrefill() {
  const serviceSelect = document.querySelector('#contact-form select[name="service"]');
  if (!serviceSelect) return;

  document.querySelectorAll('.pricing-btn[data-service]').forEach(btn => {
    btn.addEventListener('click', () => {
      const serviceValue = btn.getAttribute('data-service');
      if (!serviceValue) return;
      serviceSelect.value = serviceValue;
      serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

/* ============================================================
   TESTIMONIALS HOVER CAROUSEL
   ============================================================ */
function initTestimonialsHoverCarousel() {
  const section = document.getElementById('testimonials');
  if (!section) return;

  const wrapper = section.querySelector('.testimonials-track-wrapper');
  const track = wrapper ? wrapper.querySelector('.testimonials-track') : null;
  if (!wrapper || !track) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let running = true;
  let animating = false;
  let pauseTimer = null;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const getCards = () => Array.from(track.querySelectorAll('.testimonial-card'));

  function markCenterCard(targetIndex = 1) {
    const cards = getCards();
    cards.forEach(card => card.classList.remove('is-center'));
    const centerCard = cards[targetIndex] || cards[1];
    if (centerCard) centerCard.classList.add('is-center');
  }

  function markCenterCardByViewport() {
    const cards = getCards();
    if (!cards.length) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const centerX = wrapperRect.left + wrapperRect.width / 2;
    let bestCard = cards[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - centerX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestCard = card;
      }
    });

    cards.forEach(card => card.classList.remove('is-center'));
    bestCard.classList.add('is-center');
  }

  function nextDurationMs() {
    return 1700 + Math.floor(Math.random() * 450);
  }

  function step() {
    if (!running || animating) return;

    const cards = getCards();
    if (cards.length < 2) return;

    animating = true;
    const firstCard = cards[0];
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.gap || trackStyle.columnGap || '0') || 0;
    const travel = firstCard.offsetWidth + gap;
    const duration = nextDurationMs();

    markCenterCard(2);
    track.style.setProperty('--card-motion-ms', `${duration}ms`);
    track.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.86, 0.32, 1)`;
    track.style.transform = `translate3d(-${travel}px, 0, 0)`;

    const onTransitionEnd = (event) => {
      if (event.propertyName !== 'transform') return;
      track.removeEventListener('transitionend', onTransitionEnd);
      track.style.transition = 'none';
      track.appendChild(firstCard);
      track.style.transform = 'translate3d(0, 0, 0)';
      if (isMobile) {
        markCenterCardByViewport();
      } else {
        markCenterCard();
      }
      animating = false;

      pauseTimer = setTimeout(() => {
        if (!running) return;
        requestAnimationFrame(step);
      }, 500);
    };

    track.addEventListener('transitionend', onTransitionEnd);
  }

  function stop() {
    running = false;
    animating = false;
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
    wrapper.classList.remove('is-animating');
    track.style.transition = 'none';
    track.style.transform = 'translate3d(0, 0, 0)';
    markCenterCard();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
      return;
    }

    if (!running) {
      running = true;
      wrapper.classList.add('is-animating');
      pauseTimer = setTimeout(step, 500);
    }
  });

  wrapper.classList.add('is-animating');
  if (isMobile) {
    requestAnimationFrame(markCenterCardByViewport);
  } else {
    markCenterCard();
  }
  pauseTimer = setTimeout(step, 500);
}

/* ============================================================
   SOCIAL PROOF ROWS — seamless infinite loop (4 cards repeated)
   ============================================================ */
function initSocialProofInfiniteRows() {
  const rows = document.querySelectorAll('#social-proof .reviews-row');
  if (!rows.length) return;

  rows.forEach((row) => {
    if (row.dataset.loopReady === 'true') return;

    const allCards = Array.from(row.querySelectorAll('.review-mini-card'));
    if (allCards.length < 4) return;

    const baseCards = allCards.slice(0, 4);

    // Keep only the original 4 cards in markup; runtime loop uses cloned copies.
    allCards.slice(4).forEach(card => card.remove());

    baseCards.forEach((card) => {
      row.appendChild(card.cloneNode(true));
    });

    row.dataset.loopReady = 'true';
  });
}

/* ============================================================
   SOCIAL PROOF AVATARS — PNG with fallback
   ============================================================ */
function initSocialProofAvatars() {
  // Avatars are now rendered directly in HTML for deterministic behavior.
  // Keep this hook to support cloned cards and ensure lazy-loading stays enabled.
  document.querySelectorAll('#social-proof .review-mini-avatar img').forEach((img) => {
    if (!img.loading) img.loading = 'lazy';
  });
}

window.addEventListener('load', () => {
  try {
    initSocialProofAvatars();
  } catch (error) {
    console.error('[LATWO avatars load error]', error);
  }
});

/* ============================================================
   FOOTER NAV LABELS — keep hover animation text synced
   ============================================================ */
function initFooterNavAnimationLabels() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const selector = '.footer-links-center a, .footer-nav-col ul li a';

  const syncLabels = () => {
    footer.querySelectorAll(selector).forEach(link => {
      const label = (link.textContent || '').trim().replace(/\s+/g, ' ');
      if (!label) return;
      link.setAttribute('data-label', label);
      link.setAttribute('aria-label', label);
    });
  };

  syncLabels();

  const observer = new MutationObserver(() => syncLabels());
  observer.observe(footer, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function slugifyName(name) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ь: '', ю: 'yu', я: 'ya'
  };

  return name
    .toLowerCase()
    .replace(/[’']/g, '')
    .split('')
    .map(char => map[char] !== undefined ? map[char] : char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ============================================================
   SMOOTH SCROLL for anchor links
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const headerHeight = 64;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileNav();
    }
  });
});

/* ============================================================
   PAUSE animations when tab is hidden (performance)
   ============================================================ */
document.addEventListener('visibilitychange', () => {
  const tracks = document.querySelectorAll(
    '.partners-track, .testimonials-track, .reviews-row-left, .reviews-row-right'
  );
  tracks.forEach(track => {
    track.style.animationPlayState = document.hidden ? 'paused' : 'running';
  });
});
