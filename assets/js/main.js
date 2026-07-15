/* SCALE-UP LTD  -  site behaviour
   Header state, mobile navigation, scroll reveals, counters, carousel,
   project filtering/detail rendering, contact form. */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMobile = document.querySelector(".nav-mobile");

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var open = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-locked", open);
    });

    // Close the drawer with Escape for keyboard users.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMobile.classList.contains("is-open")) {
        navMobile.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-locked");
        navToggle.focus();
      }
    });

    navMobile.querySelectorAll(".subtoggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var list = document.getElementById(btn.getAttribute("aria-controls"));
        var open = list.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var animateCounter = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      if (prefersReducedMotion) {
        el.textContent = prefix + target + suffix;
        return;
      }
      var duration = 1600;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) {
        countObserver.observe(el);
      });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Testimonial carousel ---------- */
  var track = document.querySelector(".testi-track");
  if (track) {
    var prev = document.querySelector("[data-testi-prev]");
    var next = document.querySelector("[data-testi-next]");
    var scrollByCard = function (dir) {
      var card = track.querySelector(".testi-card");
      if (!card) return;
      track.scrollBy({
        left: dir * (card.offsetWidth + 20),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    };
    if (prev) prev.addEventListener("click", function () { scrollByCard(-1); });
    if (next) next.addEventListener("click", function () { scrollByCard(1); });
  }

  /* ---------- Projects: card grid + filters ---------- */
  var projectGrid = document.querySelector("[data-project-grid]");
  if (projectGrid && window.SCALEUP_PROJECTS) {
    var projects = window.SCALEUP_PROJECTS;

    var cardHTML = function (p) {
      var badge = p.model === "direct"
        ? '<span class="badge badge--direct">Company-Executed</span>'
        : '<span class="badge badge--supervised">Under Supervision</span>';
      var tags = p.services.map(function (s) {
        return '<span class="tag">' + s + "</span>";
      }).join("");
      return (
        '<article class="project-card reveal" data-model="' + p.model + '" data-categories="' + p.categories.join(" ") + '">' +
        '<div class="thumb">' + badge +
        '<img src="' + p.images[0] + '" alt="' + p.alt + '" loading="lazy" width="600" height="375"></div>' +
        '<div class="body"><h3><a href="project-detail.html?p=' + p.slug + '">' + p.title + "</a></h3>" +
        '<p class="meta">' + p.sector + " &middot; " + p.location + "</p>" +
        '<div class="tag-row">' + tags + "</div></div></article>"
      );
    };

    projectGrid.innerHTML = projects.map(cardHTML).join("");
    projectGrid.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in-view");
    });

    var filterButtons = document.querySelectorAll(".filter-btn");
    var emptyNote = document.querySelector("[data-filter-empty]");

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        var filter = btn.getAttribute("data-filter");
        var visible = 0;
        projectGrid.querySelectorAll(".project-card").forEach(function (card) {
          var show =
            filter === "all" ||
            card.getAttribute("data-model") === filter ||
            card.getAttribute("data-categories").split(" ").indexOf(filter) !== -1;
          card.style.display = show ? "" : "none";
          if (show) visible++;
        });
        if (emptyNote) emptyNote.style.display = visible ? "none" : "block";
      });
    });
  }

  /* ---------- Project detail renderer ---------- */
  var detailRoot = document.querySelector("[data-project-detail]");
  if (detailRoot && window.SCALEUP_PROJECTS) {
    var slug = new URLSearchParams(window.location.search).get("p");
    var project = window.SCALEUP_PROJECTS.filter(function (p) { return p.slug === slug; })[0];

    if (!project) {
      window.location.replace("404.html");
    } else {
      document.title = project.title + "  -  Projects  -  SCALE-UP LTD";
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", project.summary);

      var el = function (id) { return detailRoot.querySelector("[data-pd-" + id + "]"); };

      el("title").textContent = project.title;
      el("crumb").textContent = project.title;
      el("summary").textContent = project.summary;
      el("badge").innerHTML = project.model === "direct"
        ? '<span class="badge badge--direct">Company-Executed</span>'
        : '<span class="badge badge--supervised">Delivered Under Our Engineers’ Supervision</span>';

      el("description").innerHTML = project.description.map(function (p) {
        return "<p>" + p + "</p>";
      }).join("");

      el("scope").innerHTML = project.scope.map(function (s) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>' + s + "</span></li>";
      }).join("");

      el("results").innerHTML = project.results.map(function (r) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>' + r + "</span></li>";
      }).join("");

      el("specs").innerHTML =
        '<li><span class="k">Client</span><span class="v">' + project.client + "</span></li>" +
        '<li><span class="k">Location</span><span class="v">' + project.location + "</span></li>" +
        '<li><span class="k">Sector</span><span class="v">' + project.sector + "</span></li>" +
        '<li><span class="k">Delivery model</span><span class="v">' + (project.model === "direct" ? "Company-executed" : "Engineer supervision") + "</span></li>" +
        '<li><span class="k">Services</span><span class="v">' + project.services.join(", ") + "</span></li>";

      el("tech").innerHTML = project.technologies.map(function (t) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' + t + "</li>";
      }).join("");

      el("gallery").innerHTML = project.images.map(function (src, i) {
        return '<img src="' + src + '" alt="' + project.alt + "  -  view " + (i + 1) + '" loading="lazy" width="600" height="450">';
      }).join("");

      el("hero-img").src = project.images[0];
      el("hero-img").alt = project.alt;
    }
  }

  /* ---------- Contact form ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var showError = function (field, show) {
      field.closest(".field").classList.toggle("has-error", show);
    };

    var validateField = function (input) {
      var value = input.value.trim();
      var ok = true;
      if (input.hasAttribute("required") && !value) ok = false;
      if (ok && input.type === "email" && value) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      showError(input, !ok);
      return ok;
    };

    form.querySelectorAll("input, textarea, select").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("has-error")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = form.querySelectorAll("input, textarea, select");
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // No backend is wired up yet: hand the enquiry to the visitor's
      // email client, addressed to the company inbox.
      var name = form.querySelector("#cf-name").value.trim();
      var email = form.querySelector("#cf-email").value.trim();
      var phone = form.querySelector("#cf-phone").value.trim();
      var service = form.querySelector("#cf-service").value;
      var message = form.querySelector("#cf-message").value.trim();

      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        (phone ? "Phone: " + phone + "\n" : "") +
        (service ? "Service of interest: " + service + "\n" : "") +
        "\n" + message;

      window.location.href =
        "mailto:info@scaleup.rw?subject=" +
        encodeURIComponent("Website enquiry from " + name) +
        "&body=" + encodeURIComponent(body);

      var status = form.querySelector(".form-status");
      if (status) {
        status.classList.add("is-success");
        status.setAttribute("role", "status");
        status.textContent =
          "Thank you, " + name.split(" ")[0] + ". Your email app should open with your message ready to send  -  or write to us directly at info@scaleup.rw.";
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
