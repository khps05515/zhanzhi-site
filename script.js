/* 湛智有限公司官方網站 — 互動腳本 */

(function () {
  'use strict';

  /* ---------- Nav scroll state ---------- */
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');

  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 60);
    // Keep nav transparent over hero
    if (hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight - 80;
      nav.classList.toggle('is-hero', y < heroBottom);
    }
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav__links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => navLinks.classList.remove('is-open'))
    );
  }

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(
    '.section__head, .pain__card, .service, .module, .show, .process__list li, .about__photo, .about__copy, .contact__list li, .industries'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Service preview videos: hover-to-play on desktop ---------- */
  document.querySelectorAll('.service__media video').forEach((vid) => {
    const card = vid.closest('.service');
    if (!card) return;

    card.addEventListener('mouseenter', () => {
      vid.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      vid.pause();
      try { vid.currentTime = 0; } catch (e) {}
    });

    // Touch devices: autoplay muted when intersecting
    if ('IntersectionObserver' in window && window.matchMedia('(hover: none)').matches) {
      const playObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) vid.play().catch(() => {});
            else vid.pause();
          });
        },
        { threshold: 0.5 }
      );
      playObserver.observe(card);
    }
  });

  /* ---------- Lightbox for showcase videos ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxClose = lightbox.querySelector('.lightbox__close');

  function openLightbox(src, title) {
    lightboxVideo.src = src;
    lightboxTitle.textContent = title || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxVideo.play().catch(() => {});
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxVideo.pause();
    lightboxVideo.src = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

  document.querySelectorAll('.show').forEach((fig) => {
    const video = fig.querySelector('video');
    const title = fig.dataset.title || '';
    if (!video) return;
    fig.addEventListener('click', (e) => {
      // Allow native controls when interacting with them
      if (e.target.tagName === 'VIDEO') return;
      e.preventDefault();
      const src = video.querySelector('source')?.src || video.src;
      openLightbox(src, title);
    });
  });

  /* ---------- Auto-detect video orientation (safety net) ---------- */
  function applyOrientationClass(video) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const target = video.closest('.show') || video.closest('.service__media');
    if (!target) return;
    // Strip any prior orientation class then set the correct one
    target.classList.remove('is-portrait', 'is-square');
    const r = w / h;
    if (r < 0.95) target.classList.add('is-portrait');
    else if (r < 1.05) target.classList.add('is-square');
  }
  document.querySelectorAll('.show video, .service__media video').forEach((v) => {
    if (v.readyState >= 1) {
      applyOrientationClass(v);
    } else {
      v.addEventListener('loadedmetadata', () => applyOrientationClass(v), { once: true });
    }
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
