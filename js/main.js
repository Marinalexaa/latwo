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
    '.partners-track, .testimonials-track, .reviews-row-1, .reviews-row-2, .reviews-row-3'
  );
  tracks.forEach(track => {
    track.style.animationPlayState = document.hidden ? 'paused' : 'running';
  });
});
