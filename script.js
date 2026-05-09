(() => {
  // Hero video: force iOS-friendly autoplay; if it fails, show static poster
  const heroVideo = document.querySelector('.hero__video');
  const heroSection = document.querySelector('.hero');
  if (heroVideo && heroSection) {
    heroVideo.muted = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.playsInline = true;
    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          heroSection.classList.add('video-failed');
        });
      }
    };
    if (heroVideo.readyState >= 2) tryPlay();
    else heroVideo.addEventListener('loadeddata', tryPlay, { once: true });
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  }

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav__links');

  // Sticky nav style on scroll
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  navToggle?.addEventListener('click', () => {
    const open = navToggle.classList.toggle('is-open');
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle?.classList.remove('is-open');
      navLinks.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Reveal on scroll
  const targets = document.querySelectorAll(
    '.manifesto__inner, .material__text, .material__media, .origem__main, .origem__quote, .projetos__head, .produto, .contato__inner'
  );
  targets.forEach(el => el.classList.add('reveal'));

  document.querySelectorAll('.produto').forEach((el, i) => {
    el.style.setProperty('--reveal-index', i % 3);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-visible'));
  }

  // Back-to-top button
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggle = () => {
      if (window.scrollY > 600) backToTop.classList.add('is-visible');
      else backToTop.classList.remove('is-visible');
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Active nav link based on scroll position
  const sections = ['#projetos', '#origem', '#material', '#contato']
    .map(sel => document.querySelector(sel))
    .filter(Boolean);
  const navLinkMap = new Map();
  document.querySelectorAll('.nav__links a').forEach(a => {
    const id = a.getAttribute('href');
    if (id?.startsWith('#')) navLinkMap.set(id.slice(1), a);
  });
  if (sections.length && navLinkMap.size && 'IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = navLinkMap.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinkMap.forEach(l => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(s => navIO.observe(s));
  }

  // Lightbox + Produtos
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbCap = lightbox.querySelector('.lightbox__caption');
    let zoomed = false;

    const setOrigin = (e) => {
      const rect = lbImg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      lbImg.style.transformOrigin = `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
    };

    const resetZoom = () => {
      zoomed = false;
      lbImg.classList.remove('is-zoomed');
      lbImg.style.transformOrigin = '';
    };

    const openLb = (src, alt, caption) => {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCap.textContent = caption || '';
      resetZoom();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
    };

    const closeLb = () => {
      resetZoom();
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
    };

    document.querySelectorAll('[data-product]').forEach(card => {
      card.addEventListener('click', () => {
        const img = card.querySelector('img');
        if (!img) return;
        const title = card.querySelector('.produto__title')?.textContent.trim();
        openLb(img.src, img.alt, title);
      });
    });

    lbImg.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomed = !zoomed;
      if (zoomed) {
        setOrigin(e);
        lbImg.classList.add('is-zoomed');
      } else {
        resetZoom();
      }
    });

    lbImg.addEventListener('mousemove', (e) => {
      if (zoomed) setOrigin(e);
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target !== lbImg) closeLb();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLb();
    });
  }

  // Form modal
  const formModal = document.getElementById('formModal');
  if (formModal) {
    const openBtns = document.querySelectorAll('[data-open-form]');
    const closeBtn = formModal.querySelector('.form-modal__close');
    const panel = formModal.querySelector('.form-modal__panel');
    const orcForm = formModal.querySelector('[data-orcamento]');

    const openModal = () => {
      formModal.classList.add('is-open');
      formModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('fm-open');
      const first = panel.querySelector('input, textarea');
      setTimeout(() => first?.focus(), 350);
    };
    let lastTrigger = null;
    const closeModal = () => {
      formModal.classList.remove('is-open');
      formModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fm-open');
      lastTrigger?.focus();
    };

    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        lastTrigger = btn;
        openModal();
      });
    });
    closeBtn?.addEventListener('click', closeModal);
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && formModal.classList.contains('is-open')) closeModal();
    });

    orcForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const submit = orcForm.querySelector('button[type="submit"]');
      submit.textContent = 'Enviado';
      submit.disabled = true;
      setTimeout(closeModal, 1200);
    });
  }

  // Newsletter (visual feedback only — wire to backend later)
  const nlForm = document.querySelector('[data-newsletter]');
  if (nlForm) {
    nlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = nlForm.querySelector('input');
      const btn = nlForm.querySelector('button');
      if (!input.value || !input.checkValidity()) {
        input.focus();
        return;
      }
      btn.textContent = 'Inscrito';
      input.value = '';
    });
  }

  // Stats count-up animation
  const stats = document.querySelectorAll('.manifesto__stat [data-count]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stats.length && !reducedMotion && 'IntersectionObserver' in window) {
    const formatNum = (n, format) => {
      const v = Math.round(n);
      return format === 'thousands' ? v.toLocaleString('pt-BR') : v.toString();
    };
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const format = el.dataset.format;
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = prefix + formatNum(target * easeOut(p), format) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const statsIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          statsIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(el => {
      el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
      statsIO.observe(el);
    });
  }

  // Year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
