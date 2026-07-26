 (function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  var track = document.querySelector('.marquee__track');
  if (track) {
    var groupWidth = 0;
    var x = 0;
    var speed = 40;
    var lastTime = null;
    var paused = false;

    function measure() {
      var firstGroup = track.querySelector('.marquee__group');
      groupWidth = firstGroup ? firstGroup.getBoundingClientRect().width : 0;
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

    measure();
    window.addEventListener('resize', measure, { passive: true });

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
