/* ============================================================
   LATWO — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScrollReveal();
  initScrollZoom();
  initLangSwitcher();
  initMobileNav();
  initFAQ();
  initContactForm();
  initChecklist();
  initPricingContactPrefill();
  initTestimonialsHoverCarousel();
  initSocialProofAvatars();
  initFooterNavAnimationLabels();
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
  const switcher = document.getElementById('lang-switcher');
  const dropdown = document.getElementById('lang-dropdown');
  if (!switcher || !dropdown) return;

  switcher.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (nav) nav.classList.toggle('open');
}

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (nav) nav.classList.remove('open');
}

/* ============================================================
   MOBILE NAV INIT
   ============================================================ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    toggleMobileNav();
  });
  document.querySelectorAll('.mobile-nav-close').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileNav();
      hamburger.classList.remove('open');
    });
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

  let running = false;
  let animating = false;
  let moveTimer = null;
  let pauseTimer = null;

  const getCards = () => Array.from(track.querySelectorAll('.testimonial-card'));

  function clearTimers() {
    if (moveTimer) {
      clearTimeout(moveTimer);
      moveTimer = null;
    }
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
  }

  function markCenterCard(targetIndex = 1) {
    const cards = getCards();
    cards.forEach(card => card.classList.remove('is-center'));
    const centerCard = cards[targetIndex] || cards[1];
    if (centerCard) centerCard.classList.add('is-center');
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
      markCenterCard();
      animating = false;

      pauseTimer = setTimeout(() => {
        if (!running) return;
        requestAnimationFrame(step);
      }, 200);
    };

    track.addEventListener('transitionend', onTransitionEnd);
  }

  function start() {
    if (running) return;
    running = true;
    wrapper.classList.add('is-animating');
    markCenterCard();
    pauseTimer = setTimeout(step, 500);
  }

  function stop() {
    running = false;
    animating = false;
    clearTimers();
    wrapper.classList.remove('is-animating');
    track.style.transition = 'none';
    track.style.transform = 'translate3d(0, 0, 0)';
    markCenterCard();
  }

  section.addEventListener('mouseenter', start);
  section.addEventListener('mouseleave', stop);
  section.addEventListener('focusin', start);
  section.addEventListener('focusout', stop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });

  markCenterCard();
}

/* ============================================================
   SOCIAL PROOF AVATARS — PNG with fallback
   ============================================================ */
function initSocialProofAvatars() {
  const cards = document.querySelectorAll('#social-proof .review-mini-card');
  if (!cards.length) return;

  const imagePrefix = window.location.pathname.includes('/en/') ? '../' : '';
  const fallbackPool = [
    `${imagePrefix}images/testimonial-andrii.png`,
    `${imagePrefix}images/testimonial-dmytro.png`,
    `${imagePrefix}images/testimonial-oksana.png`,
    `${imagePrefix}images/testimonial-kostiantyn.png`
  ];

  cards.forEach((card, index) => {
    const avatar = card.querySelector('.review-mini-avatar');
    const nameEl = card.querySelector('.review-mini-name');
    if (!avatar) return;

    const rawName = (nameEl ? nameEl.textContent : '').trim();
    if (!rawName) return;

    const parts = rawName.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(part => part[0]).join('').toUpperCase() || rawName[0].toUpperCase();
    const slug = slugifyName(rawName);
    const preferredSrc = `${imagePrefix}images/testimonial-${slug}.png`;
    const fallbackSrc = fallbackPool[index % fallbackPool.length];

    avatar.textContent = initials;

    const img = document.createElement('img');
    img.alt = rawName;
    img.loading = 'lazy';
    img.src = preferredSrc;
    let usingFallback = false;
    img.onerror = () => {
      if (usingFallback) return;
      usingFallback = true;
      img.src = fallbackSrc;
    };
    img.onload = () => {
      avatar.textContent = '';
      avatar.appendChild(img);
    };
  });
}

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
