(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  function initRecordsVisibility() {
    var records = document.querySelector(".t-records");
    if (records) {
      records.classList.add("t-records_visible");
    }

    var hiddenElems = document.querySelectorAll(".t396__elem--anim-hidden");
    hiddenElems.forEach(function (el) {
      el.classList.remove("t396__elem--anim-hidden");
    });
  }

  function initHeaderSwap() {
    var overlay = document.querySelector('[data-bh-header="overlay"]');
    var sticky = document.querySelector('[data-bh-header="sticky"]');
    if (!overlay || !sticky) return;

    var update = function () {
      var showSticky = window.scrollY > 72;
      sticky.classList.toggle("is-visible", showSticky);
      overlay.classList.toggle("is-hidden", showSticky);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initMenu() {
    var menu = document.getElementById("nav2283712911");
    if (!menu) return;

    var overlay = document.querySelector(".t450__overlay");
    var openers = document.querySelectorAll('a[href="#menuopen"]');
    var closers = menu.querySelectorAll(".t450__close, .t450__close-button");
    var links = menu.querySelectorAll('a[href^="#"]:not([href="#menuopen"])');

    var open = function () {
      menu.classList.add("bh-menu-open");
      document.body.classList.add("bh-lock-scroll", "t450__body_menushowed");
      if (overlay) overlay.classList.add("bh-overlay-open");
    };

    var close = function () {
      menu.classList.remove("bh-menu-open");
      document.body.classList.remove("bh-lock-scroll", "t450__body_menushowed");
      if (overlay) overlay.classList.remove("bh-overlay-open");
    };

    openers.forEach(function (el) {
      el.addEventListener("click", function (evt) {
        evt.preventDefault();
        open();
      });
    });

    closers.forEach(function (el) {
      el.addEventListener("click", function (evt) {
        evt.preventDefault();
        close();
      });
    });

    if (overlay) {
      overlay.addEventListener("click", close);
    }

    links.forEach(function (el) {
      el.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (evt) {
      if (evt.key === "Escape") close();
    });
  }

  function mountPopupRecords(popup) {
    var recList = (popup.getAttribute("data-popup-rec-ids") || "")
      .split(",")
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);

    if (!recList.length) return;
    if (popup._bhTransfers && popup._bhTransfers.length) return;

    var container = popup.querySelector(".t-popup__container");
    if (!container) return;

    popup._bhTransfers = [];

    recList.forEach(function (recId) {
      var rec = document.getElementById(recId);
      if (!rec || !rec.parentNode) return;

      var marker = document.createComment("bh-popup-placeholder-" + recId);
      rec.parentNode.insertBefore(marker, rec);
      container.appendChild(rec);
      popup._bhTransfers.push({ marker: marker, record: rec });
    });
  }

  function unmountPopupRecords(popup) {
    if (!popup._bhTransfers || !popup._bhTransfers.length) return;

    popup._bhTransfers.forEach(function (item) {
      if (!item.marker || !item.marker.parentNode) return;
      item.marker.parentNode.insertBefore(item.record, item.marker);
      item.marker.remove();
    });

    popup._bhTransfers = [];
  }

  function hydratePopupVideos(popup) {
    var lazyBlocks = popup.querySelectorAll(".t-video-lazyload[data-videolazy-id]");
    lazyBlocks.forEach(function (block) {
      if (block.dataset.loaded === "y") return;
      var src = block.getAttribute("data-videolazy-id");
      if (!src) return;

      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.setAttribute("allowfullscreen", "allowfullscreen");
      iframe.setAttribute(
        "allow",
        "autoplay; encrypted-media; fullscreen; picture-in-picture"
      );
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";

      block.innerHTML = "";
      block.appendChild(iframe);
      block.dataset.loaded = "y";
    });
  }

  function initPopups() {
    var popups = Array.prototype.slice.call(
      document.querySelectorAll(".t-popup[data-tooltip-hook]")
    );
    if (!popups.length) return;

    var popupByHook = new Map();
    popups.forEach(function (popup) {
      popupByHook.set(popup.getAttribute("data-tooltip-hook"), popup);
    });

    var openPopup = function (popup) {
      if (!popup) return;

      mountPopupRecords(popup);
      hydratePopupVideos(popup);

      popup.classList.add("bh-popup-open", "t-popup_show");
      document.body.classList.add("bh-lock-scroll", "t-body_popupshowed");

      var bg = popup.parentElement
        ? popup.parentElement.querySelector(".t-popup__bg")
        : null;
      if (bg) bg.classList.add("bh-popup-bg-open", "t-popup__bg-active");
    };

    var closePopup = function (popup) {
      if (!popup) return;

      popup.classList.remove("bh-popup-open", "t-popup_show");
      document.body.classList.remove("bh-lock-scroll", "t-body_popupshowed");

      var bg = popup.parentElement
        ? popup.parentElement.querySelector(".t-popup__bg")
        : null;
      if (bg) bg.classList.remove("bh-popup-bg-open", "t-popup__bg-active");

      popup.querySelectorAll("iframe").forEach(function (frame) {
        if (!frame.src) return;
        frame.dataset.restoreSrc = frame.src;
        frame.src = "";
        if (frame.dataset.restoreSrc) frame.src = frame.dataset.restoreSrc;
      });

      unmountPopupRecords(popup);
    };

    document.querySelectorAll('a[href^="#popup:"], a[href="#zeropopup"]').forEach(
      function (trigger) {
        trigger.addEventListener("click", function (evt) {
          var hook = trigger.getAttribute("href");
          var popup = popupByHook.get(hook);
          if (!popup) return;
          evt.preventDefault();
          openPopup(popup);
        });
      }
    );

    popups.forEach(function (popup) {
      popup
        .querySelectorAll(".t-popup__close, .t-popup__close-button, .t-popup__bg")
        .forEach(function (closeBtn) {
          closeBtn.addEventListener("click", function (evt) {
            evt.preventDefault();
            closePopup(popup);
          });
        });

      popup.addEventListener("click", function (evt) {
        if (evt.target === popup) closePopup(popup);
      });
    });

    document.addEventListener("keydown", function (evt) {
      if (evt.key !== "Escape") return;
      popups.forEach(closePopup);
    });
  }

  function initCookieBanner() {
    var banner = document.querySelector(".t886");
    if (!banner) return;

    var key = "bh_cookie_accept_v1";
    var btn = banner.querySelector(".t886__btn");

    var accept = function () {
      try {
        localStorage.setItem(key, "1");
      } catch (err) {
        // no-op
      }
      banner.classList.add("t886_closed");
    };

    var accepted = false;
    try {
      accepted = localStorage.getItem(key) === "1";
    } catch (err) {
      accepted = false;
    }

    if (accepted) {
      banner.classList.add("t886_closed");
    } else {
      banner.classList.remove("t886_closed");
    }

    if (btn) {
      btn.addEventListener("click", accept);
    }
  }

  function initFaqToggles() {
    var map = {
      "#info": "rec2283713321",
      "#info1": "rec2283713351",
      "#info2": "rec2283713381",
      "#info4": "rec2283713441",
      "#info5": "rec2283713471",
      "#info6": "rec2283713501",
      "#info7": "rec2283713531",
      "#info8": "rec2283713561",
    };

    var allTargets = new Set(Object.values(map));
    allTargets.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.add("bh-collapsible");
    });

    Object.keys(map).forEach(function (hook) {
      var target = document.getElementById(map[hook]);
      if (!target) return;

      var triggers = document.querySelectorAll('a[href="' + hook + '"]');
      triggers.forEach(function (trigger) {
        trigger.addEventListener("click", function (evt) {
          evt.preventDefault();
          target.classList.toggle("bh-collapsible-open");
        });
      });
    });
  }

  function initMarquee() {
    var wrappers = document.querySelectorAll(".t1003__wrapper");
    wrappers.forEach(function (wrapper) {
      var content = wrapper.querySelector(".t1003__content");
      var contentWrap = wrapper.querySelector(".t1003__content-wrapper");
      if (!content || !contentWrap) return;

      if (!content.dataset.bhDuplicated) {
        var items = Array.prototype.slice.call(content.children);
        items.forEach(function (item) {
          content.appendChild(item.cloneNode(true));
        });
        content.dataset.bhDuplicated = "y";
      }

      var speed = parseFloat(wrapper.getAttribute("data-marquee-speed") || "3");
      var duration = Math.max(12, 70 / Math.max(speed, 1));
      content.style.animationDuration = duration.toFixed(2) + "s";
      content.classList.add("bh-marquee-ready");
      contentWrap.style.opacity = "1";
    });
  }

  function initSmoothAnchors() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(function (anchor) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#" || href.startsWith("#popup:") || href === "#menuopen" || href === "#zeropopup") {
        return;
      }

      anchor.addEventListener("click", function (evt) {
        var id = href.slice(1);
        if (!id) return;
        var target = document.getElementById(id) || document.querySelector('a[name="' + id + '"]');
        if (!target) return;
        evt.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  onReady(function () {
    initRecordsVisibility();
    initHeaderSwap();
    initMenu();
    initPopups();
    initCookieBanner();
    initFaqToggles();
    initMarquee();
    initSmoothAnchors();
  });
})();
