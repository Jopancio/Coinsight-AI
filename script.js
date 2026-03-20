
var debounce = (function (existing) {
    // Reuse a globally shared debounce implementation if one already exists,
    // otherwise define it here and attach it to window.debounce.
    if (typeof existing === "function") {
        return existing;
    }

    function debounceFactory(func, wait) {
        var timeoutId = null;
        return function () {
            var context = this;
            var args = arguments;

            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(function () {
                timeoutId = null;
                func.apply(context, args);
            }, wait);
        };
    }

    if (typeof window !== "undefined") {
        window.debounce = debounceFactory;
    }

    return debounceFactory;
})(typeof window !== "undefined" ? window.debounce : undefined);

function showConnectionError(type) {
    if (document.getElementById("connection-error-overlay")) return;

    var isTimeout = type === "timeout";
    var iconClass = isTimeout ? "timeout" : "offline";
    var icon = isTimeout ? "fa-solid fa-clock-rotate-left" : "fa-solid fa-wifi";
    var title = isTimeout ? "Koneksi Timeout" : "Tidak Ada Koneksi";
    var message = isTimeout
        ? "Server sedang tidak dapat dijangkau. Hal ini bisa disebabkan oleh gangguan teknis atau beban server yang tinggi. Silakan muat ulang halaman beberapa saat lagi."
        : "Perangkat Anda tidak terhubung ke internet. Pastikan Wi-Fi atau data seluler aktif, lalu coba muat ulang halaman.";
    var btnLabel = isTimeout ? "Muat Ulang" : "Coba Lagi";

    var overlay = document.createElement("div");
    overlay.id = "connection-error-overlay";
    overlay.innerHTML =
        '<div id="connection-error-card">' +
        '<div class="error-icon ' + iconClass + '"><i class="' + icon + '"></i></div>' +
        '<h2>' + title + '</h2>' +
        '<p>' + message + '</p>' +
        '<button class="retry-btn ' + iconClass + '" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> ' + btnLabel + '</button>' +
        '</div>';

    document.body.appendChild(overlay);
}

function fetchWithTimeout(url, options, ms) {
    ms = ms || 15000;
    if (!navigator.onLine) {
        showConnectionError("offline");
        return Promise.reject(new Error("offline"));
    }
    var controller = new AbortController();
    var signal = controller.signal;
    var merged = Object.assign({}, options || {}, { signal: signal });

    var timeout = setTimeout(function () { controller.abort(); }, ms);

    return fetch(url, merged)
        .then(function (response) {
            clearTimeout(timeout);
            return response;
        })
        .catch(function (err) {
            clearTimeout(timeout);
            if (err.name === "AbortError") {
                showConnectionError("timeout");
                throw new Error("timeout");
            }
            if (!navigator.onLine) {
                showConnectionError("offline");
            } else {
                showConnectionError("timeout");
            }
            throw err;
        });
}

window.addEventListener("offline", function () {
    showConnectionError("offline");
});

var nav = document.getElementById("main-nav");
var navContainer = document.getElementById("nav-container");
var logoIcon = document.getElementById("logo-icon");
var logoText = document.getElementById("logo-text");
var navLinks = document.getElementById("nav-links");
var navBtn = document.getElementById("nav-btn");

var isScrolled = false;
var navTween = null;

function navToScrolled() {
    if (isScrolled) return;
    isScrolled = true;

    if (navTween) navTween.kill();
    navTween = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.out", overwrite: "auto" } });

    navTween
        .to(nav, { width: "56rem", maxWidth: "90%", top: "1rem", borderRadius: "9999px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }, 0)
        .to(navContainer, { padding: "0.75rem 1.5rem" }, 0)
        .to(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" }, 0)
        .to(logoText, { fontSize: "1.25rem" }, 0)
        .to(navLinks, { gap: "1.5rem", fontSize: "0.875rem" }, 0)
        .to(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" }, 0);
}

function navToExpanded() {
    if (!isScrolled) return;
    isScrolled = false;

    if (navTween) navTween.kill();
    navTween = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.out", overwrite: "auto" } });

    navTween
        .to(nav, { width: "100%", maxWidth: "100%", top: "0px", borderRadius: "0px", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }, 0)
        .to(navContainer, { padding: "2rem 1.5rem" }, 0)
        .to(logoIcon, { width: "2.5rem", height: "2.5rem", fontSize: "1.5rem" }, 0)
        .to(logoText, { fontSize: "1.5rem" }, 0)
        .to(navLinks, { gap: "2.5rem", fontSize: "1rem" }, 0)
        .to(navBtn, { padding: "0.75rem 2rem", fontSize: "1rem" }, 0);
}

var scrollTicking = false;
window.addEventListener("scroll", function () {
    if (!scrollTicking) {
        requestAnimationFrame(function () {
            if (window.scrollY > 50) {
                navToScrolled();
            } else {
                navToExpanded();
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

if (window.scrollY > 50) {
    gsap.set(nav, { width: "56rem", maxWidth: "90%", top: "1rem", borderRadius: "9999px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" });
    gsap.set(navContainer, { padding: "0.75rem 1.5rem" });
    gsap.set(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" });
    gsap.set(logoText, { fontSize: "1.25rem" });
    gsap.set(navLinks, { gap: "1.5rem", fontSize: "0.875rem" });
    gsap.set(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" });
    isScrolled = true;
}

var cardList = document.querySelectorAll(".fitur-card");

var cardObserver = new IntersectionObserver(
    function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var idx = Array.from(cardList).indexOf(entry.target);
                gsap.to(entry.target, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: (idx % 2) * 0.2, // Faster and simpler stagger
                    ease: "power2.out"
                });
                observer.unobserve(entry.target); // Animate only once
            }
        });
    },
    { root: null, rootMargin: "0px", threshold: 0.1 }
);

cardList.forEach(function (card) {
    gsap.set(card, { opacity: 0, y: 30 });
    cardObserver.observe(card);
});

var sectionList = document.querySelectorAll(".section-fade-up");

var sectionObserver = new IntersectionObserver(
    function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                gsap.to(entry.target, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out"
                });
                sectionObserver.unobserve(entry.target);
            }
        });
    },
    { root: null, rootMargin: "0px", threshold: 0.1 }
);

sectionList.forEach(function (sec) {
    gsap.set(sec, { opacity: 0, y: 40 });
    sectionObserver.observe(sec);
});

lucide.createIcons();

document.querySelectorAll(".nav-hover-link").forEach(function (link) {
    var floatTween = null;
    link._isHovered = false;

    link.addEventListener("mouseenter", function () {
        link._isHovered = true;
        gsap.killTweensOf(link);
        if (floatTween) {
            floatTween.kill();
            floatTween = null;
        }

        gsap.to(link, {
            scale: 1.35,
            color: "#ffffff",
            duration: 0.3,
            ease: "back.out(1.7)",
            onComplete: function () {
                if (link._isHovered) {
                    floatTween = gsap.to(link, {
                        y: -4,
                        duration: 0.75,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        });
    });

    link.addEventListener("mouseleave", function () {
        link._isHovered = false;
        gsap.killTweensOf(link);
        if (floatTween) {
            floatTween.kill();
            floatTween = null;
        }

        if (link.classList.contains("nav-active")) {
            gsap.to(link, { scale: 1.15, y: 0, color: "#ffffff", duration: 0.4, ease: "power2.out" });
        } else {
            gsap.to(link, { scale: 1, y: 0, color: "", duration: 0.4, ease: "power2.out", clearProps: "color" });
        }
    });
});

document.querySelectorAll(".hero-hover-btn").forEach(function (btn) {
    btn.addEventListener("mouseenter", function () {
        gsap.killTweensOf(btn);
        gsap.to(btn, {
            scale: 1.1,
            color: "#ffffff",
            duration: 0.3,
            ease: "back.out(1.7)"
        });
    });

    btn.addEventListener("mouseleave", function () {
        gsap.killTweensOf(btn);
        gsap.to(btn, { scale: 1, color: "", duration: 0.4, ease: "power2.out", clearProps: "color" });
    });
});

(function () {
    var tableBody = document.getElementById("crypto-table-body");
    var searchInput = document.getElementById("crypto-search");
    var allCoins = [];
    var initialLoad = true;
    var favoriteCoins = JSON.parse(localStorage.getItem("coin_favorites") || "[]");


    var API_BASE_URL = "https://skidibi-toilet.jovancion.workers.dev/api";
    var heroTopGainerContent = document.getElementById("hero-top-gainer-content");
    var heroRankingList = document.getElementById("hero-ranking-list");

    function formatChangePercent(val) {
        if (typeof val !== "number" || !isFinite(val)) return "0.00%";
        return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
    }

    function getChangeTone(val) {
        if (typeof val !== "number" || !isFinite(val) || val >= 0) {
            return {
                text: "text-emerald-400",
                pill: "bg-emerald-500/20 text-emerald",
                shadow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            };
        }

        return {
            text: "text-red-400",
            pill: "bg-red-500/20 text-red-400",
            shadow: "shadow-[0_0_12px_rgba(239,68,68,0.15)]"
        };
    }

    function createMockupCoinAvatar(coin, sizeClass, textClass) {
        var letter = (coin.symbol || coin.name || "?").charAt(0).toUpperCase();

        if (coin.image) {
            return '<div class="' + sizeClass + ' rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border border-white/10">' +
                '<img src="' + coin.image + '" alt="' + coin.name + '" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer" />' +
                '</div>';
        }

        return '<div class="' + sizeClass + ' rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#10B981] flex items-center justify-center shrink-0 font-bold text-white ' + textClass + '">' + letter + '</div>';
    }

    function renderHeroMockupError(message) {
        if (heroTopGainerContent) {
            heroTopGainerContent.innerHTML =
                '<p class="text-xs text-gray-300 mb-1">Pemenang Analisis AI</p>' +
                '<div class="py-6 text-center">' +
                '<p class="text-sm text-gray-400">' + message + '</p>' +
                '</div>';
        }

        if (heroRankingList) {
            heroRankingList.innerHTML =
                '<div class="py-6 text-center text-xs text-gray-500 bg-white/5 rounded-2xl border border-white/10">' +
                message +
                '</div>';
        }
    }

    function renderHeroMockup() {
        if (!heroTopGainerContent || !heroRankingList) return;

        var rankedCoins = allCoins
            .filter(function (coin) {
                return typeof coin.price_change_percentage_24h === "number" && isFinite(coin.price_change_percentage_24h);
            })
            .sort(function (a, b) {
                return b.price_change_percentage_24h - a.price_change_percentage_24h;
            })
            .slice(0, 10);

        if (!rankedCoins.length) {
            renderHeroMockupError("Data market belum tersedia.");
            return;
        }

        var topCoin = rankedCoins[0];
        var winnerTone = getChangeTone(topCoin.price_change_percentage_24h);
        var topCoinSymbol = (topCoin.symbol || "").toUpperCase();

        heroTopGainerContent.innerHTML =
            '<p class="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70 mb-4">🎰 Menganalisis Koin...</p>' +
            '<div id="gacha-coin-display" class="flex items-center gap-3 mb-3">' +
            '<div class="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0"></div>' +
            '<div class="min-w-0 flex-1">' +
            '<p class="text-sm font-bold text-white leading-tight">???</p>' +
            '<span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">---</span>' +
            '</div>' +
            '</div>' +
            '<div id="gacha-stats-display" class="flex items-end justify-between">' +
            '<p class="text-xs text-gray-500 font-semibold">$?.??</p>' +
            '<div class="text-right">' +
            '<p class="text-lg font-bold text-gray-500">+?.??%</p>' +
            '<p class="text-[9px] text-gray-500">24 Jam</p>' +
            '</div>' +
            '</div>';

        var gachaDisplay = document.getElementById("gacha-coin-display");
        var gachaStats = document.getElementById("gacha-stats-display");
        var shufflePool = allCoins.length > 10 ? allCoins.slice(0, 30) : allCoins;
        var gachaStartTime = Date.now();
        var gachaDuration = 5000;
        var lastIndex = -1;

        function getRandomCoin() {
            var idx;
            do {
                idx = Math.floor(Math.random() * shufflePool.length);
            } while (idx === lastIndex && shufflePool.length > 1);
            lastIndex = idx;
            return shufflePool[idx];
        }

        function renderGachaCoin(coin) {
            if (!gachaDisplay) return;
            var sym = (coin.symbol || "").toUpperCase();
            gachaDisplay.innerHTML =
                createMockupCoinAvatar(coin, "w-10 h-10", "text-sm") +
                '<div class="min-w-0 flex-1">' +
                '<p class="text-sm font-bold text-white leading-tight">' + coin.name + '</p>' +
                '<span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">' + sym + '</span>' +
                '</div>';
        }

        function gachaTick() {
            var elapsed = Date.now() - gachaStartTime;

            if (elapsed >= gachaDuration) {
                revealWinner();
                return;
            }

            var progress = elapsed / gachaDuration;
            var delay = 80 + progress * progress * 320;

            var randomCoin = getRandomCoin();
            renderGachaCoin(randomCoin);

            gsap.fromTo(gachaDisplay, { opacity: 0.4, scale: 0.92 }, { opacity: 1, scale: 1, duration: delay / 1000 * 0.6, ease: "power2.out" });

            setTimeout(gachaTick, delay);
        }

        function revealWinner() {
            var card = document.getElementById("hero-top-gainer-card");

            if (card) {
                var flash = document.createElement("div");
                flash.style.cssText = "position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,0.9) 0%,rgba(16,185,129,0.4) 50%,transparent 70%);z-index:30;pointer-events:none;border-radius:inherit;";
                card.appendChild(flash);
                gsap.fromTo(flash, { opacity: 1, scale: 0.3 }, {
                    opacity: 0, scale: 2.5, duration: 0.8, ease: "power2.out",
                    onComplete: function () { flash.remove(); }
                });
            }

            var sparkleColors = ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#ffffff", "#60a5fa"];
            var particleCount = 18;
            for (var i = 0; i < particleCount; i++) {
                var spark = document.createElement("div");
                var size = Math.random() * 5 + 3;
                var color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
                var angle = (360 / particleCount) * i + (Math.random() * 20 - 10);
                var distance = 40 + Math.random() * 60;
                var rad = angle * Math.PI / 180;
                var xDest = Math.cos(rad) * distance;
                var yDest = Math.sin(rad) * distance;
                spark.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + color + ";top:50%;left:50%;z-index:31;pointer-events:none;box-shadow:0 0 6px " + color + ";";
                if (card) card.appendChild(spark);
                gsap.fromTo(spark,
                    { x: 0, y: 0, opacity: 1, scale: 1 },
                    { x: xDest, y: yDest, opacity: 0, scale: 0, duration: 0.7 + Math.random() * 0.5, ease: "power3.out", onComplete: function () { spark.remove(); } }
                );
            }

            var confettiColors = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];
            for (var j = 0; j < 12; j++) {
                var conf = document.createElement("div");
                var cw = Math.random() * 6 + 3;
                var ch = Math.random() * 4 + 2;
                var cColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                conf.style.cssText = "position:absolute;width:" + cw + "px;height:" + ch + "px;background:" + cColor + ";top:40%;left:" + (20 + Math.random() * 60) + "%;z-index:31;pointer-events:none;border-radius:1px;";
                if (card) card.appendChild(conf);
                gsap.fromTo(conf,
                    { y: 0, opacity: 1, rotation: 0 },
                    { y: 80 + Math.random() * 40, x: (Math.random() - 0.5) * 60, opacity: 0, rotation: Math.random() * 360, duration: 1 + Math.random() * 0.6, ease: "power1.out", onComplete: function () { conf.remove(); } }
                );
            }

            var titleEl = heroTopGainerContent.querySelector("p:first-child");
            if (titleEl) titleEl.textContent = "🏆 Pemenang Analisis AI";

            renderGachaCoin(topCoin);

            if (gachaStats) {
                gachaStats.innerHTML =
                    '<p class="text-xs text-gray-300 font-semibold">' + formatCurrency(topCoin.current_price || 0) + '</p>' +
                    '<div class="text-right">' +
                    '<p class="text-lg font-bold ' + winnerTone.text + '">' + formatChangePercent(topCoin.price_change_percentage_24h) + '</p>' +
                    '<p class="text-[9px] text-gray-400">24 Jam</p>' +
                    '</div>';
            }

            gsap.fromTo(gachaDisplay, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(2.5)" });
            gsap.fromTo(gachaStats, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power3.out" });

            if (card) {
                gsap.fromTo(card,
                    { boxShadow: "0 0 0px rgba(16,185,129,0)" },
                    { boxShadow: "0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2)", duration: 0.6, ease: "power2.out" }
                );
                gsap.to(card, {
                    boxShadow: "0 0 20px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.05)",
                    duration: 1.5, delay: 1.2, ease: "power2.out",
                    yoyo: true, repeat: 2
                });
                gsap.to(card, { boxShadow: "0 4px 15px rgba(30,58,138,0.2)", duration: 1, delay: 5, ease: "power2.out" });
            }
        }

        gachaTick();

        var rankingCards = rankedCoins.map(function (coin, index) {
            var tone = getChangeTone(coin.price_change_percentage_24h);
            var symbol = (coin.symbol || "").toUpperCase();

            return '' +
                '<div class="flex items-center gap-2 p-2.5 rounded-xl glass-card border-none bg-white/5 transition-colors hover:bg-white/10 mb-2.5">' +
                '<div class="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-gray-300">' + (index + 1) + '</div>' +
                createMockupCoinAvatar(coin, "w-8 h-8", "text-xs") +
                '<div class="min-w-0 flex-1">' +
                '<p class="text-xs font-bold text-white truncate">' + coin.name + '</p>' +
                '<p class="text-[9px] text-gray-400 uppercase">' + symbol + '</p>' +
                '</div>' +
                '<div class="text-right shrink-0">' +
                '<p class="text-[11px] font-bold ' + tone.text + '">' + formatChangePercent(coin.price_change_percentage_24h) + '</p>' +
                '<p class="text-[9px] text-gray-500">' + formatCurrency(coin.current_price || 0) + '</p>' +
                '</div>' +
                '</div>';
        }).join("");

        heroRankingList.innerHTML = '<div class="hero-rank-scroll-inner">' + rankingCards + rankingCards + '</div>';
    }

    function generateSparklineSVG(coin) {
        var low = coin.low_24h || 0;
        var high = coin.high_24h || 0;
        var current = coin.current_price || 0;
        var change = coin.price_change_percentage_24h || 0;

        if (high === low || high === 0) {
            return '<svg width="80" height="32" viewBox="0 0 80 32"><line x1="0" y1="16" x2="80" y2="16" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="3,3"/></svg>';
        }

        var range = high - low;
        var padding = 4;
        var chartH = 32 - padding * 2;
        var chartW = 80;

        var points = [];
        var rawValues = [
            low + range * 0.1,
            low + range * 0.3,
            low + range * 0.15,
            current > high ? high : (current < low ? low : current),
            low + range * 0.6,
            high - range * 0.2,
            low + range * 0.4,
            current
        ];

        if (change >= 0) {
            rawValues[0] = low + range * 0.05;
            rawValues[1] = low + range * 0.2;
            rawValues[2] = low + range * 0.35;
            rawValues[3] = low + range * 0.3;
            rawValues[4] = low + range * 0.55;
            rawValues[5] = low + range * 0.5;
            rawValues[6] = low + range * 0.7;
            rawValues[7] = current;
        } else {
            rawValues[0] = high - range * 0.05;
            rawValues[1] = high - range * 0.15;
            rawValues[2] = high - range * 0.3;
            rawValues[3] = high - range * 0.25;
            rawValues[4] = high - range * 0.5;
            rawValues[5] = high - range * 0.45;
            rawValues[6] = high - range * 0.65;
            rawValues[7] = current;
        }

        for (var i = 0; i < rawValues.length; i++) {
            var x = (i / (rawValues.length - 1)) * chartW;
            var y = padding + chartH - ((rawValues[i] - low) / range) * chartH;
            points.push(x.toFixed(1) + "," + y.toFixed(1));
        }

        var strokeColor = change >= 0 ? "#10b981" : "#ef4444";
        var gradientId = "g_" + Math.random().toString(36).substr(2, 6);

        var polyline = points.join(" ");
        var fillPoints = "0," + (padding + chartH) + " " + polyline + " " + chartW + "," + (padding + chartH);

        return '<svg width="80" height="32" viewBox="0 0 80 32">' +
            '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + strokeColor + '" stop-opacity="0.3"/>' +
            '<stop offset="100%" stop-color="' + strokeColor + '" stop-opacity="0"/>' +
            '</linearGradient></defs>' +
            '<polygon points="' + fillPoints + '" fill="url(#' + gradientId + ')"/>' +
            '<polyline points="' + polyline + '" fill="none" stroke="' + strokeColor + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>';
    }

    function generateCardChartSVG(coin) {
        var low = coin.low_24h || 0;
        var high = coin.high_24h || 0;
        var current = coin.current_price || 0;
        var change = coin.price_change_percentage_24h || 0;

        if (high === low || high === 0) {
            return '<svg width="100%" height="100%" viewBox="0 0 280 80" preserveAspectRatio="none"><line x1="0" y1="40" x2="280" y2="40" stroke="#374151" stroke-width="1" stroke-dasharray="4,4"/></svg>';
        }

        var range = high - low;
        var padding = 8;
        var chartH = 80 - padding * 2;
        var chartW = 280;
        var numPoints = 12;
        var points = [];
        var rawValues = [];

        if (change >= 0) {
            rawValues = [
                low + range * 0.15, low + range * 0.25, low + range * 0.2,
                low + range * 0.35, low + range * 0.3, low + range * 0.45,
                low + range * 0.4, low + range * 0.55, low + range * 0.5,
                low + range * 0.65, low + range * 0.75, current
            ];
        } else {
            rawValues = [
                high - range * 0.05, high - range * 0.1, high - range * 0.2,
                high - range * 0.15, high - range * 0.3, high - range * 0.35,
                high - range * 0.4, high - range * 0.45, high - range * 0.55,
                high - range * 0.6, high - range * 0.7, current
            ];
        }

        for (var i = 0; i < rawValues.length; i++) {
            var x = (i / (rawValues.length - 1)) * chartW;
            var y = padding + chartH - ((rawValues[i] - low) / range) * chartH;
            points.push(x.toFixed(1) + "," + y.toFixed(1));
        }

        var strokeColor = change >= 0 ? "#10b981" : "#ef4444";
        var gradientId = "cg_" + Math.random().toString(36).substr(2, 6);
        var polyline = points.join(" ");
        var fillPoints = "0," + (padding + chartH) + " " + polyline + " " + chartW + "," + (padding + chartH);

        return '<svg width="100%" height="100%" viewBox="0 0 280 80" preserveAspectRatio="none">' +
            '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + strokeColor + '" stop-opacity="0.25"/>' +
            '<stop offset="100%" stop-color="' + strokeColor + '" stop-opacity="0"/>' +
            '</linearGradient></defs>' +
            '<polygon points="' + fillPoints + '" fill="url(#' + gradientId + ')"/>' +
            '<polyline points="' + polyline + '" fill="none" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>';
    }

    function coinInitialFallback(name, symbol) {
        var letter = (name || symbol || "?").charAt(0).toUpperCase();
        return '<div style="width:2rem;height:2rem;border-radius:9999px;background:linear-gradient(135deg,#1e3a8a,#10b981);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:#fff;flex-shrink:0;">' + letter + '</div>';
    }

    function updateTable() {
        var term = searchInput ? searchInput.value.toLowerCase() : "";
        var filtered = allCoins;
        if (term) {
            filtered = allCoins.filter(function (coin) {
                return coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term);
            });
        }
        renderTable(filtered);
    }

    async function fetchCryptoData() {
        try {
            var response = await fetchWithTimeout(API_BASE_URL + "/coins");
            allCoins = await response.json();
            renderHeroMockup();
            updateTable();

            if (initialLoad) {
                initialLoad = false;
                var urlParams = new URLSearchParams(window.location.search);
                var coinId = urlParams.get('coin');
                if (coinId) {
                    var targetCoin = allCoins.find(function (c) { return c.id === coinId; });
                    if (targetCoin) {
                        var rowEl = document.getElementById("row-" + coinId);
                        openCoinDetail(rowEl, targetCoin);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching crypto data:", error);
            renderHeroMockupError("Gagal memuat market hari ini.");
            if (tableBody) {
                tableBody.innerHTML = '<div class="py-20 text-center text-red-400 w-full">Gagal memuat data. Silakan coba lagi nanti.</div>';
            }
        }
    }

    function formatCurrency(val) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: val < 1 ? 4 : 2
        }).format(val);
    }

    function formatCompact(val) {
        return new Intl.NumberFormat("en-US", {
            notation: "compact",
            style: "currency",
            currency: "USD"
        }).format(val);
    }

    function openCoinDetail(rowElement, coin) {
        if (!window.location.search.includes('coin=' + coin.id)) {
            var url = new URL(window.location);
            url.searchParams.set('coin', coin.id);
            window.history.pushState({}, '', url);
        }

        var rect = rowElement ? rowElement.getBoundingClientRect() : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };
        document.body.style.overflow = "hidden";

        var overlay = document.createElement("div");
        overlay.id = "coin-detail-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(0,0,0,0)";
        overlay.style.zIndex = "999";
        overlay.style.cursor = "pointer";
        document.body.appendChild(overlay);

        var detailCard = document.createElement("div");
        detailCard.id = "coin-detail-card";
        detailCard.className = "glass-card";
        detailCard.style.position = "fixed";
        detailCard.style.top = rect.top + "px";
        detailCard.style.left = rect.left + "px";
        detailCard.style.width = rect.width + "px";
        detailCard.style.height = rect.height + "px";
        detailCard.style.zIndex = "1000";
        detailCard.style.borderRadius = "0.5rem";
        detailCard.style.overflow = "hidden";
        detailCard.style.backgroundColor = "rgba(15, 23, 42, 0.98)";

        var isMobile = window.innerWidth < 768;
        var targetWidth = isMobile ? window.innerWidth * 0.95 : Math.min(1100, window.innerWidth * 0.9);
        var targetHeight = isMobile ? window.innerHeight * 0.95 : Math.min(750, window.innerHeight * 0.9);
        var targetLeft = (window.innerWidth - targetWidth) / 2;
        var targetTop = (window.innerHeight - targetHeight) / 2;

        var wrapEl = rowElement ? (rowElement.querySelector(".coin-logo-wrap") || rowElement.querySelector("td > div > div:first-child")) : null;
        var nameEl = rowElement ? (rowElement.querySelector(".coin-name-text") || rowElement.querySelector("span.font-bold")) : null;
        var symbolEl = rowElement ? (rowElement.querySelector(".coin-symbol-text") || rowElement.querySelector("span.font-mono")) : null;

        var imgRect = wrapEl ? wrapEl.getBoundingClientRect() : { top: rect.top, left: rect.left, width: 32, height: 32 };
        var nameRect = nameEl ? nameEl.getBoundingClientRect() : { top: rect.top, left: rect.left + 50, width: 50, height: 20 };
        var symbolRect = symbolEl ? symbolEl.getBoundingClientRect() : { top: rect.top, left: rect.left + 150, width: 40, height: 20 };

        var animImgWrap = wrapEl ? wrapEl.cloneNode(true) : document.createElement("div");
        if (!wrapEl) {
            animImgWrap.innerHTML = '<img src="' + coin.image + '" class="w-8 h-8 rounded-full" onerror="this.style.display=\'none\'" />';
        }
        animImgWrap.id = "";
        animImgWrap.style.position = "fixed";
        animImgWrap.style.top = imgRect.top + "px";
        animImgWrap.style.left = imgRect.left + "px";
        animImgWrap.style.width = imgRect.width + "px";
        animImgWrap.style.height = imgRect.height + "px";
        animImgWrap.style.zIndex = "1001";
        animImgWrap.style.margin = "0";

        var internalImg = animImgWrap.querySelector("img") || animImgWrap.querySelector("div");
        if (internalImg) {
            internalImg.style.width = "100%";
            internalImg.style.height = "100%";
        }
        document.body.appendChild(animImgWrap);

        var animName = document.createElement("h2");
        animName.textContent = nameEl ? nameEl.textContent : coin.name;
        animName.className = "text-white font-bold whitespace-nowrap";
        animName.style.position = "fixed";
        animName.style.top = nameRect.top + "px";
        animName.style.left = nameRect.left + "px";
        animName.style.fontSize = "16px";
        animName.style.lineHeight = "1";
        animName.style.zIndex = "1001";
        animName.style.margin = "0";
        document.body.appendChild(animName);

        var animSymbol = document.createElement("span");
        animSymbol.textContent = symbolEl ? symbolEl.textContent : coin.symbol;
        animSymbol.className = "text-gray-400 font-mono whitespace-nowrap uppercase";
        animSymbol.style.position = "fixed";
        animSymbol.style.top = symbolRect.top + "px";
        animSymbol.style.left = symbolRect.left + "px";
        animSymbol.style.fontSize = "12px";
        animSymbol.style.padding = "4px 8px";
        animSymbol.style.backgroundColor = "rgba(255,255,255,0.1)";
        animSymbol.style.borderRadius = "4px";
        animSymbol.style.zIndex = "1001";
        document.body.appendChild(animSymbol);

        if (rowElement) rowElement.style.opacity = "0";
        document.body.appendChild(detailCard);

        gsap.to(overlay, {
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            duration: 0.6,
            ease: "power3.inOut"
        });


        var finalImgTop = targetTop + 68;
        var finalImgLeft = targetLeft + 32;
        var finalImgSize = 48;

        var finalNameTop = targetTop + 77;
        var finalNameLeft = finalImgLeft + finalImgSize + 16;

        var tempSpan = document.createElement("span");
        tempSpan.style.fontSize = "30px";
        tempSpan.style.fontWeight = "bold";
        tempSpan.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
        tempSpan.style.position = "absolute";
        tempSpan.style.visibility = "hidden";
        tempSpan.textContent = animName.textContent;
        document.body.appendChild(tempSpan);
        var finalNameWidth = tempSpan.getBoundingClientRect().width;
        tempSpan.remove();

        var finalSymbolLeft = finalNameLeft + finalNameWidth + 12;
        var finalSymbolTop = finalNameTop + 6;

        gsap.to(animImgWrap, {
            top: finalImgTop,
            left: finalImgLeft,
            width: finalImgSize,
            height: finalImgSize,
            duration: 0.6,
            ease: "power3.inOut"
        });

        gsap.to(animName, {
            top: finalNameTop,
            left: finalNameLeft,
            fontSize: "30px",
            duration: 0.6,
            ease: "power3.inOut"
        });

        gsap.to(animSymbol, {
            top: finalSymbolTop,
            left: finalSymbolLeft,
            fontSize: "20px",
            backgroundColor: "rgba(255,255,255,0)",
            padding: "0px 0px",
            duration: 0.6,
            ease: "power3.inOut"
        });

        gsap.to(detailCard, {
            top: targetTop,
            left: targetLeft,
            width: targetWidth,
            height: targetHeight,
            borderRadius: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            duration: 0.6,
            ease: "power3.inOut",
            onComplete: function () {
                var detailContent = document.createElement("div");
                detailContent.className = "p-8 w-full h-full flex flex-col relative";

                var percentColor = coin.price_change_percentage_24h >= 0 ? 'text-emerald' : 'text-red-500';
                var percentSign = coin.price_change_percentage_24h >= 0 ? '+' : '';
                var athColor = coin.ath_change_percentage >= 0 ? 'text-emerald' : 'text-red-500';
                var athSign = coin.ath_change_percentage >= 0 ? '+' : '';
                var atlColor = coin.atl_change_percentage >= 0 ? 'text-emerald' : 'text-red-500';
                var atlSign = coin.atl_change_percentage >= 0 ? '+' : '';
                var isFav = favoriteCoins.includes(coin.id);
                var starIconClass = isFav ? 'fa-solid text-amber' : 'fa-regular text-gray-400';

                detailContent.innerHTML = `
                    <div class="text-gray-400 text-sm mb-4">Market > <span class="text-white">${coin.name}</span></div>
                    
                    <div class="flex justify-between items-start mb-6 pb-2">
                        <div class="flex items-center gap-4" style="visibility: hidden;">
                            <div style="width:48px;height:48px"></div>
                            <div>
                                <h2 class="text-3xl font-bold text-white">${coin.name} <span class="text-gray-400 text-xl uppercase">${coin.symbol}</span></h2>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="share-btn" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white cursor-pointer">
                                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                            </button>
                            <button id="favorite-btn" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors hover:text-amber cursor-pointer">
                                <i class="${starIconClass} fa-star"></i>
                            </button>
                            <button id="close-detail-btn" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer ml-2">
                                <i class="fa-solid fa-xmark text-white"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="detail-body" class="flex-1 overflow-y-auto pr-2 opacity-0" style="overflow-y:auto;-webkit-overflow-scrolling:touch;">
                        <div class="flex flex-col pb-8">
                            <!-- Chart & Data (Full Width Now) -->
                            <div class="mb-4 lg:-mt-16 flex justify-between items-end">
                                <div>
                                    <h3 class="text-4xl lg:text-5xl font-bold text-white mb-2">${formatCurrency(coin.current_price)}</h3>
                                    <p class="font-bold text-lg ${percentColor}">
                                        ${percentSign}${(coin.price_change_percentage_24h || 0).toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                            <div class="w-full shrink-0 mb-8 relative rounded-xl overflow-hidden border border-white/10" style="height:400px;" id="tv_chart_container_${coin.symbol}">
                            </div>

                            <h3 class="text-xl font-bold text-white mb-6">Market data</h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-y-8 gap-x-4 border-t border-white/10 pt-6">
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">Market cap</p>
                                    <p class="text-lg font-semibold text-white">${formatCompact(coin.market_cap)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">Rank</p>
                                    <p class="text-lg font-semibold text-white">#${coin.market_cap_rank || '-'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">24H volume</p>
                                    <p class="text-lg font-semibold text-white">${formatCompact(coin.total_volume)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">Circulating supply</p>
                                    <p class="text-lg font-semibold text-white">${formatCompact(coin.circulating_supply)} <span class="text-xs text-gray-500 uppercase">${coin.symbol}</span></p>
                                    ${coin.max_supply ? '<p class="text-[10px] text-gray-500 mt-0.5">' + Math.round((coin.circulating_supply / coin.max_supply) * 100) + '% of total</p>' : ''}
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">All-time high</p>
                                    <p class="text-lg font-semibold text-white">${formatCurrency(coin.ath)}</p>
                                    <p class="text-sm font-bold ${athColor}">${athSign}${(coin.ath_change_percentage || 0).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">All-time low</p>
                                    <p class="text-lg font-semibold text-white">${formatCurrency(coin.atl)}</p>
                                    <p class="text-sm font-bold ${atlColor}">${atlSign}${(coin.atl_change_percentage || 0).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">Total supply</p>
                                    <p class="text-lg font-semibold text-white">${coin.total_supply ? formatCompact(coin.total_supply) : '-'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400 mb-1">Max supply</p>
                                    <p class="text-lg font-semibold text-white">${coin.max_supply ? formatCompact(coin.max_supply) : '∞'}</p>
                                </div>
                            </div>

                            <!-- Related News Section -->
                            <div class="mt-12 border-t border-white/10 pt-8 pb-4">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-xl font-bold text-white"><i class="fa-regular fa-newspaper text-tech-blue mr-2"></i>Berita <span class="text-tech-blue">${coin.name}</span> Terbaru</h3>
                                    <span class="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Powered by CoinDesk</span>
                                </div>
                                <div id="coin-news-container" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="col-span-full py-8 flex flex-col items-center justify-center">
                                        <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-tech-blue mb-3"></div>
                                        <p class="text-gray-500 text-sm">Menyelaraskan data dari API...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                detailCard.appendChild(detailContent);


                var coinNewsContainer = document.getElementById("coin-news-container");
                if (coinNewsContainer) {
                    fetch(API_BASE_URL + "/coin-news?coin=" + encodeURIComponent(coin.name) + "&symbol=" + encodeURIComponent(coin.symbol))
                        .then(function (res) {
                            if (!res.ok) throw new Error("Gagal mengambil berita koin");
                            return res.json();
                        })
                        .then(function (result) {
                            var articles = result.data || [];
                            if (articles.length === 0) {
                                coinNewsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-6 bg-white/5 rounded-xl border border-white/10 text-sm">Belum ada berita terbaru untuk aset ini.</div>';
                                return;
                            }
                            coinNewsContainer.innerHTML = "";
                            articles.forEach(function (article, idx) {
                                var date = new Date(article.released_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                var cardHtml = `
                                    <a href="${article.url}" target="_blank" class="glass-card p-5 rounded-xl hover:-translate-y-2 hover:bg-white/10 transition-all duration-300 group flex flex-col h-full bg-white/5 border border-white/10" style="opacity:0; transform: translateY(20px);">
                                        <div class="flex items-start justify-between mb-3">
                                            <span class="text-[10px] font-bold text-tech-blue uppercase tracking-wider bg-tech-blue/10 px-2 py-1 rounded border border-tech-blue/20">${article.source || 'Crypto'}</span>
                                            <span class="text-[10px] text-gray-400 font-mono"><i class="fa-regular fa-clock mr-1"></i>${date}</span>
                                        </div>
                                        <h4 class="text-[15px] font-bold text-white mb-2 line-clamp-2 group-hover:text-tech-blue transition-colors leading-snug">${article.title}</h4>
                                        <p class="text-xs text-gray-400 line-clamp-3 mb-4 flex-1 leading-relaxed">${article.subtitle || ''}</p>
                                        <div class="mt-auto text-xs font-semibold text-gray-300 group-hover:text-white transition-colors flex items-center gap-1">
                                            Baca di ${article.source || 'sumber'} <i class="fa-solid fa-arrow-right-long text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"></i>
                                        </div>
                                    </a>
                                `;
                                var div = document.createElement("div");
                                div.innerHTML = cardHtml;
                                var cardEl = div.firstElementChild;
                                coinNewsContainer.appendChild(cardEl);

                                gsap.to(cardEl, {
                                    opacity: 1,
                                    y: 0,
                                    duration: 0.5,
                                    delay: 0.4 + (idx * 0.1),
                                    ease: "power2.out"
                                });
                            });
                        })
                        .catch(function (err) {
                            console.error("News fetch error:", err);
                            coinNewsContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-6 text-sm bg-white/5 rounded-xl border border-white/10">Pastikan Backend eksternal Anda (212.227.65.132:11930) sudah di-update dengan endpoint /api/coin-news.</div>';
                        });
                }

                var favBtn = document.getElementById("favorite-btn");
                favBtn.onclick = function () {
                    var idx = favoriteCoins.indexOf(coin.id);
                    var newIsFav = false;
                    if (idx > -1) {
                        favoriteCoins.splice(idx, 1);
                    } else {
                        favoriteCoins.push(coin.id);
                        newIsFav = true;
                    }
                    localStorage.setItem("coin_favorites", JSON.stringify(favoriteCoins));
                    favBtn.querySelector("i").className = (newIsFav ? "fa-solid text-amber" : "fa-regular text-gray-400") + " fa-star";
                    updateTable();
                };

                var shareBtn = document.getElementById("share-btn");
                shareBtn.onclick = function () {
                    var shareData = {
                        title: coin.name + " (" + coin.symbol.toUpperCase() + ") di CoinSight AI",
                        text: "Lihat data pasar terkini untuk " + coin.name + ". Harga saat ini: " + formatCurrency(coin.current_price) + " dengan perubahan " + (coin.price_change_percentage_24h || 0).toFixed(2) + "% dalam 24 jam terakhir.",
                        url: window.location.href
                    };

                    var icon = shareBtn.querySelector("i");

                    if (navigator.share) {
                        navigator.share(shareData).catch(function (err) {
                            console.log("Error sharing:", err);
                        });
                    } else {
                        var copyText = shareData.title + "\\n" + shareData.text + "\\n" + shareData.url;
                        navigator.clipboard.writeText(copyText).then(function () {
                            icon.className = "fa-solid fa-check text-emerald";
                            setTimeout(function () {
                                icon.className = "fa-solid fa-arrow-up-from-bracket";
                            }, 2000);
                        }).catch(function (err) {
                            console.error("Could not copy text: ", err);
                        });
                    }
                };

                gsap.to(document.getElementById("detail-body"), {
                    opacity: 1, duration: 0.3, onComplete: function () {
                        var detailBody = document.getElementById("detail-body");
                        var tvContainer = document.getElementById("tv_chart_container_" + coin.symbol);

                        if (tvContainer && detailBody) {
                            var scrollOverlay = document.createElement("div");
                            scrollOverlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;cursor:grab;";
                            scrollOverlay.style.background = "transparent";
                            tvContainer.style.position = "relative";
                            tvContainer.appendChild(scrollOverlay);

                            var isDragging = false;
                            var lastY = 0;

                            scrollOverlay.addEventListener("wheel", function (e) {
                                e.preventDefault();
                                detailBody.scrollTop += e.deltaY;
                            }, { passive: false });

                            scrollOverlay.addEventListener("touchstart", function (e) {
                                if (e.touches.length === 1) {
                                    isDragging = true;
                                    lastY = e.touches[0].clientY;
                                }
                            }, { passive: true });

                            scrollOverlay.addEventListener("touchmove", function (e) {
                                if (isDragging && e.touches.length === 1) {
                                    var deltaY = lastY - e.touches[0].clientY;
                                    lastY = e.touches[0].clientY;
                                    detailBody.scrollTop += deltaY;
                                    e.preventDefault();
                                }
                            }, { passive: false });

                            scrollOverlay.addEventListener("touchend", function () {
                                isDragging = false;
                            }, { passive: true });

                            scrollOverlay.addEventListener("dblclick", function () {
                                scrollOverlay.style.pointerEvents = "none";
                                var hint = document.createElement("div");
                                hint.style.cssText = "position:absolute;top:8px;right:8px;z-index:20;background:rgba(0,0,0,0.7);color:#10b981;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;pointer-events:none;";
                                hint.textContent = "Chart aktif — klik di luar chart untuk kembali scroll";
                                tvContainer.appendChild(hint);
                                gsap.to(hint, { opacity: 0, delay: 3, duration: 0.5, onComplete: function () { hint.remove(); } });

                                var reEnable = function (ev) {
                                    if (!tvContainer.contains(ev.target)) {
                                        scrollOverlay.style.pointerEvents = "";
                                        document.removeEventListener("click", reEnable);
                                    }
                                };
                                setTimeout(function () {
                                    document.addEventListener("click", reEnable);
                                }, 100);
                            });
                        }

                        if (window.TradingView) {
                            new window.TradingView.widget({
                                "autosize": true,
                                "symbol": "BINANCE:" + coin.symbol.toUpperCase() + "USDT",
                                "interval": "D",
                                "timezone": "Etc/UTC",
                                "theme": "dark",
                                "style": "1",
                                "locale": "en",
                                "enable_publishing": false,
                                "backgroundColor": "rgba(15, 23, 42, 0)",
                                "gridColor": "rgba(255, 255, 255, 0.05)",
                                "hide_top_toolbar": false,
                                "hide_legend": false,
                                "save_image": false,
                                "container_id": "tv_chart_container_" + coin.symbol
                            });
                        }
                    }
                });

                var closeAction = function () {
                    var url = new URL(window.location);
                    url.searchParams.delete('coin');
                    window.history.pushState({}, '', url);

                    gsap.to(document.getElementById("detail-body"), { opacity: 0, duration: 0.2 });
                    gsap.to(document.getElementById("close-detail-btn"), { opacity: 0, duration: 0.2 });

                    var currentRow = document.getElementById("row-" + coin.id);
                    var currentRect = currentRow ? currentRow.getBoundingClientRect() : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

                    var cWrapEl = currentRow ? (currentRow.querySelector(".coin-logo-wrap") || currentRow.querySelector("td > div > div:first-child")) : null;
                    var cNameEl = currentRow ? (currentRow.querySelector(".coin-name-text") || currentRow.querySelector("span.font-bold")) : null;
                    var cSymbolEl = currentRow ? (currentRow.querySelector(".coin-symbol-text") || currentRow.querySelector("span.font-mono")) : null;

                    var origImgRect = cWrapEl ? cWrapEl.getBoundingClientRect() : currentRect;
                    var origNameRect = cNameEl ? cNameEl.getBoundingClientRect() : currentRect;
                    var origSymbolRect = cSymbolEl ? cSymbolEl.getBoundingClientRect() : currentRect;

                    gsap.to(animImgWrap, {
                        top: origImgRect.top,
                        left: origImgRect.left,
                        width: origImgRect.width,
                        height: origImgRect.height,
                        opacity: currentRow ? 1 : 0,
                        duration: 0.6,
                        ease: "power3.inOut"
                    });

                    gsap.to(animName, {
                        top: origNameRect.top,
                        left: origNameRect.left,
                        fontSize: "16px",
                        opacity: currentRow ? 1 : 0,
                        duration: 0.6,
                        ease: "power3.inOut"
                    });

                    gsap.to(animSymbol, {
                        top: origSymbolRect.top,
                        left: origSymbolRect.left,
                        fontSize: "12px",
                        padding: "4px 8px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        opacity: currentRow ? 1 : 0,
                        duration: 0.6,
                        ease: "power3.inOut"
                    });

                    gsap.to(overlay, {
                        backgroundColor: "rgba(0,0,0,0)",
                        backdropFilter: "blur(0px)",
                        duration: 0.6,
                        ease: "power3.inOut",
                        onComplete: () => overlay.remove()
                    });

                    gsap.to(detailCard, {
                        top: currentRect.top,
                        left: currentRect.left,
                        width: currentRow ? currentRect.width : 0,
                        height: currentRow ? currentRect.height : 0,
                        borderRadius: "0.5rem",
                        boxShadow: "none",
                        opacity: currentRow ? 1 : 0,
                        duration: 0.6,
                        ease: "power3.inOut",
                        onComplete: () => {
                            detailCard.remove();
                            animImgWrap.remove();
                            animName.remove();
                            animSymbol.remove();
                            if (currentRow) currentRow.style.opacity = "1";
                            document.body.style.overflow = "";
                        }
                    });
                };

                document.getElementById("close-detail-btn").onclick = closeAction;
                overlay.onclick = closeAction;
            }
        });
    }

    var _currentSlideState = 0;

    function renderTable(coins) {
        if (!tableBody) return;

        // Save current slide state before re-render
        if (tableBody._currentSlide !== undefined) {
            _currentSlideState = tableBody._currentSlide;
        }

        var sortedCoins = [...coins].sort(function (a, b) {
            var aFav = favoriteCoins.includes(a.id) ? 1 : 0;
            var bFav = favoriteCoins.includes(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            return 0;
        });

        var filtered = sortedCoins.slice(0, 8);

        if (filtered.length === 0) {
            tableBody.innerHTML = '<div class="py-20 text-center text-gray-500 w-full">Tidak ada koin ditemukan.</div>';
            return;
        }

        tableBody.innerHTML = "";
        filtered.forEach(function (coin, index) {
            var row = document.createElement("div");
            row.id = "row-" + coin.id;
            var isMobileView = window.innerWidth < 768;
            row.className = "market-coin-card rounded-3xl group flex flex-col cursor-pointer relative overflow-hidden" + (isMobileView ? "" : " glass-card border border-white/10");
            row.style.position = "absolute";
            row.style.top = "0";
            row.style.left = "0";
            row.style.width = "100%";
            row.style.maxWidth = isMobileView ? "calc(100vw - 60px)" : "380px";
            row.style.opacity = "0";
            row.style.pointerEvents = "none";
            row.style.zIndex = "1";
            row.style.willChange = "transform, opacity";
            row.onclick = function () {
                openCoinDetail(row, coin);
            };

            var priceChange = coin.price_change_percentage_24h || 0;
            var changeClass = priceChange >= 0 ? "text-emerald" : "text-red-500";
            var badgeBgClass = priceChange >= 0 ? "bg-emerald-500/20" : "bg-red-500/20";
            var changeIcon = priceChange >= 0 ? "fa-caret-up" : "fa-caret-down";
            var bearishBullish = priceChange >= 0 ? "BULLISH 24H" : "BEARISH 24H";

            var coinName = coin.name || "";
            var coinSymbol = coin.symbol || "";
            var fallbackHtml = coinInitialFallback(coinName, coinSymbol);
            var imgId = "coin-img-" + (coin.id || Math.random().toString(36).substr(2, 6));

            var isFav = favoriteCoins.includes(coin.id);

            var blurClass = isMobileView ? "" : " backdrop-blur-md";

            row.innerHTML =
                '<div style="height:90px;width:100%;position:relative;overflow:hidden;">' +
                '<div style="position:absolute;inset:0;display:flex;align-items:flex-end;">' + generateCardChartSVG(coin) + '</div>' +
                '</div>' +
                '<div class="p-5 md:p-6 flex flex-col h-full">' +
                '<div class="flex justify-between items-start mb-4">' +
                '<div class="bg-white/10' + blurClass + ' text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">#' + (index + 1) + '</div>' +
                (isFav ? '<i class="fa-solid fa-star text-amber bg-white/5 p-2 rounded-full border border-white/10"></i>' : '') +
                '</div>' +
                '<div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl mb-4 md:mb-6 border border-white/5 w-max' + blurClass + '">' +
                '<div class="coin-logo-wrap" id="' + imgId + '-wrap" style="flex-shrink:0;">' +
                '<img id="' + imgId + '" src="' + (coin.image || "") + '" alt="' + coinName + '" class="w-8 h-8 rounded-full" style="display:block;" />' +
                '</div>' +
                '<div>' +
                '<h3 class="coin-name-text text-white font-bold leading-tight">' + coinName + '</h3>' +
                '<p class="coin-symbol-text text-gray-400 text-[10px] uppercase font-semibold">' + coinSymbol + '</p>' +
                '</div>' +
                '</div>' +
                '<div class="flex justify-between items-center mb-3 md:mb-4">' +
                '<span class="' + changeClass + ' ' + badgeBgClass + ' text-[10px] font-bold px-3 py-1 rounded-full border border-current">' + bearishBullish + '</span>' +
                '<span class="text-gray-400 text-xs hidden sm:inline">Momentum pasar live</span>' +
                '</div>' +
                '<h2 class="text-2xl md:text-3xl font-extrabold text-white mb-2">' + formatCurrency(coin.current_price) + '</h2>' +
                '<p class="text-gray-400 text-xs md:text-sm mb-4 md:mb-5 leading-relaxed line-clamp-2 md:line-clamp-none">' +
                'Kapitalisasi pasar ' + formatCompact(coin.market_cap) + ' dengan volume 24 jam ' + formatCompact(coin.total_volume) + '. Buka kartu ini untuk melihat analisis lengkap ' + coinName + '.' +
                '</p>' +
                '<div class="grid grid-cols-3 gap-1.5 md:gap-2 mb-4 md:mb-5">' +
                '<div class="bg-white/5 p-2 md:p-3 rounded-xl text-center">' +
                '<p class="text-[8px] md:text-[9px] text-gray-500 mb-1 uppercase tracking-wider font-bold">24 JAM</p>' +
                '<p class="text-[11px] md:text-xs font-bold ' + changeClass + '">' +
                '<i class="fa-solid ' + changeIcon + ' mr-1 text-[10px]"></i>' + Math.abs(priceChange).toFixed(2) + '%' +
                '</p>' +
                '</div>' +
                '<div class="bg-white/5 p-2 md:p-3 rounded-xl text-center">' +
                '<p class="text-[8px] md:text-[9px] text-gray-500 mb-1 uppercase tracking-wider font-bold">MARKET CAP</p>' +
                '<p class="text-[11px] md:text-xs text-white font-bold">' + formatCompact(coin.market_cap) + '</p>' +
                '</div>' +
                '<div class="bg-white/5 p-2 md:p-3 rounded-xl text-center">' +
                '<p class="text-[8px] md:text-[9px] text-gray-500 mb-1 uppercase tracking-wider font-bold">VOLUME</p>' +
                '<p class="text-[11px] md:text-xs text-white font-bold">' + formatCompact(coin.total_volume) + '</p>' +
                '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 text-sm font-bold text-white group-hover:text-amber transition-colors mt-auto">' +
                'Lihat Analisis <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>' +
                '</div>' +
                '</div>';

            tableBody.appendChild(row);

            var imgEl = document.getElementById(imgId);
            if (imgEl) {
                imgEl.onerror = function () {
                    var wrap = document.getElementById(imgId + "-wrap");
                    if (wrap) {
                        wrap.innerHTML = fallbackHtml;
                    }
                };
            }
        });

        var allCards = tableBody.querySelectorAll(".market-coin-card");
        var currentSlide = Math.min(_currentSlideState, allCards.length - 1);
        if (currentSlide < 0) currentSlide = 0;
        tableBody._currentSlide = currentSlide;
        var totalSlides = allCards.length;
        var slideInterval = null;
        var isAnimating = false;
        var containerW = tableBody.offsetWidth;
        var isMobile = window.innerWidth < 768;
        var cardW = isMobile ? Math.min(containerW - 40, 340) : 380;
        var centerX = (containerW - cardW) / 2;
        var peekOffset = cardW * 0.75;

        function positionAllCards() {
            containerW = tableBody.offsetWidth;
            isMobile = window.innerWidth < 768;
            cardW = isMobile ? Math.min(containerW - 40, 340) : 380;
            centerX = (containerW - cardW) / 2;

            if (isMobile) {
                peekOffset = Math.min(cardW * 0.35, 80);
            } else {
                peekOffset = Math.min(cardW * 0.75, (containerW - cardW) / 2 - 10);
            }
            if (peekOffset < 30) peekOffset = 30;

            allCards.forEach(function (card, i) {
                card.style.maxWidth = cardW + "px";
                if (i === currentSlide) {
                    gsap.set(card, { left: centerX, scale: 1, opacity: 1, zIndex: 10, pointerEvents: "auto" });
                } else {
                    var diff = i - currentSlide;
                    if (diff > totalSlides / 2) diff -= totalSlides;
                    if (diff < -totalSlides / 2) diff += totalSlides;

                    var absDiff = Math.abs(diff);
                    var maxVisible = isMobile ? 1 : 2;
                    if (absDiff <= maxVisible) {
                        var offsetX = centerX + diff * peekOffset;
                        var sc = isMobile ? (1 - absDiff * 0.12) : (1 - absDiff * 0.08);
                        var op = isMobile ? (1 - absDiff * 0.6) : (1 - absDiff * 0.35);
                        var z = 10 - absDiff;
                        gsap.set(card, { left: offsetX, scale: sc, opacity: op, zIndex: z, pointerEvents: "none" });
                    } else {
                        gsap.set(card, { left: centerX, scale: 0.8, opacity: 0, zIndex: 1, pointerEvents: "none" });
                    }
                }
            });
        }

        var dotsContainer = document.getElementById("market-dots");
        if (dotsContainer) {
            dotsContainer.innerHTML = "";
            for (var di = 0; di < totalSlides; di++) {
                var dot = document.createElement("button");
                dot.className = "w-2.5 h-2.5 rounded-full transition-all duration-300";
                if (di === currentSlide) {
                    dot.className += " bg-emerald-400 w-6";
                } else {
                    dot.className += " bg-white/20 hover:bg-white/40";
                }
                dot.setAttribute("data-index", di);
                dot.onclick = (function (idx) {
                    return function () {
                        if (isAnimating || idx === currentSlide) return;
                        goToSlide(idx);
                        resetAutoSlide();
                    };
                })(di);
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots(activeIndex) {
            if (!dotsContainer) return;
            var dots = dotsContainer.querySelectorAll("button");
            dots.forEach(function (d, i) {
                if (i === activeIndex) {
                    d.className = "w-6 h-2.5 rounded-full bg-emerald-400 transition-all duration-300";
                } else {
                    d.className = "w-2.5 h-2.5 rounded-full bg-white/20 hover:bg-white/40 transition-all duration-300";
                }
            });
        }

        function goToSlide(nextIndex) {
            if (isAnimating) return;
            isAnimating = true;
            currentSlide = nextIndex;
            tableBody._currentSlide = currentSlide;

            containerW = tableBody.offsetWidth;
            isMobile = window.innerWidth < 768;
            cardW = isMobile ? Math.min(containerW - 40, 340) : 380;
            centerX = (containerW - cardW) / 2;
            if (isMobile) {
                peekOffset = Math.min(cardW * 0.35, 80);
            } else {
                peekOffset = Math.min(cardW * 0.75, (containerW - cardW) / 2 - 10);
            }
            if (peekOffset < 30) peekOffset = 30;

            var maxVisible = isMobile ? 1 : 2;

            allCards.forEach(function (card, i) {
                var diff = i - currentSlide;
                if (diff > totalSlides / 2) diff -= totalSlides;
                if (diff < -totalSlides / 2) diff += totalSlides;
                var absDiff = Math.abs(diff);

                card.style.maxWidth = cardW + "px";

                if (absDiff <= maxVisible) {
                    var offsetX = centerX + diff * peekOffset;
                    var sc = absDiff === 0 ? 1 : (isMobile ? (1 - absDiff * 0.12) : (1 - absDiff * 0.08));
                    var op = absDiff === 0 ? 1 : (isMobile ? (1 - absDiff * 0.6) : (1 - absDiff * 0.35));
                    var z = 10 - absDiff;

                    gsap.to(card, {
                        left: offsetX,
                        scale: sc,
                        opacity: op,
                        zIndex: z,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                    card.style.pointerEvents = absDiff === 0 ? "auto" : "none";
                } else {
                    gsap.to(card, {
                        left: centerX,
                        scale: 0.8,
                        opacity: 0,
                        zIndex: 1,
                        duration: 0.35,
                        ease: "power2.out"
                    });
                    card.style.pointerEvents = "none";
                }
            });

            updateDots(currentSlide);
            setTimeout(function () { isAnimating = false; }, 550);
        }

        function nextSlide() {
            var next = (currentSlide + 1) % totalSlides;
            goToSlide(next);
        }

        function prevSlide() {
            var prev = (currentSlide - 1 + totalSlides) % totalSlides;
            goToSlide(prev);
        }

        if (totalSlides > 0) {
            positionAllCards();
        }

        window.addEventListener("resize", function () {
            positionAllCards();
        });

        function resetAutoSlide() {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(function () {
                nextSlide();
            }, 5000);
        }

        if (window._marketSlideInterval) clearInterval(window._marketSlideInterval);
        resetAutoSlide();
        window._marketSlideInterval = slideInterval;

        var btnPrevMarket = document.getElementById("btn-prev-market");
        var btnNextMarket = document.getElementById("btn-next-market");

        if (btnPrevMarket) {
            btnPrevMarket.onclick = function () {
                if (isAnimating) return;
                prevSlide();
                resetAutoSlide();
            };
        }

        if (btnNextMarket) {
            btnNextMarket.onclick = function () {
                if (isAnimating) return;
                nextSlide();
                resetAutoSlide();
            };
        }

        var wrapper = document.getElementById("market-slideshow-wrapper");
        if (wrapper) {
            wrapper.addEventListener("mouseenter", function () {
                if (slideInterval) clearInterval(slideInterval);
            });
            wrapper.addEventListener("mouseleave", function () {
                resetAutoSlide();
            });

            // Touch swipe support for mobile
            var touchStartX = 0;
            var touchStartY = 0;
            var touchMoved = false;
            wrapper.addEventListener("touchstart", function (e) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchMoved = false;
                if (slideInterval) clearInterval(slideInterval);
            }, { passive: true });

            wrapper.addEventListener("touchmove", function (e) {
                if (!touchStartX) return;
                var deltaX = e.touches[0].clientX - touchStartX;
                var deltaY = e.touches[0].clientY - touchStartY;
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                    touchMoved = true;
                    e.preventDefault();
                }
            }, { passive: false });

            wrapper.addEventListener("touchend", function (e) {
                if (!touchMoved) {
                    resetAutoSlide();
                    return;
                }
                var touchEndX = e.changedTouches[0].clientX;
                var diffX = touchEndX - touchStartX;
                if (Math.abs(diffX) > 40) {
                    if (diffX < 0) {
                        nextSlide();
                    } else {
                        prevSlide();
                    }
                }
                touchStartX = 0;
                touchStartY = 0;
                touchMoved = false;
                resetAutoSlide();
            }, { passive: true });
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", debounce(function () {
            updateTable();
        }, 300));
    }

    fetchCryptoData();
    setInterval(fetchCryptoData, 60000);
})();



(function () {

    var NEWS_API_URL = "https://skidibi-toilet.jovancion.workers.dev/api/news";

    function estimateReadTime(text) {
        var words = (text || "").split(/\s+/).length;
        var mins = Math.max(1, Math.round(words / 200));
        return mins + " min read";
    }

    function getRandomCategory() {
        var cats = ["Market", "DeFi", "Analysis", "NFT", "Regulation", "Altcoin"];
        return cats[Math.floor(Math.random() * cats.length)];
    }

    function buildFeaturedCard(article) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
        var title = article.title || "Berita Crypto Terbaru";
        var subtitle = article.subtitle || "";
        var url = article.url || "#";
        var date = new Date(article.released_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        var source = article.source || "Crypto News";
        var readTime = estimateReadTime(subtitle);
        var cat = getRandomCategory();

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.className = "group relative block w-full h-full rounded-3xl overflow-hidden border border-white/10 hover:border-tech-blue/40 transition-all duration-500 shadow-lg hover:shadow-[0_0_40px_rgba(30,58,138,0.25)]";
        a.style.minHeight = "420px";
        a.innerHTML = `
            <div class="absolute inset-0">
                <img src="${coverUrl}" alt="Featured News" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10"></div>
                <div class="absolute inset-0 bg-tech-blue/10 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
            <div class="relative z-10 flex flex-col h-full p-7" style="min-height:420px;">
                <div class="flex items-center gap-2 mb-auto">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-tech-blue text-white tracking-wider uppercase">${cat}</span>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/50 border border-white/10 text-white tracking-wide uppercase">FEATURED</span>
                </div>
                <div class="mt-auto">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-xs font-bold text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">${source}</span>
                        <span class="text-xs text-gray-400 font-mono"><i class="fa-regular fa-clock mr-1"></i>${date}</span>
                        <span class="text-xs text-gray-500 font-mono">${readTime}</span>
                    </div>
                    <h3 class="text-xl lg:text-2xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors line-clamp-3">${title}</h3>
                    <p class="text-sm text-gray-300/80 line-clamp-2 mb-4">${subtitle}</p>
                    <div class="inline-flex items-center gap-2 text-sm font-bold text-blue-300 group-hover:text-white transition-colors">
                        Baca Artikel <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
                    </div>
                </div>
            </div>
        `;
        return a;
    }

    function buildSideCard(article, isTop) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
        var title = article.title || "Berita Crypto";
        var subtitle = article.subtitle || "";
        var url = article.url || "#";
        var date = new Date(article.released_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        var source = article.source || "Crypto News";
        var cat = getRandomCategory();

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.className = "group flex gap-4 rounded-2xl glass-card border border-white/10 hover:border-tech-blue/40 transition-all duration-500 overflow-hidden hover:shadow-[0_0_25px_rgba(30,58,138,0.2)] hover:-translate-y-0.5 flex-1";
        a.innerHTML = `
            <div class="relative w-28 sm:w-36 shrink-0 overflow-hidden" style="min-height:120px;">
                <img src="${coverUrl}" alt="News" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-600" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-tech-blue/90 text-white uppercase tracking-wide">${cat}</span>
            </div>
            <div class="flex flex-col justify-center p-4 min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">${source}</span>
                    <span class="text-[10px] text-gray-500 font-mono"><i class="fa-regular fa-clock mr-0.5"></i>${date}</span>
                </div>
                <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-200 transition-colors mb-1.5 leading-snug">${title}</h3>
                <p class="text-xs text-gray-400 line-clamp-2">${subtitle}</p>
                <div class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-blue-300 transition-colors">
                    Baca <i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                </div>
            </div>
        `;
        return a;
    }

    function buildTickerCard(article) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
        var title = article.title || "Berita Crypto";
        var subtitle = article.subtitle || "";
        var url = article.url || "#";
        var date = new Date(article.released_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        var source = article.source || "Crypto News";
        var cat = getRandomCategory();

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.className = "group news-ticker-card flex flex-col rounded-2xl overflow-hidden border border-white/10 hover:border-tech-blue/40 transition-all duration-400 shrink-0 hover:shadow-[0_0_20px_rgba(30,58,138,0.2)] hover:-translate-y-1";
        a.style.cssText = "width:230px;background:rgba(255,255,255,0.04);";
        a.innerHTML = `
            <div class="relative h-28 overflow-hidden shrink-0">
                <img src="${coverUrl}" alt="News" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 border border-white/10 text-white uppercase tracking-wide backdrop-blur-sm">${cat}</span>
            </div>
            <div class="p-3 flex flex-col flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wide truncate">${source}</span>
                    <span class="text-[9px] text-gray-500 font-mono ml-auto shrink-0">${date}</span>
                </div>
                <h4 class="text-xs font-bold text-white line-clamp-3 group-hover:text-blue-200 transition-colors leading-snug flex-1">${title}</h4>
                <div class="mt-2 flex items-center gap-1 text-[10px] font-semibold text-gray-500 group-hover:text-blue-400 transition-colors">
                    Baca <i class="fa-solid fa-arrow-right text-[9px] transition-transform group-hover:translate-x-1"></i>
                </div>
            </div>
        `;
        return a;
    }

    function startTickerScroll(track) {
        var isPaused = false;
        var speed = 0.6;

        track.addEventListener("mouseenter", function () { isPaused = true; });
        track.addEventListener("mouseleave", function () { isPaused = false; });
        track.addEventListener("touchstart", function () { isPaused = true; }, { passive: true });
        track.addEventListener("touchend", function () { isPaused = false; });

        function step() {
            if (!isPaused && track.scrollWidth > track.clientWidth) {
                track.scrollLeft += speed;
                if (track.scrollLeft >= (track.scrollWidth - track.clientWidth - 1)) {
                    track.scrollLeft = 0;
                }
            }
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    async function fetchNews() {
        var loader = document.getElementById("news-loader");
        var mainGrid = document.getElementById("news-main-grid");
        var featuredSlot = document.getElementById("news-featured");
        var sideStack = document.getElementById("news-side-stack");
        var tickerTrack = document.getElementById("news-ticker-track");

        if (!loader || !mainGrid) return;

        try {
            var response = await fetchWithTimeout(NEWS_API_URL);
            if (!response.ok) throw new Error("Gagal mengambil data berita");
            var result = await response.json();
            var articles = result.data || [];

            loader.style.display = "none";
            mainGrid.classList.remove("hidden");

            if (articles.length === 0) {
                mainGrid.innerHTML = '<div class="py-10 text-center text-gray-500">Tidak ada berita saat ini.</div>';
                return;
            }

            if (featuredSlot && articles[0]) {
                var fc = buildFeaturedCard(articles[0]);
                gsap.set(fc, { opacity: 0, y: 30 });
                featuredSlot.appendChild(fc);
                gsap.to(fc, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });
            }

            if (sideStack) {
                [articles[1], articles[2]].forEach(function (article, i) {
                    if (!article) return;
                    var sc = buildSideCard(article, i === 0);
                    gsap.set(sc, { opacity: 0, x: 30 });
                    sideStack.appendChild(sc);
                    gsap.to(sc, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out", delay: 0.2 + i * 0.15 });
                });
            }

            if (tickerTrack && articles.length > 3) {
                var tickerArticles = articles.slice(3);
                var allTickerArticles = tickerArticles.length >= 4 ? [...tickerArticles, ...tickerArticles] : tickerArticles;
                allTickerArticles.forEach(function (article, i) {
                    var tc = buildTickerCard(article);
                    gsap.set(tc, { opacity: 0, y: 20 });
                    tickerTrack.appendChild(tc);
                    gsap.to(tc, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.4 + i * 0.06 });
                });
                startTickerScroll(tickerTrack);
            } else if (tickerTrack) {
                tickerTrack.parentElement.style.display = "none";
            }

        } catch (error) {
            console.error("Error fetching news:", error);
            if (loader) loader.style.display = "none";
            if (mainGrid) {
                mainGrid.classList.remove("hidden");
                mainGrid.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-10 glass-card rounded-3xl border border-white/10 text-center px-6">
                        <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-white mb-2">Gagal Memuat Berita</h3>
                        <p class="text-gray-400 max-w-md mx-auto">Terjadi kesalahan pada backend server. Harap coba lagi nanti.</p>
                    </div>
                `;
            }
        }
    }

    fetchNews();

    setInterval(fetchNews, 15 * 60 * 1000);
})();


document.addEventListener("DOMContentLoaded", function () {
    var sectionsToObserve = [
        { id: "market-data", links: document.querySelectorAll('a[href="#market-data"], a[href="home.html#market-data"]') },
        { id: "news", links: document.querySelectorAll('a[href="news.html"]') },
        { id: "fitur", links: document.querySelectorAll('a[href="#fitur"], a[href="home.html#fitur"]') }
    ];

    var navObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                sectionsToObserve.forEach(function (sec) {
                    if (entry.target.id === sec.id) {
                        if (entry.isIntersecting) {
                            sec.links.forEach(function (link) {
                                link.classList.add("nav-active");
                                if (!link._isHovered) {
                                    gsap.to(link, { scale: 1.15, color: "#ffffff", duration: 0.3, ease: "power2.out" });
                                }
                            });
                        } else {
                            sec.links.forEach(function (link) {
                                link.classList.remove("nav-active");
                                if (!link._isHovered) {
                                    gsap.to(link, { scale: 1, color: "", duration: 0.3, ease: "power2.out", clearProps: "color" });
                                }
                            });
                        }
                    }
                });
            });
        },
        { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sectionsToObserve.forEach(function (sec) {
        var sectionEl = document.getElementById(sec.id);
        if (sectionEl) {
            navObserver.observe(sectionEl);
        }
    });

    // Initialize Reviews
    initReviews();
});

// ----------------------------------------------------
// Review System
// ----------------------------------------------------
const initialReviews = [
    { id: 1, name: "Budi Santoso", avatar: "B", rating: 5, comment: "Sangat membantu untuk pemula seperti saya. Analisanya mudah dipahami!" },
    { id: 2, name: "Siti Rahma", avatar: "S", rating: 4, comment: "Fitur live market-nya sangat responsif. Ditunggu fitur AI Match-Up nya!" },
    { id: 3, name: "Andi Wijaya", avatar: "A", rating: 5, comment: "UI/UX nya sangat modern dan gampang digunakan. Sangat merekomendasikan aplikasi ini." }
];

function initReviews() {
    const reviewsGrid = document.getElementById("reviews-carousel");
    const loginPrompt = document.getElementById("login-prompt-review");
    const addReviewContainer = document.getElementById("add-review-container");
    const totalReviewsEl = document.getElementById("total-reviews");

    if (!reviewsGrid) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
        loginPrompt.classList.add("hidden");
        addReviewContainer.classList.remove("hidden");
    } else {
        loginPrompt.classList.remove("hidden");
        addReviewContainer.classList.add("hidden");
    }

    let savedReviews = JSON.parse(localStorage.getItem("appReviews"));
    if (!savedReviews || savedReviews.length === 0) {
        savedReviews = [...initialReviews];
        localStorage.setItem("appReviews", JSON.stringify(savedReviews));
    }

    renderReviews(savedReviews);
    totalReviewsEl.innerText = savedReviews.length;
    setupReviewForm(savedReviews);
}

function createReviewCard(review) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-solid fa-star ${i <= review.rating ? 'text-amber' : 'text-gray-600'}"></i>`;
    }

    const card = document.createElement('div');
    card.className = "min-w-[320px] md:min-w-[380px] glass-card p-6 rounded-3xl border border-white/10 hover:-translate-y-1 transition-transform review-card shrink-0";
    const colors = ['bg-tech-blue', 'bg-emerald', 'bg-amber', 'bg-purple-500', 'bg-pink-500'];
    const avatarColor = colors[review.name.length % colors.length];

    card.innerHTML = `
    <div class="flex items-center gap-4 mb-4">
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md ${avatarColor}">
        ${review.avatar}
      </div>
      <div>
        <h4 class="font-bold text-white">${review.name}</h4>
        <div class="flex gap-1 text-sm">
          ${starsHtml}
        </div>
      </div>
    </div>
    <p class="text-gray-400 text-sm leading-relaxed">"${review.comment}"</p>
  `;
    return card;
}

function renderReviews(reviews) {
    const reviewsCarousel = document.getElementById("reviews-carousel");
    reviewsCarousel.innerHTML = '';

    const reversedReviews = [...reviews].reverse();

    reversedReviews.forEach(function (review) {
        reviewsCarousel.appendChild(createReviewCard(review));
    });

    if (reversedReviews.length >= 2) {
        reversedReviews.forEach(function (review) {
            reviewsCarousel.appendChild(createReviewCard(review));
        });
    }

    const reviewCards = reviewsCarousel.querySelectorAll(".review-card");

    reviewCards.forEach(function (card) {
        gsap.set(card, { opacity: 0, y: 30 });
    });

    const reviewObserver = new IntersectionObserver(
        function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const idx = Array.from(reviewCards).indexOf(card);
                    gsap.to(card, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        delay: idx * 0.15,
                        ease: "power3.out",
                        overwrite: "auto",
                        clearProps: "all"
                    });
                    observer.unobserve(card);
                }
            });
        },
        { root: null, rootMargin: "0px", threshold: 0.1 }
    );

    reviewCards.forEach(function (card) {
        reviewObserver.observe(card);
    });

    const btnPrev = document.getElementById("btn-prev-review");
    const btnNext = document.getElementById("btn-next-review");

    if (reviewsCarousel) {
        reviewsCarousel.style.scrollBehavior = "auto";

        var scrollSpeed = 0.8;
        var isPaused = false;
        var isButtonAnimating = false;
        var autoScrollRAF = null;
        var totalOriginalWidth = 0;

        reversedReviews.forEach(function () {
            totalOriginalWidth += 344;
        });

        function autoScrollStep() {
            if (!isPaused && !isButtonAnimating && reviewsCarousel.scrollWidth > reviewsCarousel.clientWidth) {
                reviewsCarousel.scrollLeft += scrollSpeed;
                if (reversedReviews.length >= 2 && reviewsCarousel.scrollLeft >= totalOriginalWidth) {
                    reviewsCarousel.scrollLeft -= totalOriginalWidth;
                } else if (reviewsCarousel.scrollLeft >= (reviewsCarousel.scrollWidth - reviewsCarousel.clientWidth - 1)) {
                    reviewsCarousel.scrollLeft = 0;
                }
            }
            autoScrollRAF = requestAnimationFrame(autoScrollStep);
        }

        autoScrollRAF = requestAnimationFrame(autoScrollStep);

        reviewsCarousel.addEventListener('mouseenter', function () { isPaused = true; });
        reviewsCarousel.addEventListener('mouseleave', function () { isPaused = false; });
        reviewsCarousel.addEventListener('touchstart', function () { isPaused = true; }, { passive: true });
        reviewsCarousel.addEventListener('touchend', function () { isPaused = false; });

        if (btnPrev && btnNext) {
            var cardWidth = 350;

            btnPrev.addEventListener("click", function () {
                if (isButtonAnimating) return;
                isButtonAnimating = true;

                var targetScroll = Math.max(0, reviewsCarousel.scrollLeft - cardWidth);

                gsap.to(reviewsCarousel, {
                    scrollLeft: targetScroll,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onComplete: function () {
                        setTimeout(function () { isButtonAnimating = false; }, 800);
                    }
                });
            });

            btnNext.addEventListener("click", function () {
                if (isButtonAnimating) return;
                isButtonAnimating = true;

                var maxScroll = reviewsCarousel.scrollWidth - reviewsCarousel.clientWidth;
                var targetScroll = reviewsCarousel.scrollLeft + cardWidth;

                if (targetScroll >= maxScroll) {
                    targetScroll = 0;
                }

                gsap.to(reviewsCarousel, {
                    scrollLeft: targetScroll,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onComplete: function () {
                        setTimeout(function () { isButtonAnimating = false; }, 800);
                    }
                });
            });
        }
    }
}

function setupReviewForm(reviews) {
    const form = document.getElementById("review-form");
    const starIcons = document.querySelectorAll("#star-rating-input i");
    const ratingInput = document.getElementById("selected-rating");
    const commentInput = document.getElementById("review-text");

    if (!form) return;

    starIcons.forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = parseInt(e.target.dataset.rating);
            ratingInput.value = rating;

            starIcons.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.remove('text-gray-600');
                    s.classList.add('text-amber');
                } else {
                    s.classList.remove('text-amber');
                    s.classList.add('text-gray-600');
                }
            });
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = ratingInput.value;
        const comment = commentInput.value.trim();
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        if (!rating) {
            showToast("Silakan pilih rating terlebih dahulu.", "warning");
            return;
        }

        if (!currentUser) {
            showToast("Sesi login tidak ditemukan. Silakan login ulang.", "error");
            return;
        }

        const newReview = {
            id: Date.now(),
            name: currentUser.name,
            avatar: currentUser.name.charAt(0).toUpperCase(),
            rating: parseInt(rating),
            comment: comment
        };

        reviews.push(newReview);
        localStorage.setItem("appReviews", JSON.stringify(reviews));

        form.reset();
        ratingInput.value = '';
        starIcons.forEach(s => {
            s.classList.remove('text-amber');
            s.classList.add('text-gray-600');
        });

        renderReviews(reviews);
        document.getElementById("total-reviews").innerText = reviews.length;

        showToast("Terima kasih! Review Anda berhasil ditambahkan.", "success");
    });
}

