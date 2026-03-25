(function () {
    "use strict";

    var TRANSITION_KEY = "page-transitioning";
    var FADE_DURATION_MS = 400;
    var HOLD_DURATION_MS = 1800;

    function createLoader() {
        var loader = document.getElementById("global-loader");
        if (loader) return loader;

        loader = document.createElement("div");
        loader.id = "global-loader";

        var container = document.createElement("div");
        container.className = "loader-text-container";
        "Coinsight AI".split("").forEach(function (char, i) {
            var span = document.createElement("span");
            span.className = "loader-char";
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.animationDelay = (i * 0.1) + "s";
            container.appendChild(span);
        });

        loader.appendChild(container);
        document.documentElement.appendChild(loader);
        return loader;
    }

    function animateEnter() {
        var isTransitioning = sessionStorage.getItem(TRANSITION_KEY);

        if (isTransitioning) {
            sessionStorage.removeItem(TRANSITION_KEY);

            // Hide body content, show loader on top of the same background
            document.body.style.opacity = "0";
            document.body.style.transition = "none";
            document.documentElement.style.opacity = "";

            var loader = createLoader();
            loader.style.opacity = "1";
            loader.style.transition = "none";

            setTimeout(function () {
                // Fade out loader
                loader.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
                loader.style.opacity = "0";

                setTimeout(function () {
                    if (loader.parentNode) loader.parentNode.removeChild(loader);

                    // Fade in body content
                    document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
                    document.body.style.opacity = "1";

                    setTimeout(function () {
                        document.body.style.transition = "";
                    }, FADE_DURATION_MS);
                }, FADE_DURATION_MS);
            }, HOLD_DURATION_MS);

        } else {
            document.documentElement.style.opacity = "";
            document.body.style.opacity = "0";
            document.body.style.transition = "none";
            void document.body.offsetWidth;

            document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
            requestAnimationFrame(function () {
                document.body.style.opacity = "1";
            });

            setTimeout(function () {
                document.body.style.transition = "";
            }, FADE_DURATION_MS);
        }
    }

    function animateExit(nextHref) {
        document.body.style.transition = "none";
        document.body.style.opacity = "1";
        void document.body.offsetWidth;

        var done = false;
        function onDone() {
            if (done) return;
            done = true;
            document.body.removeEventListener("transitionend", onTransEnd);
            window.location.href = nextHref;
        }
        function onTransEnd(e) {
            if (e.target === document.body && e.propertyName === "opacity") onDone();
        }
        document.body.addEventListener("transitionend", onTransEnd);
        setTimeout(onDone, FADE_DURATION_MS + 100);

        requestAnimationFrame(function () {
            document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
            document.body.style.opacity = "0";
        });
    }

    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            document.documentElement.style.opacity = "";
            document.body.style.opacity = "1";
            document.body.style.transition = "";
            var loader = document.getElementById("global-loader");
            if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        } else {
            animateEnter();
        }
    });

    document.addEventListener("click", function (event) {
        var anchor = event.target.closest("a");
        if (!anchor) return;

        var href = anchor.getAttribute("href");
        if (!href) return;

        if (/^(#|https?:\/\/|mailto:|tel:|javascript:)/i.test(href)) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

        event.preventDefault();
        sessionStorage.setItem(TRANSITION_KEY, "1");
        animateExit(anchor.href);
    });

window._csReloading = false;

    window.addEventListener("beforeunload", function () {
        if (!window._csReloading) {
            sessionStorage.setItem(TRANSITION_KEY, "1");
        }
    });

    // Intercept Ctrl+R / Cmd+R / F5 — capture phase so we run before the
    // browser's built-in handler.  Fade out first, then reload manually.
    document.addEventListener("keydown", function (e) {
        var isCtrlR = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r";
        var isF5 = e.key === "F5";

        if ((isCtrlR || isF5) && !window._csReloading) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window._csReloading = true;

            sessionStorage.setItem(TRANSITION_KEY, "1");

            document.body.style.transition = "none";
            document.body.style.opacity = "1";
            void document.body.offsetWidth;

            var done = false;
            function onReloadDone() {
                if (done) return;
                done = true;
                document.body.removeEventListener("transitionend", onReloadTrans);
                window.location.reload(true);
            }
            function onReloadTrans(ev) {
                if (ev.target === document.body && ev.propertyName === "opacity") onReloadDone();
            }
            document.body.addEventListener("transitionend", onReloadTrans);
            setTimeout(onReloadDone, FADE_DURATION_MS + 100);

            requestAnimationFrame(function () {
                document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
                document.body.style.opacity = "0";
            });
        }
    }, true);
})();
