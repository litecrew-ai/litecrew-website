/* litecrew.ai landing page — vanilla JS, no dependencies. */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Theme toggle -------------------------------------------
     Initial theme was already set by the inline head script (no FOUC).
     Here we only handle the toggle + persistence + meta color sync.   */

  var THEME_KEY = "litecrew-theme";
  var themeMeta = doc.querySelector('meta[name="theme-color"]');
  var themeColors = { dark: "#0b0c0f", light: "#faf9f6" };

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", themeColors[theme]);
    var btn = doc.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        /* storage unavailable: session-only toggle */
      }
    }
  }

  var toggle = doc.getElementById("theme-toggle");
  if (toggle) {
    // Sync button state with the theme chosen at boot.
    applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark", false);
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  /* ---------- Copy to clipboard --------------------------------------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for file:// or older browsers.
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      doc.body.appendChild(ta);
      ta.select();
      try {
        doc.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      } finally {
        doc.body.removeChild(ta);
      }
    });
  }

  Array.prototype.forEach.call(
    doc.querySelectorAll("[data-copy]"),
    function (btn) {
      btn.addEventListener("click", function () {
        var target = doc.querySelector(btn.getAttribute("data-copy"));
        if (!target) return;
        var label = btn.querySelector("span");
        copyText(target.textContent.trim()).then(
          function () {
            if (label) label.textContent = "Copied";
            btn.classList.add("copied");
            window.setTimeout(function () {
              if (label) label.textContent = "Copy";
              btn.classList.remove("copied");
            }, 1600);
          },
          function () {
            if (label) label.textContent = "Select";
          }
        );
      });
    }
  );

  /* ---------- Header scroll state ------------------------------------- */

  var header = doc.getElementById("site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll -----------------------------------------
     [data-reveal-group] children are auto-staggered;
     standalone [data-reveal] elements reveal on their own.             */

  var revealables = [];

  Array.prototype.forEach.call(
    doc.querySelectorAll("[data-reveal-group]"),
    function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.setAttribute("data-reveal", "");
        child.style.setProperty("--reveal-delay", Math.min(i * 70, 350) + "ms");
        revealables.push(child);
      });
    }
  );

  Array.prototype.forEach.call(doc.querySelectorAll("[data-reveal]"), function (el) {
    if (revealables.indexOf(el) === -1) revealables.push(el);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) {
      el.classList.add("revealed");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealables.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Videos: muted autoplay only while in view ---------------- */

  var videos = doc.querySelectorAll("[data-autoplay-in-view]");
  if (videos.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var vio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            v.muted = true;
            var p = v.play();
            if (p && typeof p.catch === "function") p.catch(function () {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      },
      { threshold: 0.35 }
    );
    Array.prototype.forEach.call(videos, function (v) {
      vio.observe(v);
    });
  }
})();
