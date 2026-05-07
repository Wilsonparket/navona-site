(() => {
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
    '.manifesto__inner, .material__text, .material__media, .origem__head, .origem__grid, .projetos__head, .gallery__item, .aplicacoes__head, .app, .contato__inner'
  );
  targets.forEach(el => el.classList.add('reveal'));

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

  // Carousel
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const viewport = carousel.querySelector('[data-viewport]');
    const slides = viewport.querySelectorAll('.carousel__slide');

    const slideStep = () => {
      if (slides.length < 2) return slides[0]?.getBoundingClientRect().width || 0;
      const a = slides[0].getBoundingClientRect().left;
      const b = slides[1].getBoundingClientRect().left;
      return b - a;
    };

    const atEnd = () =>
      viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1;

    const advance = () => {
      if (atEnd()) viewport.scrollTo({ left: 0, behavior: 'smooth' });
      else viewport.scrollBy({ left: slideStep(), behavior: 'smooth' });
    };

    // Auto-scroll
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoTimer = null;
    let resumeTimer = null;
    const INTERVAL = 4000;

    const play = () => {
      if (reduced) return;
      pause();
      autoTimer = setInterval(advance, INTERVAL);
    };
    const pause = () => {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    };
    const resumeLater = (delay = 6000) => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(play, delay);
    };

    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', play);
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', play);
    viewport.addEventListener('touchstart', () => { pause(); resumeLater(); }, { passive: true });

    // Mouse drag-to-scroll
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragMoved = false;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartScroll = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(e.pointerId);
      pause();
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 8) dragMoved = true;
      viewport.scrollLeft = dragStartScroll - dx;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (e?.pointerId != null) viewport.releasePointerCapture?.(e.pointerId);
      const step = slideStep() || 1;
      const targetIdx = Math.round(viewport.scrollLeft / step);
      viewport.scrollTo({ left: targetIdx * step, behavior: 'smooth' });
      resumeLater();
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);
    viewport.addEventListener('click', (e) => {
      if (dragMoved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // Pause when off-screen
    if ('IntersectionObserver' in window) {
      const seen = new IntersectionObserver((entries) => {
        entries.forEach(e => { e.isIntersecting ? play() : pause(); });
      }, { threshold: 0.2 });
      seen.observe(carousel);
    } else {
      play();
    }

    // Lightbox
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
        pause();
      };

      const closeLb = () => {
        resetZoom();
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lb-open');
        play();
      };

      slides.forEach(slide => {
        slide.style.cursor = 'zoom-in';
        slide.addEventListener('click', () => {
          if (dragMoved) return;
          const img = slide.querySelector('img');
          if (!img) return;
          const title = slide.querySelector('.carousel__title')?.textContent.trim();
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
  }

  // Form modal
  const formModal = document.getElementById('formModal');
  if (formModal) {
    const openBtn = document.querySelector('[data-open-form]');
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
    const closeModal = () => {
      formModal.classList.remove('is-open');
      formModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fm-open');
      openBtn?.focus();
    };

    openBtn?.addEventListener('click', openModal);
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

  // Year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
