/* ============================================================
   LATWO — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const initSteps = [
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
   CONTACT FORM — submit via EmailJS / fallback mailto
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', submitForm);
}

function submitForm(e) {
  e.preventDefault();
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  if (!form || !successMsg) return;

  const data = new FormData(form);
  const name = data.get('name') || '';
  const email = data.get('email') || '';
  const company = data.get('company') || '';
  const service = data.get('service') || '';
  const message = data.get('message') || '';
  const discovery = data.get('discovery_call') ? 'Так' : 'Ні';

  // Build mailto link as fallback
  const subject = encodeURIComponent(`Нова заявка від ${name} — Latwo`);
  const body = encodeURIComponent(
    `Ім'я: ${name}\nEmail: ${email}\nКомпанія: ${company}\nПослуга: ${service}\nПовідомлення: ${message}\nБезкоштовна консультація: ${discovery}`
  );
  const mailtoLink = `mailto:latwo.eu@gmail.com?subject=${subject}&body=${body}`;

  // Try EmailJS if available, otherwise use mailto
  if (typeof emailjs !== 'undefined') {
    const templateParams = {
      from_name: name,
      from_email: email,
      company: company,
      service: service,
      message: message,
      discovery_call: discovery,
      to_email: 'latwo.eu@gmail.com'
    };

    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
      .then(() => {
        showFormSuccess(form, successMsg);
      })
      .catch(() => {
        // Fallback to mailto
        window.location.href = mailtoLink;
        showFormSuccess(form, successMsg);
      });
  } else {
    // Direct mailto fallback
    window.location.href = mailtoLink;
    showFormSuccess(form, successMsg);
  }
}

function showFormSuccess(form, successMsg) {
  form.style.display = 'none';
  successMsg.style.display = 'block';

  // Reset after 8 seconds
  setTimeout(() => {
    form.style.display = 'flex';
    successMsg.style.display = 'none';
    form.reset();
  }, 8000);
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
