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

  /* ---------- Lightbox (videos + image gallery) ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxClose = lightbox.querySelector('.lightbox__close');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let gallery = [];   // array of {src, alt} for image gallery mode
  let galleryIdx = 0;

  function openVideoLightbox(src, title) {
    lightbox.classList.remove('is-image');
    lightbox.classList.add('is-video');
    lightboxVideo.src = src;
    lightboxImage.src = '';
    lightboxTitle.textContent = title || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxVideo.play().catch(() => {});
  }

  function openImageLightbox(items, startIdx) {
    gallery = items;
    galleryIdx = startIdx;
    lightbox.classList.remove('is-video');
    lightbox.classList.add('is-image');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    renderGalleryFrame();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function renderGalleryFrame() {
    if (!gallery.length) return;
    const it = gallery[galleryIdx];
    lightboxImage.src = it.src;
    lightboxImage.alt = it.alt || '';
    lightboxTitle.textContent = `${galleryIdx + 1} / ${gallery.length}`;
  }

  function navGallery(delta) {
    if (!gallery.length) return;
    galleryIdx = (galleryIdx + delta + gallery.length) % gallery.length;
    renderGalleryFrame();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open', 'is-image', 'is-video');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxImage.src = '';
    gallery = [];
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); navGallery(-1); });
  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); navGallery(1); });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxImage.parentElement) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (lightbox.classList.contains('is-image')) {
      if (e.key === 'ArrowLeft') navGallery(-1);
      else if (e.key === 'ArrowRight') navGallery(1);
    }
  });

  /* Showcase videos → open in lightbox */
  document.querySelectorAll('.show').forEach((fig) => {
    const video = fig.querySelector('video');
    const title = fig.dataset.title || '';
    if (!video) return;
    fig.addEventListener('click', (e) => {
      if (e.target.tagName === 'VIDEO') return; // allow native controls
      e.preventDefault();
      const src = video.querySelector('source')?.src || video.src;
      openVideoLightbox(src, title);
    });
  });

  /* Event gallery → open in image-mode lightbox with prev/next */
  const eventFigures = Array.from(document.querySelectorAll('#eventsGrid .event'));
  if (eventFigures.length) {
    const items = eventFigures.map((fig) => {
      const img = fig.querySelector('img');
      return { src: img?.src || '', alt: img?.alt || '' };
    });
    eventFigures.forEach((fig, idx) => {
      fig.addEventListener('click', (e) => {
        e.preventDefault();
        openImageLightbox(items, idx);
      });
    });
  }

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

  /* ---------- Journal teaser (latest 3 posts on home page) ---------- */
  const teaserGrid = document.getElementById('journalTeaser');
  if (teaserGrid && typeof JOURNAL_POSTS !== 'undefined') {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    JOURNAL_POSTS.slice(0, 3).forEach((post) => {
      const text = post.body.join(' ');
      const excerpt = text.length > 90 ? text.slice(0, 90) + '……' : text;
      const a = document.createElement('a');
      a.className = 'jteaser reveal';
      a.href = 'journal.html';
      a.innerHTML =
        '<span class="jteaser__date">' + post.date.replace(/-/g, '.') + '</span>' +
        '<h3 class="jteaser__title">' + esc(post.title) + '</h3>' +
        '<p class="jteaser__excerpt">' + esc(excerpt) + '</p>' +
        '<span class="jteaser__more">閱讀全文 →</span>';
      teaserGrid.appendChild(a);
      a.classList.add('is-visible');
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
