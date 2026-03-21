(function () {
    "use strict";

    var TRANSITION_KEY = "page-transitioning";
    var FADE_DURATION_MS = 500;
    var HOLD_DURATION_MS = 2500;

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

            document.body.style.opacity = "0";
            document.body.style.transition = "none";

            var loader = createLoader();
            loader.style.opacity = "1";
            loader.style.transition = "none";

            document.documentElement.style.opacity = "";

            setTimeout(function () {
                loader.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
                loader.style.opacity = "0";

                setTimeout(function () {
                    if (loader.parentNode) loader.parentNode.removeChild(loader);

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
            document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";

            requestAnimationFrame(function () {
                document.body.style.opacity = "1";
            });

            window.setTimeout(function () {
                document.body.style.transition = "";
            }, FADE_DURATION_MS);
        }
    }

    function animateExit(nextHref) {
        document.body.style.transition = "opacity " + FADE_DURATION_MS + "ms ease";
        document.body.style.opacity = "0";

        setTimeout(function () {
            window.location.href = nextHref;
        }, FADE_DURATION_MS);
    }

    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            document.documentElement.style.opacity = "";
            document.body.style.opacity = "1";
            document.body.style.transition = "";
            var loader = document.getElementById("global-loader");
            if (loader) loader.parentNode.removeChild(loader);
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
})();
