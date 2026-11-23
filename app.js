/* ==========================================================================
   Wentworth C of E Junior & Infant School — Interactive Mockup Logic (Refined)
   Implements modern-web-guidance fallbacks for:
   - light-dismiss-a-dialog
   - shrinking-header-on-scroll
   - navigation-drawer
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Shrinking Header Fallback & Direction-Aware Mobile Scroll-to-Top */
  const header = document.getElementById('site-header');
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const supportsScrollTimeline = CSS.supports(
    '(animation-timeline: scroll()) and (animation-range: 0% 100%)'
  );
  let lastScrollY = window.scrollY;

  function syncScrollUI() {
    const scrollY = window.scrollY;
    const isMobile = window.innerWidth <= 680;
    const scrollingUp = scrollY < lastScrollY;

    if (scrollTopBtn) {
      // On mobile, only show scroll-to-top when scrolling up so it never covers content while reading down
      const showBtn = isMobile ? scrollY > 520 && scrollingUp : scrollY > 420;
      scrollTopBtn.classList.toggle('is-visible', showBtn);
    }

    if (!supportsScrollTimeline && header) {
      const initialHeight = isMobile ? 74 : 92;
      const finalHeight = isMobile ? 64 : 68;
      const scrollDistance = 140;
      const pct = Math.min(1, scrollY / scrollDistance);
      const newHeight = initialHeight - (initialHeight - finalHeight) * pct;
      header.style.height = `${newHeight}px`;
      header.classList.toggle('is-scrolled', scrollY > 24);
      document.documentElement.style.scrollPaddingTop = `${Math.round(newHeight)}px`;
    }

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', syncScrollUI, { passive: true });
  syncScrollUI();

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* 2. Light-Dismiss Modal Dialogs (modern-web-guidance: light-dismiss-a-dialog) */
  const modalDialogs = document.querySelectorAll('dialog.modal-dialog');

  document.querySelectorAll('[data-open-dialog]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-open-dialog');
      const dialog = document.getElementById(targetId);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    modalDialogs.forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    });
  }

  const visitForm = document.getElementById('visit-form');
  const visitConfirmation = document.getElementById('visit-confirmation');
  if (visitForm && visitConfirmation) {
    visitForm.addEventListener('submit', (event) => {
      event.preventDefault();
      visitConfirmation.style.display = 'block';
      visitForm.reset();
    });
  }

  /* 3. Mobile Navigation Drawer (modern-web-guidance: navigation-drawer) */
  const drawer = document.getElementById('drawer');
  const drawerOpenBtn = document.getElementById('drawer-open');
  const drawerCloseBtn = document.getElementById('drawer-close');
  const drawerScroller = drawer ? drawer.querySelector('.Drawer-scroller') : null;
  const drawerSheet = drawer ? drawer.querySelector('.Drawer-sheet') : null;

  if (drawer && drawerOpenBtn && drawerCloseBtn && drawerScroller && drawerSheet) {
    async function openDrawer() {
      drawer.showModal();
      if (!CSS.supports('scroll-initial-target', 'nearest')) {
        drawerScroller.scrollTo({ left: drawerScroller.offsetWidth, behavior: 'instant' });
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );
      }
      drawerScroller.scrollTo({ left: 0, behavior: 'auto' });
    }

    function closeDrawer() {
      drawerScroller.scrollTo({ left: drawerScroller.offsetWidth, behavior: 'auto' });
    }

    function onDrawerOpened() {
      drawerOpenBtn.setAttribute('aria-expanded', 'true');
    }

    function onDrawerClosed() {
      if (drawer.open) drawer.close();
      drawerOpenBtn.setAttribute('aria-expanded', 'false');
    }

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);
    const drawerObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio < visibleThreshold) onDrawerClosed();
        if (entry.intersectionRatio === 1) onDrawerOpened();
      },
      { root: drawer, threshold: [visibleThreshold, 1] }
    );
    drawerObserver.observe(drawerSheet);

    if (!CSS.supports('animation-timeline: scroll()')) {
      drawerScroller.addEventListener('scroll', () => {
        const width = drawerSheet.offsetWidth || 1;
        const ratio = Math.max(0, Math.min(1, 1 - drawerScroller.scrollLeft / width));
        drawer.style.setProperty('--drawer-backdrop', String(ratio));
      });
    }

    drawerOpenBtn.addEventListener('click', openDrawer);
    drawerCloseBtn.addEventListener('click', closeDrawer);

    drawer.addEventListener('click', (event) => {
      if (!drawerSheet.contains(event.target)) closeDrawer();
    });

    drawer.addEventListener('cancel', (event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeDrawer();
      }
    });

    drawer.querySelectorAll('[data-drawer-link]').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  /* 4. Interactive Upcoming Events Month Filter */
  const filterPills = document.querySelectorAll('[data-event-filter]');
  const eventRows = document.querySelectorAll('#events-list .event-row');

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const selected = pill.getAttribute('data-event-filter');
      filterPills.forEach((p) => p.classList.toggle('is-active', p === pill));
      eventRows.forEach((row) => {
        const match = selected === 'all' || row.getAttribute('data-month') === selected;
        row.style.display = match ? 'flex' : 'none';
      });
    });
  });

  /* 5. Interactive Classes & School Day Tabs */
  const tabButtons = document.querySelectorAll('.tab-btn[role="tab"]');
  const tabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');

  function activateTab(tabKey) {
    tabButtons.forEach((btn) => {
      const isSelected = btn.getAttribute('data-tab') === tabKey;
      btn.setAttribute('aria-selected', String(isSelected));
    });
    tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== `panel-${tabKey}`;
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.getAttribute('data-tab')));
  });

  document.querySelectorAll('[data-open-tab]').forEach((link) => {
    link.addEventListener('click', () => {
      const key = link.getAttribute('data-open-tab');
      if (key) activateTab(key);
    });
  });

  /* 6. Staff Carousel Controls & Pagination Dots */
  const staffTrack = document.getElementById('staff-track');
  const staffPrev = document.getElementById('staff-prev');
  const staffNext = document.getElementById('staff-next');
  const staffDotsWrap = document.getElementById('staff-dots');

  if (staffTrack && staffDotsWrap) {
    const cards = Array.from(staffTrack.querySelectorAll('.staff-card'));
    const totalPages = Math.max(1, Math.ceil(cards.length / 3));

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `carousel-dot${i === 0 ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Show staff group ${i + 1}`);
      dot.addEventListener('click', () => {
        staffTrack.scrollTo({ left: i * staffTrack.clientWidth, behavior: 'smooth' });
      });
      staffDotsWrap.appendChild(dot);
    }

    const dots = Array.from(staffDotsWrap.querySelectorAll('.carousel-dot'));

    function updateActiveDot() {
      const maxScroll = Math.max(1, staffTrack.scrollWidth - staffTrack.clientWidth);
      const progress = staffTrack.scrollLeft / maxScroll;
      const idx = Math.round(progress * (dots.length - 1));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }

    staffTrack.addEventListener('scroll', updateActiveDot, { passive: true });

    if (staffPrev) {
      staffPrev.addEventListener('click', () => {
        staffTrack.scrollBy({ left: -staffTrack.clientWidth * 0.9, behavior: 'smooth' });
      });
    }
    if (staffNext) {
      staffNext.addEventListener('click', () => {
        staffTrack.scrollBy({ left: staffTrack.clientWidth * 0.9, behavior: 'smooth' });
      });
    }
  }

  /* 7. Scroll-Triggered Count-Up Animation for Numeric Highlights */
  const countEls = document.querySelectorAll('[data-count-to]');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && countEls.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.getAttribute('data-count-to'));
          if (!Number.isFinite(target)) return;
          const start = target > 100 ? target - 60 : 0;
          const duration = 850;
          const startTime = performance.now();

          function tick(now) {
            const elapsed = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - elapsed, 3);
            el.textContent = String(Math.round(start + (target - start) * eased));
            if (elapsed < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          obs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    countEls.forEach((el) => counterObserver.observe(el));
  }
})();
