document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 900px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cursor = document.getElementById('cursor');
  const flower = document.getElementById('flower');
  const hero = document.getElementById('hero');

  // ---------- Плавное появление секций ----------
  const revealSections = document.querySelectorAll('[data-reveal]');

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -6% 0px'
    });

    revealSections.forEach((section) => {
      // Скрываются только секции ниже текущего экрана. Без JS контент виден всегда.
      if (section.getBoundingClientRect().top > window.innerHeight * 0.9) {
        section.classList.add('reveal-pending');
      }
      revealObserver.observe(section);
    });
  }

  // ---------- Кастомный курсор: только для мыши ----------
  if (cursor && !mobileLayout.matches && finePointer.matches && !reduceMotion.matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    const animateCursor = () => {
      cursorX += (mouseX - cursorX) * 0.25;
      cursorY += (mouseY - cursorY) * 0.25;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }, { passive: true });

    const interactiveSelectors = 'a, button, video, [data-hover]';

    document.addEventListener('mouseover', (event) => {
      if (event.target.closest(interactiveSelectors)) {
        document.body.classList.add('hover-link');
      }
    });

    document.addEventListener('mouseout', (event) => {
      if (!event.relatedTarget || !event.relatedTarget.closest(interactiveSelectors)) {
        document.body.classList.remove('hover-link');
      }
    });

    animateCursor();
  }

  // ---------- Параллакс цветка: только для мыши ----------
  const resetFlower = () => {
    if (flower) flower.style.transform = 'translate3d(0, 0, 0) rotateX(0) rotateY(0)';
  };

  if (hero && flower) {
    hero.addEventListener('mousemove', (event) => {
      if (mobileLayout.matches || !finePointer.matches || reduceMotion.matches) return;

      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const maxShift = Math.min(14, rect.width / 100);

      flower.style.transform = `
        translate3d(${x * maxShift}px, ${y * maxShift}px, 0)
        rotateX(${-y * 11}deg)
        rotateY(${x * 11}deg)
      `;
    }, { passive: true });

    hero.addEventListener('mouseleave', resetFlower);
    mobileLayout.addEventListener('change', resetFlower);
    reduceMotion.addEventListener('change', resetFlower);
    finePointer.addEventListener('change', resetFlower);
  }

  // ---------- Анимация фотографии и цветов ----------
  const photoImg = document.getElementById('photoImg');
  const photoFlowers = document.getElementById('photoFlowers');
  const aboutSection = document.getElementById('about');
  let aboutTicking = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const updateAboutAnimation = () => {
    if (!aboutSection || !photoImg || mobileLayout.matches) return;

    const rect = aboutSection.getBoundingClientRect();
    // Все исходные смещения рассчитаны для макета 1920px и масштабируются вместе с ним.
    const scale = rect.width / 1920;

    if (reduceMotion.matches) {
      photoImg.style.transform = 'none';
      if (photoFlowers) {
        photoFlowers.style.opacity = '1';
        photoFlowers.style.transform = `translate(${-18 * scale}px, ${-18 * scale}px) rotate(5deg) scale(1.05)`;
      }
      return;
    }

    const start = window.innerHeight * 0.85;
    const end = window.innerHeight * 0.2;
    const progress = clamp((start - rect.top) / (start - end), 0, 1);
    const ease = progress * progress * (3 - 2 * progress);

    photoImg.style.transform = `translate3d(0, ${ease * 12 * scale}px, 0) rotate(${ease * -8.5}deg)`;

    if (photoFlowers) {
      const flowersScale = 0.5 + ease * 0.55;
      const flowersRotate = 12 - ease * 7;
      const flowersY = (20 - ease * 38) * scale;
      const flowersX = (10 - ease * 28) * scale;

      photoFlowers.style.opacity = String(ease);
      photoFlowers.style.transform = `
        translate3d(${flowersX}px, ${flowersY}px, 0)
        rotate(${flowersRotate}deg)
        scale(${flowersScale})
      `;
    }
  };

  const requestAboutUpdate = () => {
    if (aboutTicking) return;
    aboutTicking = true;
    requestAnimationFrame(() => {
      updateAboutAnimation();
      aboutTicking = false;
    });
  };

  window.addEventListener('scroll', requestAboutUpdate, { passive: true });
  window.addEventListener('resize', requestAboutUpdate, { passive: true });
  reduceMotion.addEventListener('change', requestAboutUpdate);
  updateAboutAnimation();

  // ---------- Видео: воспроизведение только в видимой области ----------
  const video = document.getElementById('portfolioVideo');

  if (video && !reduceMotion.matches && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // muted разрешает автозапуск на мобильных; звук можно включить в плеере.
          video.play().catch(() => {
            // Если браузер запретил автозапуск, остаются штатные элементы управления.
          });
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });

    videoObserver.observe(video);
  }
});
