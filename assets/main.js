/* litecrew.ai landing page — vanilla JS, no dependencies. */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Cases registry ---------------------------------------------
     One entry per published case. The nav "Cases" dropdown is generated
     from this list at runtime; without JavaScript the nav item stays a
     plain link to the Cases section. Adding a case = run sync-case.sh,
     add an entry here, add a card in the landing Cases section.          */

  var CASES = [
    {
      slug: "internet-archaeology",
      title: "The Dead Web Gazette",
      line: "A periodical of digital archaeology: 20 sourced dispatches on things the old web lost",
      thumb: "/cases/internet-archaeology/assets/geocities.webp"
    }
  ];

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

  /* ---------- Cases dropdown (nav) ---------------------------------------
     Progressive enhancement: the "Cases" nav item is a plain anchor to
     #cases in the HTML. When JS runs, a menu is generated from CASES and
     the anchor becomes a disclosure trigger (plain click / Enter toggles;
     modified clicks and middle-click still follow the anchor so the link
     keeps working for new-tab users). Items link straight to each case. */

  var casesNav = doc.querySelector(".nav-cases");
  if (casesNav && CASES.length) {
    var casesTrigger = casesNav.querySelector(".nav-cases__trigger");
    var casesMenu = doc.createElement("ul");
    var SVG_NS = "http://www.w3.org/2000/svg";

    casesMenu.className = "nav-cases__menu";
    casesMenu.id = "nav-cases-menu";
    casesMenu.setAttribute("role", "menu");
    casesMenu.setAttribute("aria-label", "Cases");
    casesMenu.hidden = true;

    CASES.forEach(function (c) {
      var li = doc.createElement("li");
      li.setAttribute("role", "none");
      var a = doc.createElement("a");
      a.setAttribute("role", "menuitem");
      a.className = "nav-cases__item";
      a.href = "/cases/" + c.slug + "/";
      if (c.thumb) {
        var img = doc.createElement("img");
        img.src = c.thumb;
        img.alt = "";
        img.width = 52;
        img.height = 52;
        img.loading = "lazy";
        img.decoding = "async";
        a.appendChild(img);
      }
      var body = doc.createElement("span");
      body.className = "nav-cases__item-body";
      var t = doc.createElement("span");
      t.className = "nav-cases__item-title";
      t.textContent = c.title;
      var d = doc.createElement("span");
      d.className = "nav-cases__item-line";
      d.textContent = c.line;
      body.appendChild(t);
      body.appendChild(d);
      a.appendChild(body);
      var arrow = doc.createElementNS(SVG_NS, "svg");
      arrow.setAttribute("viewBox", "0 0 24 24");
      arrow.setAttribute("width", "13");
      arrow.setAttribute("height", "13");
      arrow.setAttribute("fill", "none");
      arrow.setAttribute("aria-hidden", "true");
      arrow.setAttribute("class", "nav-cases__item-arrow");
      var path = doc.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M5 12h14m-6-6 6 6-6 6"
      );
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      arrow.appendChild(path);
      a.appendChild(arrow);
      li.appendChild(a);
      casesMenu.appendChild(li);
    });

    casesNav.appendChild(casesMenu);

    var caseItems = casesMenu.querySelectorAll("a");

    function setCasesOpen(open, focusFirst) {
      casesMenu.hidden = !open;
      casesTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && focusFirst && caseItems.length) caseItems[0].focus();
    }

    casesTrigger.setAttribute("aria-haspopup", "true");
    casesTrigger.setAttribute("aria-expanded", "false");
    casesTrigger.setAttribute("aria-controls", casesMenu.id);

    casesTrigger.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      // Let modified clicks through: the anchor stays a real link.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      setCasesOpen(casesMenu.hidden);
    });

    casesTrigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setCasesOpen(true, true);
      } else if (e.key === "Escape" && !casesMenu.hidden) {
        setCasesOpen(false);
      }
    });

    casesMenu.addEventListener("keydown", function (e) {
      var i = Array.prototype.indexOf.call(caseItems, doc.activeElement);
      if (e.key === "Escape") {
        e.preventDefault();
        setCasesOpen(false);
        casesTrigger.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        caseItems[(i + 1) % caseItems.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        caseItems[(i - 1 + caseItems.length) % caseItems.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        caseItems[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        caseItems[caseItems.length - 1].focus();
      }
    });

    // Keyboard focus leaving the widget closes the menu.
    casesNav.addEventListener("focusout", function (e) {
      if (!casesNav.contains(e.relatedTarget)) setCasesOpen(false);
    });

    // Click or tap outside closes the menu.
    doc.addEventListener("pointerdown", function (e) {
      if (!casesMenu.hidden && !casesNav.contains(e.target)) {
        setCasesOpen(false);
      }
    });

    // Hover opens/closes on precise pointers only, so touch taps and
    // keyboard focus never fight the click toggle.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var hoverCloseTimer = null;
      casesNav.addEventListener("mouseenter", function () {
        window.clearTimeout(hoverCloseTimer);
        setCasesOpen(true);
      });
      casesNav.addEventListener("mouseleave", function () {
        hoverCloseTimer = window.setTimeout(function () {
          setCasesOpen(false);
        }, 220);
      });
    }
  }

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
