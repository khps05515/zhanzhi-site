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
  const lightboxPlayer = document.getElementById('lightboxPlayer'); // 影片播放器容器（每次開啟建立全新 <video>）
  let lightboxVideo = null;
  let stallTimer = null;
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxClose = lightbox.querySelector('.lightbox__close');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxError = document.getElementById('lightboxError');
  const heroVideo = document.querySelector('.hero__video');

  // 觸控裝置（手機 / 平板）：影片統一在燈箱內以單一播放器播放，
  // 避免 iOS Safari 因頁面上同時存在多個 <video> 而無法解碼（黑屏）。
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  function pauseAllPageVideos() {
    document.querySelectorAll('video').forEach((v) => {
      if (v === lightboxVideo) return;
      try { v.pause(); } catch (e) {}
    });
  }

  let gallery = [];   // array of {src, alt} for image gallery mode
  let galleryIdx = 0;

  function setLightboxOrientation(w, h) {
    lightbox.classList.remove('is-portrait', 'is-square', 'is-landscape');
    if (!w || !h) return;
    const r = w / h;
    if (r < 0.95) lightbox.classList.add('is-portrait');
    else if (r < 1.05) lightbox.classList.add('is-square');
    else lightbox.classList.add('is-landscape');
  }
  function showVideoHint(src, msg) {
    lightboxError.innerHTML = msg + ' <a href="' + src + '" target="_blank" rel="noopener">直接開啟影片</a>。';
    lightboxError.hidden = false;
  }

  function destroyLightboxVideo() {
    if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
    if (!lightboxVideo) return;
    try { lightboxVideo.pause(); } catch (e) {}
    // 依 iOS 建議：清掉來源並 load()，讓 Safari 立刻釋放解碼器與網路連線
    lightboxVideo.removeAttribute('src');
    while (lightboxVideo.firstChild) lightboxVideo.removeChild(lightboxVideo.firstChild);
    try { lightboxVideo.load(); } catch (e) {}
    lightboxVideo.remove();
    lightboxVideo = null;
  }

  function createLightboxVideo(src, poster) {
    destroyLightboxVideo();
    const v = document.createElement('video');
    v.setAttribute('controls', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('preload', 'auto');
    v.setAttribute('x-webkit-airplay', 'allow');
    if (poster) v.setAttribute('poster', poster);
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    v.appendChild(source);

    v.addEventListener('loadedmetadata', () => {
      setLightboxOrientation(v.videoWidth, v.videoHeight);
      if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      lightboxError.hidden = true;
    });
    const onError = () => {
      if (!lightbox.classList.contains('is-video')) return;
      showVideoHint(src, '影片載入失敗，請重新整理後再試，或');
    };
    v.addEventListener('error', onError);
    source.addEventListener('error', onError);

    // 讀取逾時提示：10 秒內連 metadata 都沒拿到，顯示直接開啟的連結（播放器保留，載入完成會自動消失）
    stallTimer = setTimeout(() => {
      stallTimer = null;
      if (lightboxVideo === v && v.readyState < 1) {
        showVideoHint(src, '影片讀取較慢，可以再等一下，或');
      }
    }, 10000);

    lightboxPlayer.appendChild(v);
    lightboxVideo = v;
    return v;
  }

  function openVideoLightbox(src, title, sourceVideo) {
    lightbox.classList.remove('is-image');
    lightbox.classList.add('is-video');
    // 先沿用卡片上已知的方向（或來源影片的尺寸），避免載入前閃一下橫向框
    const fig = sourceVideo && sourceVideo.closest('.show, .service__media');
    if (sourceVideo && sourceVideo.videoWidth) {
      setLightboxOrientation(sourceVideo.videoWidth, sourceVideo.videoHeight);
    } else if (fig && fig.classList.contains('is-portrait')) {
      setLightboxOrientation(9, 16);
    } else if (fig && fig.classList.contains('is-square')) {
      setLightboxOrientation(1, 1);
    } else {
      setLightboxOrientation(16, 9);
    }
    // 釋放其他播放器（含首頁背景影片），iOS 才有足夠解碼資源播放燈箱影片
    pauseAllPageVideos();
    lightboxError.hidden = true;
    lightboxError.textContent = '';
    lightboxImage.src = '';
    lightboxTitle.textContent = title || '';
    // 先用卡片的封面當 poster，載入期間不會出現黑畫面
    const poster = (sourceVideo && sourceVideo.getAttribute('poster')) || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // 每次都建立全新的 <video>（iOS 重複使用同一個元素換 src 時，常會卡在讀取狀態）
    const v = createLightboxVideo(src, poster);
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  function openImageLightbox(items, startIdx) {
    gallery = items;
    galleryIdx = startIdx;
    lightbox.classList.remove('is-video');
    lightbox.classList.add('is-image');
    destroyLightboxVideo();
    lightboxError.hidden = true;
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
    lightbox.classList.remove('is-open', 'is-image', 'is-video', 'is-portrait', 'is-square', 'is-landscape');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    destroyLightboxVideo();
    lightboxError.hidden = true;
    lightboxImage.src = '';
    gallery = [];
    if (heroVideo && heroVideo.paused) heroVideo.play().catch(() => {});
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
    if (isTouch) {
      // 手機：卡片只顯示封面與播放鍵，點任何位置都開燈箱播放
      video.removeAttribute('controls');
      video.setAttribute('preload', 'none');
      // 把影片包進一層容器，播放鍵才能正確置中在影片上（而非整張卡片）
      const frame = document.createElement('div');
      frame.className = 'show__frame';
      video.parentNode.insertBefore(frame, video);
      frame.appendChild(video);
      fig.classList.add('is-tap');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', '播放：' + title);
    }
    fig.addEventListener('click', (e) => {
      if (!isTouch && e.target.tagName === 'VIDEO') return; // 桌機：保留原生控制列
      e.preventDefault();
      const src = video.querySelector('source')?.src || video.src;
      openVideoLightbox(src, title, video);
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

  /* ---------- Student testimonials quote wall ---------- */
  const quotesGrid = document.getElementById('quotesGrid');
  if (quotesGrid && typeof TESTIMONIALS !== 'undefined') {
    const escQ = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const CLIP = 120;
    const INITIAL = 12;

    function buildQuoteCard(t) {
      const card = document.createElement('article');
      card.className = 'quote reveal is-visible';
      const isLong = t.text.length > CLIP + 30;
      const shortText = isLong ? t.text.slice(0, CLIP) + '……' : t.text;
      card.innerHTML =
        '<p class="quote__text">' + escQ(shortText) + '</p>' +
        (isLong ? '<span class="quote__more">展開全文 ↓</span>' : '') +
        '<div class="quote__foot">' +
          '<div class="quote__who"><strong>' + escQ(t.name) + '</strong><small>' + escQ(t.role) + '</small></div>' +
          (t.url
            ? '<a class="quote__fb" href="' + t.url + '" target="_blank" rel="noopener">FB 原文 ↗</a>'
            : '<span class="quote__src">' + escQ(t.source || '學員回饋') + '</span>') +
        '</div>';
      if (isLong) {
        card.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          const open = card.classList.toggle('is-open');
          card.querySelector('.quote__text').textContent = open ? t.text : shortText;
        });
      }
      return card;
    }

    TESTIMONIALS.slice(0, INITIAL).forEach((t) => quotesGrid.appendChild(buildQuoteCard(t)));

    if (TESTIMONIALS.length > INITIAL) {
      const wrap = document.createElement('div');
      wrap.className = 'quotes__morewrap';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--ghost quotes__morebtn';
      btn.textContent = '顯示全部 ' + TESTIMONIALS.length + ' 則口碑 ↓';
      btn.addEventListener('click', () => {
        TESTIMONIALS.slice(INITIAL).forEach((t) => quotesGrid.appendChild(buildQuoteCard(t)));
        wrap.remove();
      });
      wrap.appendChild(btn);
      quotesGrid.insertAdjacentElement('afterend', wrap);
    }
  }

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
