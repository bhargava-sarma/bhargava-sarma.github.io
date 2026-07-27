(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -- Nav: add a hairline under the bar once the page scrolls --
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (window.scrollY > 8) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -- Mobile menu toggle --
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // -- Scroll-triggered reveals --
  var revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // -- Marquee: JS-driven loop. Clones the content group enough times
  //    to guarantee the track is always at least 2x the viewport width,
  //    so there is always a full group waiting off-screen when the
  //    position wraps -- this is what makes the loop truly seamless
  //    regardless of screen width, zoom level, or content length --
  var track = document.querySelector('.marquee__track');
  if (track) {
    var groupWidth = 0;
    var x = 0;
    var speed = 40; // px per second
    var lastTime = null;
    var paused = false;

    function ensureCoverage() {
      var baseGroup = track.querySelector('.marquee__group');
      if (!baseGroup) return;
      var viewportWidth = window.innerWidth;
      var needed = viewportWidth * 2.5;

      // Remove any previously added clones before recalculating,
      // so resizing to a smaller width doesn't leave excess clones.
      track.querySelectorAll('.marquee__group[data-clone="true"]').forEach(function (el) {
        el.remove();
      });

      var singleWidth = baseGroup.getBoundingClientRect().width;
      if (singleWidth <= 0) return;

      var totalWidth = singleWidth;
      while (totalWidth < needed) {
        var clone = baseGroup.cloneNode(true);
        clone.setAttribute('data-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
        totalWidth += singleWidth;
      }

      groupWidth = singleWidth;
      // If a re-measure lands mid-animation with the old x already past
      // the new groupWidth, normalize it so the next frame doesn't skip.
      if (groupWidth > 0) {
        x = x % groupWidth;
      }
    }

    function step(now) {
      if (lastTime === null) lastTime = now;
      var dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!paused && groupWidth > 0) {
        x -= speed * dt;
        if (Math.abs(x) >= groupWidth) x += groupWidth;
        track.style.transform = 'translateX(' + x + 'px)';
      }
      requestAnimationFrame(step);
    }

    ensureCoverage();

    // Fonts load asynchronously; if the marquee measures itself before
    // JetBrains Mono swaps in, groupWidth is captured against the
    // fallback font's metrics and never corrected, since a resize event
    // may never fire during a normal viewing session. Re-measure once
    // the real font is actually ready.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        ensureCoverage();
      });
    }
    window.addEventListener('load', ensureCoverage);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(ensureCoverage, 150);
    }, { passive: true });

    var marqueeEl = document.querySelector('.marquee');
    if (marqueeEl) {
      marqueeEl.addEventListener('mouseenter', function () { paused = true; });
      marqueeEl.addEventListener('mouseleave', function () { paused = false; });
    }

    if (prefersReducedMotion) {
      track.style.transform = 'translateX(0)';
    } else {
      requestAnimationFrame(step);
    }
  }

  // -- Back to top: scrolls the window directly; hash navigation is
  //    prevented entirely so there is no race with native anchor jump --
  var topLinks = document.querySelectorAll('a[href="#top"]');
  topLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  // -- Email: assembled from data attributes and copied on click, not exposed as a mailto link --
  var emailBtn = document.getElementById('emailBtn');
  var emailHint = document.getElementById('emailHint');
  if (emailBtn && emailHint) {
    var defaultHint = emailHint.textContent;
    emailBtn.addEventListener('click', function () {
      var address = emailBtn.dataset.user + '@' + emailBtn.dataset.domain;
      function showCopied() {
        emailHint.textContent = 'Copied to clipboard';
        emailHint.classList.add('is-copied');
        setTimeout(function () {
          emailHint.textContent = defaultHint;
          emailHint.classList.remove('is-copied');
        }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(showCopied).catch(function () {
          window.location.href = 'mailto:' + address;
        });
      } else {
        window.location.href = 'mailto:' + address;
      }
    });
  }
})();
