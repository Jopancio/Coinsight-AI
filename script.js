
var debounce = (function (existing) {

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
                    scale: 1,
                    duration: 0.7,
                    delay: (idx % 2) * 0.15,
                    ease: "back.out(1.7)"
                });
                observer.unobserve(entry.target);
            }
        });
    },
    { root: null, rootMargin: "0px", threshold: 0.1 }
);

cardList.forEach(function (card) {
    gsap.set(card, { opacity: 0, y: 30, scale: 0.93 });
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
                    filter: "blur(0px)",
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
    gsap.set(sec, { opacity: 0, y: 40, filter: "blur(10px)" });
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

    var activeSortMode = "default";
    var _firstPulseRender = true;

    function renderMarketPulse() {
        var pulseBar = document.getElementById("market-pulse-bar");
        var sortTabs = document.getElementById("mkt-sort-tabs");
        var coinsBadge = document.getElementById("mkt-coins-badge");
        var coinsCount = document.getElementById("mkt-coins-count");
        if (!allCoins.length) return;

        var totalMktCap = allCoins.reduce(function (s, c) { return s + (c.market_cap || 0); }, 0);
        var totalVol = allCoins.reduce(function (s, c) { return s + (c.total_volume || 0); }, 0);
        var gainers = allCoins.filter(function (c) { return (c.price_change_percentage_24h || 0) > 0; }).length;
        var losers = allCoins.filter(function (c) { return (c.price_change_percentage_24h || 0) < 0; }).length;

        var fmt = new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD" });

        var mktCapEl = document.getElementById("pulse-mktcap");
        var volEl = document.getElementById("pulse-vol");
        var gainersEl = document.getElementById("pulse-gainers");
        var losersEl = document.getElementById("pulse-losers");

        var isFirstPulse = _firstPulseRender;
        if (isFirstPulse) { _firstPulseRender = false; }

        if (pulseBar) {
            pulseBar.style.display = "block";
            pulseBar.classList.remove("hidden");
            if (isFirstPulse) {
                var statCards = pulseBar.querySelectorAll(".glass-card");
                gsap.from(statCards, { opacity: 0, y: 22, scale: 0.88, duration: 0.55, stagger: 0.09, ease: "back.out(1.6)" });
            }
        }
        if (sortTabs) { sortTabs.style.display = "flex"; sortTabs.classList.remove("hidden"); }
        if (coinsBadge) { coinsBadge.style.display = "inline-flex"; coinsBadge.classList.remove("hidden"); }
        if (coinsCount) coinsCount.textContent = allCoins.length;

        if (isFirstPulse) {
            if (mktCapEl) {
                var mc = { val: 0 };
                gsap.to(mc, { val: totalMktCap, duration: 1.6, ease: "power2.out", delay: 0.3, onUpdate: function () { mktCapEl.textContent = fmt.format(mc.val); } });
            }
            if (volEl) {
                var vl = { val: 0 };
                gsap.to(vl, { val: totalVol, duration: 1.5, ease: "power2.out", delay: 0.45, onUpdate: function () { volEl.textContent = fmt.format(vl.val); } });
            }
            if (gainersEl) {
                var gn = { val: 0 };
                gsap.to(gn, { val: gainers, duration: 1.2, ease: "power2.out", delay: 0.55, onUpdate: function () { gainersEl.textContent = Math.round(gn.val) + " koin"; } });
            }
            if (losersEl) {
                var ls = { val: 0 };
                gsap.to(ls, { val: losers, duration: 1.2, ease: "power2.out", delay: 0.65, onUpdate: function () { losersEl.textContent = Math.round(ls.val) + " koin"; } });
            }
        } else {
            if (mktCapEl) mktCapEl.textContent = fmt.format(totalMktCap);
            if (volEl) volEl.textContent = fmt.format(totalVol);
            if (gainersEl) gainersEl.textContent = gainers + " koin";
            if (losersEl) losersEl.textContent = losers + " koin";
        }

        function moveSortSlider(activeBtn) {
            var slider = document.getElementById("mkt-sort-slider");
            if (!slider || !activeBtn) return;
            var toggle = activeBtn.parentElement;
            var toggleRect = toggle.getBoundingClientRect();
            var btnRect = activeBtn.getBoundingClientRect();
            slider.style.width = btnRect.width + "px";
            slider.style.transform = "translateX(" + (btnRect.left - toggleRect.left - 3) + "px)";
        }

        var sortInitActive = document.querySelector(".mkt-sort-pill.active");
        if (sortInitActive) {
            requestAnimationFrame(function () { moveSortSlider(sortInitActive); });
        }

        document.querySelectorAll(".mkt-sort-pill").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (btn.dataset.sort === activeSortMode) return;
                activeSortMode = btn.dataset.sort;
                document.querySelectorAll(".mkt-sort-pill").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                moveSortSlider(btn);

                var sliderEl = document.getElementById("mkt-sort-slider");
                if (sliderEl) {
                    gsap.fromTo(sliderEl,
                        { boxShadow: "0 0 22px rgba(16,185,129,0.95), 0 0 8px rgba(16,185,129,0.6)" },
                        { boxShadow: "0 0 14px rgba(16,185,129,0.45)", duration: 0.7, ease: "power3.out" }
                    );
                }

                var wrapper = document.getElementById("market-slideshow-wrapper");
                if (wrapper) {
                    gsap.to(wrapper, {
                        opacity: 0, scale: 0.97, duration: 0.22, ease: "power2.in",
                        onComplete: function () {
                            gsap.set(wrapper, { opacity: 1, scale: 1 });
                            window._nextRenderStagger = true;
                            updateTable();
                        }
                    });
                } else {
                    updateTable();
                }
            });
        });
    }

    function updateTable() {
        var term = searchInput ? searchInput.value.toLowerCase() : "";
        var filtered = allCoins.slice();
        if (term) {
            filtered = filtered.filter(function (coin) {
                return coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term);
            });
        }
        if (activeSortMode === "gainers") {
            filtered = filtered.slice().sort(function (a, b) { return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0); });
        } else if (activeSortMode === "losers") {
            filtered = filtered.slice().sort(function (a, b) { return (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0); });
        }
        renderTable(filtered);
    }

    async function fetchCryptoData() {
        try {
            var response = await fetchWithTimeout(API_BASE_URL + "/coins");
            allCoins = await response.json();
            renderHeroMockup();
            renderMarketPulse();
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
        document.documentElement.style.overflow = "hidden";

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
        overlay.style.overscrollBehavior = "contain";
        overlay.addEventListener("touchmove", function(e) { e.preventDefault(); }, { passive: false });
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
            animImgWrap.innerHTML = '<img src="' + coin.image + '" class="w-8 h-8 rounded-full" loading="lazy" onerror="this.style.display=\'none\'" />';
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

gsap.set(detailCard, { filter: "blur(12px)", transformOrigin: "center center" });

        gsap.to(overlay, {
            backgroundColor: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(12px)",
            duration: 0.5,
            ease: "expo.out"
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
            duration: 0.68,
            ease: "back.out(1.5)"
        });

gsap.set(animName, { opacity: 0 });
        gsap.to(animName, {
            top: finalNameTop,
            left: finalNameLeft,
            fontSize: "30px",
            opacity: 1,
            duration: 0.55,
            ease: "expo.out",
            delay: 0.07
        });

gsap.set(animSymbol, { opacity: 0 });
        gsap.to(animSymbol, {
            top: finalSymbolTop,
            left: finalSymbolLeft,
            fontSize: "20px",
            backgroundColor: "rgba(255,255,255,0)",
            padding: "0px 0px",
            opacity: 1,
            duration: 0.5,
            ease: "expo.out",
            delay: 0.12
        });

        gsap.to(detailCard, {
            top: targetTop,
            left: targetLeft,
            width: targetWidth,
            height: targetHeight,
            borderRadius: "2rem",
            filter: "blur(0px)",
            boxShadow: "0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
            duration: 0.58,
            ease: "expo.out",
            onComplete: function () {
                var detailContent = document.createElement("div");
                detailContent.className = "p-8 w-full h-full flex flex-col relative";

                var percentSign = coin.price_change_percentage_24h >= 0 ? '+' : '';
                var athSign = coin.ath_change_percentage >= 0 ? '+' : '';
                var atlSign = coin.atl_change_percentage >= 0 ? '+' : '';
                var isFav = favoriteCoins.includes(coin.id);
                var starIconClass = isFav ? 'fa-solid text-amber' : 'fa-regular text-gray-400';

var modalIsUp      = coin.price_change_percentage_24h >= 0;
                var modalAccent    = modalIsUp ? '#10b981' : '#ef4444';
                var modalAccentRgb = modalIsUp ? '16,185,129' : '239,68,68';
                var modalAccentDim = modalIsUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
                var modal24hPct    = (coin.low_24h && coin.high_24h && coin.high_24h > coin.low_24h)
                    ? Math.max(2, Math.min(98, Math.round(((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h)) * 100)))
                    : 50;
                var modalSupplyPct = (coin.max_supply && coin.circulating_supply)
                    ? Math.round((coin.circulating_supply / coin.max_supply) * 100) : null;
                var athProximity   = Math.max(2, Math.min(98, 100 + (coin.ath_change_percentage || 0)));
                var athValueColor  = coin.ath_change_percentage >= 0 ? '#10b981' : '#ef4444';
                var atlValueColor  = coin.atl_change_percentage >= 0 ? '#10b981' : '#ef4444';
                var athDateStr     = coin.ath_date ? new Date(coin.ath_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                var atlDateStr     = coin.atl_date ? new Date(coin.atl_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                detailContent.innerHTML = `
                    <!-- Breadcrumb -->
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                        <span style="font-size:12px;color:#475569;font-weight:600;">Market</span>
                        <i class="fa-solid fa-chevron-right" style="font-size:8px;color:#334155;"></i>
                        <span style="font-size:12px;color:#f1f5f9;font-weight:700;">${coin.name}</span>
                        <span style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:2px 9px;font-size:9px;text-transform:uppercase;font-weight:800;color:#64748b;letter-spacing:0.1em;">${coin.symbol}</span>
                        <span style="background:${modalAccentDim};border:1px solid ${modalAccent}40;border-radius:6px;padding:2px 9px;font-size:9px;font-weight:800;color:${modalAccent};letter-spacing:0.06em;">${modalIsUp ? 'BULLISH' : 'BEARISH'} 24H</span>
                    </div>

                    <!-- Header row: invisible logo placeholder + action buttons -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
                        <div style="display:flex;align-items:center;gap:16px;visibility:hidden;">
                            <div style="width:48px;height:48px;"></div>
                            <div>
                                <h2 style="font-size:1.875rem;font-weight:700;color:white;">${coin.name} <span style="color:#94a3b8;font-size:1.25rem;text-transform:uppercase;">${coin.symbol}</span></h2>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button id="share-btn" style="width:40px;height:40px;border-radius:9999px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='white';" onmouseout="this.style.background='transparent';this.style.color='#64748b';">
                                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                            </button>
                            <button id="favorite-btn" style="width:40px;height:40px;border-radius:9999px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.background='transparent';">
                                <i class="${starIconClass} fa-star"></i>
                            </button>
                            <button id="close-detail-btn" style="width:40px;height:40px;border-radius:9999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;transition:all 0.2s;margin-left:8px;" onmouseover="this.style.background='rgba(255,255,255,0.15)';" onmouseout="this.style.background='rgba(255,255,255,0.07)';">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Scrollable body -->
                    <div id="detail-body" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;opacity:0;padding-right:4px;">
                        <div style="display:flex;flex-direction:column;padding-bottom:40px;gap:0;">

                            <!-- ── PRICE OVERVIEW CARD ───────────────────────────── -->
                            <div style="margin-bottom:20px;margin-top:0;padding:22px 26px 20px;background:linear-gradient(135deg,rgba(${modalAccentRgb},0.07) 0%,transparent 70%);border:1px solid rgba(${modalAccentRgb},0.18);border-radius:20px;position:relative;overflow:hidden;">
                                <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:8rem;font-weight:900;color:rgba(255,255,255,0.022);letter-spacing:-5px;user-select:none;pointer-events:none;font-family:ui-monospace,monospace;line-height:1;">${(coin.symbol||'').toUpperCase()}</div>
                                <!-- Price + change badge -->
                                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;position:relative;flex-wrap:wrap;gap:12px;">
                                    <div>
                                        <p style="font-size:10px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.12em;margin-bottom:8px;">Harga Saat Ini</p>
                                        <h3 style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;color:#f8fafc;line-height:1;letter-spacing:-0.03em;">${formatCurrency(coin.current_price)}</h3>
                                    </div>
                                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding-top:6px;">
                                        <div style="display:inline-flex;align-items:center;gap:7px;background:${modalAccentDim};border:1px solid ${modalAccent}50;border-radius:14px;padding:9px 16px;">
                                            <i class="fa-solid fa-caret-${modalIsUp ? 'up' : 'down'}" style="font-size:15px;color:${modalAccent};"></i>
                                            <span style="font-size:17px;font-weight:900;color:${modalAccent};">${percentSign}${(coin.price_change_percentage_24h||0).toFixed(2)}%</span>
                                        </div>
                                        <span style="font-size:10px;color:#475569;font-weight:600;">vs 24 jam lalu</span>
                                    </div>
                                </div>
                                <!-- 24H range bar with thumb -->
                                <div>
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                        <span style="font-size:10px;color:#f87171;font-family:ui-monospace,monospace;font-weight:700;">${formatCurrency(coin.low_24h || 0)}</span>
                                        <span style="font-size:9px;color:#475569;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">24H Range</span>
                                        <span style="font-size:10px;color:#34d399;font-family:ui-monospace,monospace;font-weight:700;">${formatCurrency(coin.high_24h || 0)}</span>
                                    </div>
                                    <div style="position:relative;height:8px;border-radius:9999px;background:rgba(255,255,255,0.07);">
                                        <div style="position:absolute;top:0;left:0;height:100%;border-radius:9999px;width:${modal24hPct}%;background:linear-gradient(to right,${modalAccent}40,${modalAccent});"></div>
                                        <div style="position:absolute;top:50%;left:${modal24hPct}%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:9999px;background:${modalAccent};border:3px solid #0f172a;box-shadow:0 0 12px ${modalAccent};"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- ── TRADINGVIEW CHART ─────────────────────────────── -->
                            <div style="width:100%;flex-shrink:0;margin-bottom:24px;position:relative;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);height:400px;" id="tv_chart_container_${coin.symbol}"></div>

                            <!-- ── MARKET OVERVIEW ──────────────────────────────── -->
                            <div style="margin-bottom:24px;">
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                                    <div style="width:3px;height:20px;border-radius:9999px;background:${modalAccent};"></div>
                                    <h3 style="font-size:15px;font-weight:800;color:#f1f5f9;letter-spacing:-0.01em;">Market Overview</h3>
                                    <div style="flex:1;height:1px;background:rgba(255,255,255,0.06);"></div>
                                    <span style="font-size:9px;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${coin.name}</span>
                                </div>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                                    <!-- Market Cap -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-chart-pie" style="font-size:13px;color:#60a5fa;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Mkt Cap</span>
                                        </div>
                                        <p style="font-size:19px;font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.market_cap)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Kapitalisasi Pasar</p>
                                    </div>
                                    <!-- Rank -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-trophy" style="font-size:13px;color:#f59e0b;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Rank</span>
                                        </div>
                                        <p style="font-size:19px;font-weight:900;color:#f1f5f9;line-height:1;">#${coin.market_cap_rank || '-'}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Peringkat Global</p>
                                    </div>
                                    <!-- Volume 24H -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(168,85,247,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-fire" style="font-size:13px;color:#a855f7;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Volume 24H</span>
                                        </div>
                                        <p style="font-size:19px;font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.total_volume)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Total Perdagangan</p>
                                    </div>
                                    <!-- Circulating Supply -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-circle-dot" style="font-size:13px;color:#10b981;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Beredar</span>
                                        </div>
                                        <p style="font-size:17px;font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.circulating_supply)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">${(coin.symbol||'').toUpperCase()} · ${modalSupplyPct !== null ? modalSupplyPct + '% of max' : 'No max supply'}</p>
                                        ${modalSupplyPct !== null ? '<div style="margin-top:8px;height:4px;border-radius:9999px;background:rgba(255,255,255,0.07);overflow:hidden;"><div style="height:100%;width:' + modalSupplyPct + '%;background:linear-gradient(to right,rgba(16,185,129,0.5),#10b981);border-radius:9999px;"></div></div>' : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- ── HISTORICAL RECORDS ────────────────────────────── -->
                            <div style="margin-bottom:24px;">
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                                    <div style="width:3px;height:20px;border-radius:9999px;background:linear-gradient(to bottom,#10b981,#ef4444);"></div>
                                    <h3 style="font-size:15px;font-weight:800;color:#f1f5f9;letter-spacing:-0.01em;">Harga Historis</h3>
                                    <div style="flex:1;height:1px;background:rgba(255,255,255,0.06);"></div>
                                </div>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px;">
                                    <!-- ATH Card -->
                                    <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.22);border-radius:14px;padding:18px;position:relative;overflow:hidden;">
                                        <div style="position:absolute;top:-8px;right:-4px;font-size:4.5rem;font-weight:900;color:rgba(16,185,129,0.05);user-select:none;line-height:1;font-family:ui-monospace,monospace;pointer-events:none;">ATH</div>
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                                            <div style="width:32px;height:32px;border-radius:10px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-arrow-trend-up" style="font-size:12px;color:#10b981;"></i></div>
                                            <div>
                                                <p style="font-size:9px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Record Tertinggi</p>
                                                <p style="font-size:9px;color:#475569;">${athDateStr}</p>
                                            </div>
                                        </div>
                                        <p style="font-size:20px;font-weight:900;color:#f1f5f9;margin-bottom:6px;">${formatCurrency(coin.ath)}</p>
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                                            <span style="font-size:12px;font-weight:800;color:${athValueColor};">${athSign}${(coin.ath_change_percentage||0).toFixed(2)}%</span>
                                            <span style="font-size:10px;color:#475569;">dari ATH</span>
                                        </div>
                                        <div style="height:5px;border-radius:9999px;background:rgba(255,255,255,0.07);">
                                            <div style="height:100%;width:${athProximity}%;background:linear-gradient(to right,rgba(16,185,129,0.4),#10b981);border-radius:9999px;"></div>
                                        </div>
                                    </div>
                                    <!-- ATL Card -->
                                    <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.22);border-radius:14px;padding:18px;position:relative;overflow:hidden;">
                                        <div style="position:absolute;top:-8px;right:-4px;font-size:4.5rem;font-weight:900;color:rgba(239,68,68,0.05);user-select:none;line-height:1;font-family:ui-monospace,monospace;pointer-events:none;">ATL</div>
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                                            <div style="width:32px;height:32px;border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-arrow-trend-down" style="font-size:12px;color:#ef4444;"></i></div>
                                            <div>
                                                <p style="font-size:9px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:0.1em;">Record Terendah</p>
                                                <p style="font-size:9px;color:#475569;">${atlDateStr}</p>
                                            </div>
                                        </div>
                                        <p style="font-size:20px;font-weight:900;color:#f1f5f9;margin-bottom:6px;">${formatCurrency(coin.atl)}</p>
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                                            <span style="font-size:12px;font-weight:800;color:${atlValueColor};">${atlSign}${(coin.atl_change_percentage||0).toFixed(2)}%</span>
                                            <span style="font-size:10px;color:#475569;">dari ATL</span>
                                        </div>
                                        <p style="font-size:10px;color:#475569;">Terendah sepanjang masa</p>
                                    </div>
                                </div>
                                <!-- Total + Max Supply -->
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;">
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                                            <div style="width:30px;height:30px;border-radius:9px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-database" style="font-size:12px;color:#818cf8;"></i></div>
                                            <p style="font-size:9px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Total Supply</p>
                                        </div>
                                        <p style="font-size:18px;font-weight:900;color:#f1f5f9;">${coin.total_supply ? formatCompact(coin.total_supply) : '-'}</p>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;">
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                                            <div style="width:30px;height:30px;border-radius:9px;background:rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-infinity" style="font-size:12px;color:#a78bfa;"></i></div>
                                            <p style="font-size:9px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Max Supply</p>
                                        </div>
                                        <p style="font-size:18px;font-weight:900;color:#f1f5f9;">${coin.max_supply ? formatCompact(coin.max_supply) : '∞'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- ── RELATED NEWS ──────────────────────────────────── -->
                            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:32px;padding-bottom:16px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="width:3px;height:20px;border-radius:9999px;background:#3b82f6;"></div>
                                        <h3 style="font-size:15px;font-weight:800;color:#f1f5f9;">Berita <span style="color:#60a5fa;">${coin.name}</span> Terbaru</h3>
                                    </div>
                                    <span style="font-size:9px;color:#475569;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:4px 10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Powered by CoinDesk</span>
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
                            coinNewsContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-6 text-sm bg-white/5 rounded-xl border border-white/10">Terjadi kesalahan pada server kami. Harap coba lagi nanti.</div>';
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

                var _db = document.getElementById("detail-body");
                var _iw = _db && _db.firstElementChild;
                var _secs = _iw ? Array.from(_iw.children) : [];
                gsap.set(_db, { opacity: 1 });
                if (_secs.length > 0) {
                    gsap.fromTo(_secs,
                        { opacity: 0, y: 24, filter: "blur(5px)" },
                        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.52, ease: "expo.out", stagger: 0.07 }
                    );
                }
                gsap.to(_db, { opacity: 1, duration: 0.01, onComplete: function () {
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

                    gsap.to(document.getElementById("detail-body"), { opacity: 0, y: -10, duration: 0.15, ease: "power2.in", overwrite: true });
                    gsap.to(document.getElementById("close-detail-btn"), { opacity: 0, scale: 0.75, duration: 0.12, ease: "power2.in" });

                    var currentRow = rowElement && rowElement.isConnected ? rowElement : document.getElementById("row-" + coin.id);
                    var currentRect = currentRow ? currentRow.getBoundingClientRect() : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

                    var cWrapEl = currentRow ? (
                        currentRow.querySelector(".coin-logo-wrap") ||
                        currentRow.querySelector("td > div > div:first-child")
                    ) : null;
                    var cNameEl = currentRow ? (currentRow.querySelector(".coin-name-text") || currentRow.querySelector("span.font-bold")) : null;
                    var cSymbolEl = currentRow ? (currentRow.querySelector(".coin-symbol-text") || currentRow.querySelector("span.font-mono")) : null;

                    var origImgRect = cWrapEl ? cWrapEl.getBoundingClientRect() : currentRect;

gsap.to(animImgWrap, {
                        top: origImgRect.top,
                        left: origImgRect.left,
                        width: origImgRect.width,
                        height: origImgRect.height,
                        opacity: currentRow ? 1 : 0,
                        duration: 0.48,
                        ease: "power3.out"
                    });

gsap.to(animName, { opacity: 0, duration: 0.2, ease: "power2.in" });
                    gsap.to(animSymbol, { opacity: 0, duration: 0.16, ease: "power2.in" });

                    gsap.to(overlay, {
                        backgroundColor: "rgba(0,0,0,0)",
                        backdropFilter: "blur(0px)",
                        duration: 0.42,
                        ease: "power3.out",
                        onComplete: () => overlay.remove()
                    });

gsap.to(detailCard, {
                        top: currentRect.top,
                        left: currentRect.left,
                        width: currentRow ? currentRect.width : 0,
                        height: currentRow ? currentRect.height : 0,
                        borderRadius: "0.5rem",
                        boxShadow: "none",
                        filter: "blur(10px)",
                        opacity: currentRow ? 0.5 : 0,
                        duration: 0.45,
                        ease: "power3.out",
                        onComplete: () => {
                            detailCard.remove();
                            animImgWrap.remove();
                            animName.remove();
                            animSymbol.remove();
                            if (currentRow) currentRow.style.opacity = "1";
                            document.body.style.overflow = "";
                            document.documentElement.style.overflow = "";
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

if (tableBody._currentSlide !== undefined) {
            _currentSlideState = tableBody._currentSlide;
        }

        var sortedCoins = [...coins].sort(function (a, b) {
            var aFav = favoriteCoins.includes(a.id) ? 1 : 0;
            var bFav = favoriteCoins.includes(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
        });

        var filtered = sortedCoins.slice(0, 5);

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
            row.setAttribute("data-slide-index", index);
            row.onclick = function () {
                var myIndex = parseInt(row.getAttribute("data-slide-index"));
                if (tableBody._currentSlide === myIndex) {
                    openCoinDetail(row, coin);
                } else {
                    goToSlide(myIndex);
                    resetAutoSlide();
                }
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

            var rangePct = (coin.low_24h && coin.high_24h && coin.high_24h > coin.low_24h)
                ? Math.max(2, Math.min(98, Math.round(((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h)) * 100)))
                : 50;

            var isUp        = priceChange >= 0;
            var accentColor = isUp ? "#10b981"       : "#ef4444";
            var accentDim   = isUp ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";
            var accentRgb   = isUp ? "16,185,129"    : "239,68,68";

var absPct = Math.abs(priceChange);
            var signalLabel, signalIcon, signalColor, signalBg;
            if (isUp) {
                if (absPct >= 10) { signalLabel = "Strong Bull"; signalIcon = "fa-rocket";         signalColor = "#10b981"; signalBg = "rgba(16,185,129,0.15)"; }
                else if (absPct >= 3) { signalLabel = "Bullish";   signalIcon = "fa-arrow-trend-up"; signalColor = "#34d399"; signalBg = "rgba(16,185,129,0.12)"; }
                else               { signalLabel = "Naik Tipis"; signalIcon = "fa-caret-up";      signalColor = "#6ee7b7"; signalBg = "rgba(16,185,129,0.09)"; }
            } else {
                if (absPct >= 10) { signalLabel = "Strong Bear"; signalIcon = "fa-skull";               signalColor = "#ef4444"; signalBg = "rgba(239,68,68,0.15)"; }
                else if (absPct >= 3) { signalLabel = "Bearish";    signalIcon = "fa-arrow-trend-down"; signalColor = "#f87171"; signalBg = "rgba(239,68,68,0.12)"; }
                else               { signalLabel = "Turun Tipis"; signalIcon = "fa-caret-down";        signalColor = "#fca5a5"; signalBg = "rgba(239,68,68,0.09)"; }
            }

            var aiScore = Math.max(8, Math.min(95, Math.round(50 + priceChange * 4)));
            var aiScoreColor = aiScore >= 65 ? "#10b981" : (aiScore >= 45 ? "#f59e0b" : "#ef4444");
            var aiScoreLabel = aiScore >= 65 ? "Bullish" : (aiScore >= 45 ? "Netral" : "Bearish");
            var athPct = typeof coin.ath_change_percentage === "number" ? coin.ath_change_percentage : 0;
            var athPctColor = athPct >= -5 ? "#10b981" : (athPct >= -20 ? "#f59e0b" : "#ef4444");
            var athPctStr = (athPct >= 0 ? "+" : "") + athPct.toFixed(1) + "%";

            row.innerHTML =

                '<div style="height:135px;width:100%;position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(' + accentRgb + ',0.1) 0%,rgba(' + accentRgb + ',0.03) 60%,transparent 100%);border-top:2px solid ' + accentColor + '50;">'
                + '<div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:5.5rem;font-weight:900;line-height:1;color:rgba(255,255,255,0.028);letter-spacing:-3px;user-select:none;pointer-events:none;font-family:ui-monospace,monospace;">' + (coinSymbol || "").toUpperCase() + '</div>'
                + '<div style="position:absolute;inset:0;display:flex;align-items:flex-end;">' + generateCardChartSVG(coin) + '</div>'
                + '<div style="position:absolute;top:10px;right:12px;background:' + accentDim + ';backdrop-filter:blur(10px);border:1px solid ' + accentColor + '50;border-radius:9999px;padding:3px 11px;font-size:9px;font-weight:800;color:' + accentColor + ';letter-spacing:0.05em;">' + bearishBullish + '</div>'
                + '<div style="position:absolute;bottom:10px;left:12px;display:flex;align-items:center;gap:5px;">'
                + '<span style="width:6px;height:6px;border-radius:9999px;background:' + accentColor + ';box-shadow:0 0 7px ' + accentColor + ';display:inline-block;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>'
                + '<span style="font-size:8px;font-weight:800;color:rgba(255,255,255,0.45);letter-spacing:0.1em;">LIVE</span>'
                + '</div>'
                + (isFav ? '<span style="position:absolute;bottom:9px;right:12px;"><i class="fa-solid fa-star" style="font-size:11px;color:#f59e0b;filter:drop-shadow(0 0 6px rgba(245,158,11,0.9));"></i></span>' : '')
                + '</div>'

                + '<div style="padding:15px 16px 14px;display:flex;flex-direction:column;flex:1;">'

                + '<div style="display:flex;align-items:center;gap:11px;margin-bottom:13px;">'
                + '<div class="coin-logo-wrap" id="' + imgId + '-wrap" style="flex-shrink:0;width:42px;height:42px;border-radius:9999px;padding:2.5px;background:linear-gradient(135deg,' + accentColor + '60,' + accentColor + '20);box-shadow:0 0 14px ' + accentColor + '35;">'
                + '<div style="width:100%;height:100%;background:#0f172a;border-radius:9999px;display:flex;align-items:center;justify-content:center;overflow:hidden;">'
                + '<img id="' + imgId + '" src="' + (coin.image || "") + '" alt="' + coinName + '" loading="lazy" style="width:100%;height:100%;border-radius:9999px;object-fit:cover;display:block;" />'
                + '</div></div>'
                + '<div style="flex:1;min-width:0;">'
                + '<h3 class="coin-name-text" style="font-size:15px;font-weight:800;color:#f1f5f9;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + coinName + '</h3>'
                + '<p class="coin-symbol-text" style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.1em;margin-top:2px;">' + (coinSymbol || "").toUpperCase() + '</p>'
                + '</div>'
                + '<div style="flex-shrink:0;display:inline-flex;align-items:center;gap:6px;background:' + signalBg + ';border:1px solid ' + signalColor + '40;border-radius:9999px;padding:6px 12px;">'
                + '<i class="fa-solid ' + signalIcon + '" style="font-size:10px;color:' + signalColor + ';"></i>'
                + '<span style="font-size:9px;font-weight:900;color:' + signalColor + ';white-space:nowrap;letter-spacing:0.04em;text-transform:uppercase;">' + signalLabel + '</span>'
                + '</div>'
                + '</div>'

                + '<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:13px;gap:8px;">'
                + '<div>'
                + '<p style="font-size:9px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.09em;margin-bottom:4px;">Harga Saat Ini</p>'
                + '<h2 style="font-size:clamp(1.15rem,3.5vw,1.5rem);font-weight:900;color:#f8fafc;line-height:1;letter-spacing:-0.03em;">' + formatCurrency(coin.current_price) + '</h2>'
                + '</div>'
                + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;padding-bottom:2px;">'
                + '<div style="display:inline-flex;align-items:center;gap:5px;background:' + accentDim + ';border:1px solid ' + accentColor + '45;border-radius:8px;padding:6px 12px;">'
                + '<i class="fa-solid ' + changeIcon + '" style="font-size:11px;color:' + accentColor + ';"></i>'
                + '<span style="font-size:14px;font-weight:900;color:' + accentColor + ';">' + Math.abs(priceChange).toFixed(2) + '%</span>'
                + '</div>'
                + '<span style="font-size:8.5px;color:#475569;">vs 24 jam lalu</span>'
                + '</div>'
                + '</div>'

                + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">'
                + '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:8px 8px;display:flex;flex-direction:column;gap:3px;">'
                + '<div style="display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-chart-pie" style="font-size:9px;color:#60a5fa;"></i><p style="font-size:7.5px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Mkt Cap</p></div>'
                + '<p style="font-size:11px;color:#f1f5f9;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + formatCompact(coin.market_cap) + '</p>'
                + '</div>'
                + '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:8px 8px;display:flex;flex-direction:column;gap:3px;">'
                + '<div style="display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-bolt" style="font-size:9px;color:#f59e0b;"></i><p style="font-size:7.5px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Volume</p></div>'
                + '<p style="font-size:11px;color:#f1f5f9;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + formatCompact(coin.total_volume) + '</p>'
                + '</div>'
                + '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:8px 8px;display:flex;flex-direction:column;gap:3px;">'
                + '<div style="display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-trophy" style="font-size:9px;color:#a78bfa;"></i><p style="font-size:7.5px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">dari ATH</p></div>'
                + '<p style="font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + athPctColor + ';">' + athPctStr + '</p>'
                + '</div>'
                + '</div>'

                + '<div style="margin-bottom:12px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">'
                + '<span style="font-size:8px;color:#f87171;font-family:ui-monospace,monospace;font-weight:600;">' + formatCurrency(coin.low_24h || 0) + '</span>'
                + '<span style="font-size:8px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">24H Range</span>'
                + '<span style="font-size:8px;color:#34d399;font-family:ui-monospace,monospace;font-weight:600;">' + formatCurrency(coin.high_24h || 0) + '</span>'
                + '</div>'
                + '<div style="position:relative;height:5px;border-radius:9999px;background:rgba(255,255,255,0.07);">'
                + '<div class="range-bar-fill" data-target="' + rangePct + '" style="position:absolute;top:0;left:0;height:100%;border-radius:9999px;width:0%;background:linear-gradient(to right,' + accentColor + '35,' + accentColor + ');"></div>'
                + '<div class="range-bar-dot" data-target="' + rangePct + '" style="position:absolute;top:50%;left:0%;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:9999px;background:' + accentColor + ';border:2.5px solid #0f172a;box-shadow:0 0 8px ' + accentColor + ';"></div>'
                + '</div>'
                + '</div>'

                + '<div style="margin-bottom:14px;">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">'
                + '<div style="display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-microchip" style="font-size:8px;color:#818cf8;"></i><span style="font-size:8px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">AI Momentum</span></div>'
                + '<div style="display:flex;align-items:center;gap:5px;"><span style="font-size:11px;font-weight:900;color:' + aiScoreColor + ';">' + aiScore + '</span><span style="font-size:8px;color:#475569;">/100</span><span style="font-size:8px;font-weight:700;color:' + aiScoreColor + ';background:rgba(255,255,255,0.05);border-radius:4px;padding:1px 6px;">' + aiScoreLabel + '</span></div>'
                + '</div>'
                + '<div style="position:relative;height:4px;border-radius:9999px;background:rgba(255,255,255,0.07);overflow:hidden;">'
                + '<div class="ai-bar-fill" data-target="' + aiScore + '" style="height:100%;border-radius:9999px;width:0%;background:linear-gradient(to right,' + aiScoreColor + '60,' + aiScoreColor + ');box-shadow:0 0 8px ' + aiScoreColor + '50;"></div>'
                + '</div>'
                + '</div>'

                + '<button class="home-card-cta-btn" style="width:100%;padding:11px 12px;border-radius:10px;background:linear-gradient(135deg,' + accentColor + '22,' + accentColor + '0c);border:1px solid ' + accentColor + '38;font-size:12px;font-weight:800;color:#f8fafc;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all 0.25s ease;letter-spacing:0.01em;" onmouseover="this.style.background=\'linear-gradient(135deg,' + accentColor + '40,' + accentColor + '18)\';this.style.borderColor=\'' + accentColor + '65\';this.style.transform=\'translateY(-1px)\';" onmouseout="this.style.background=\'linear-gradient(135deg,' + accentColor + '22,' + accentColor + '0c)\';this.style.borderColor=\'' + accentColor + '38\';this.style.transform=\'\';">'
                + '<i class="fa-solid fa-chart-line" style="font-size:11px;"></i> Lihat Analisis Lengkap <i class="fa-solid fa-arrow-right-long" style="font-size:10px;"></i>'
                + '</button>'
                + '</div>'

                + '<div style="height:3px;width:100%;background:linear-gradient(90deg,transparent 0%,' + accentColor + ' 50%,transparent 100%);opacity:0.6;"></div>';

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
                    card.classList.add("active-slide");
                    card.classList.remove("side-slide-1", "side-slide-2");
                    gsap.set(card, { left: centerX, scale: 1, opacity: 1, zIndex: 10, pointerEvents: "auto" });
                } else {
                    card.classList.remove("active-slide");
                    var diff = i - currentSlide;
                    if (diff > totalSlides / 2) diff -= totalSlides;
                    if (diff < -totalSlides / 2) diff += totalSlides;

                    var absDiff = Math.abs(diff);
                    var maxVisible = isMobile ? 1 : 2;
                    if (absDiff <= maxVisible) {
                        var offsetX = centerX + diff * peekOffset;
                        var sc = isMobile ? (1 - absDiff * 0.12) : (1 - absDiff * 0.08);
                        var z = 10 - absDiff;
                        card.classList.remove("side-slide-1", "side-slide-2");
                        if (absDiff === 1) card.classList.add("side-slide-1");
                        else if (absDiff === 2) card.classList.add("side-slide-2");
                        gsap.set(card, { left: offsetX, scale: sc, opacity: 1, zIndex: z, pointerEvents: "auto" });
                    card.style.pointerEvents = "auto";
                    card.style.cursor = "pointer";
                    } else {
                        card.classList.remove("side-slide-1", "side-slide-2");
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

        function positionAllCardsStaggered() {
            positionAllCards();
            var staggerQueue = [];
            allCards.forEach(function (card, i) {
                var diff = i - currentSlide;
                if (diff > totalSlides / 2) diff -= totalSlides;
                if (diff < -totalSlides / 2) diff += totalSlides;
                var absDiff = Math.abs(diff);
                var maxVisible = isMobile ? 1 : 2;
                if (absDiff <= maxVisible) {
                    staggerQueue.push({ card: card, absDiff: absDiff });
                }
            });
            staggerQueue.sort(function (a, b) { return a.absDiff - b.absDiff; });
            staggerQueue.forEach(function (item) {
                gsap.set(item.card, { opacity: 0, y: 80 });
            });
            staggerQueue.forEach(function (item, idx) {
                item.card.classList.remove("side-slide-1", "side-slide-2");
                if (item.absDiff === 1) item.card.classList.add("side-slide-1");
                else if (item.absDiff === 2) item.card.classList.add("side-slide-2");
                gsap.to(item.card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.55,
                    delay: idx * 0.1,
                    ease: "back.out(1.4)",
                    clearProps: "y"
                });
            });
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

        function animateCardBars(card) {
            if (!card) return;
            var aiBars = card.querySelectorAll(".ai-bar-fill");
            aiBars.forEach(function (bar) {
                var target = parseFloat(bar.getAttribute("data-target") || "50");
                gsap.fromTo(bar, { width: "0%" }, { width: target + "%", duration: 1.0, ease: "power2.out", delay: 0.12 });
            });
            var rangeBars = card.querySelectorAll(".range-bar-fill");
            rangeBars.forEach(function (bar) {
                var target = parseFloat(bar.getAttribute("data-target") || "50");
                gsap.fromTo(bar, { width: "0%" }, { width: target + "%", duration: 0.8, ease: "power2.out", delay: 0.22 });
            });
            var rangeDots = card.querySelectorAll(".range-bar-dot");
            rangeDots.forEach(function (dot) {
                var target = parseFloat(dot.getAttribute("data-target") || "50");
                gsap.fromTo(dot, { left: "0%" }, { left: target + "%", duration: 0.8, ease: "power2.out", delay: 0.22 });
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
                    var z = 10 - absDiff;

                    if (absDiff === 0) {
                        card.classList.add("active-slide");
                        card.classList.remove("side-slide-1", "side-slide-2");
                    } else {
                        card.classList.remove("active-slide");
                        card.classList.remove("side-slide-1", "side-slide-2");
                        if (absDiff === 1) card.classList.add("side-slide-1");
                        else if (absDiff === 2) card.classList.add("side-slide-2");
                    }

                    gsap.to(card, {
                        left: offsetX,
                        scale: sc,
                        opacity: 1,
                        zIndex: z,
                        y: 0,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                    card.style.pointerEvents = "auto";
                    card.style.cursor = "pointer";
                } else {
                    card.classList.remove("active-slide", "side-slide-1", "side-slide-2");
                    gsap.to(card, {
                        left: centerX,
                        scale: 0.8,
                        opacity: 0,
                        zIndex: 1,
                        y: 0,
                        duration: 0.35,
                        ease: "power2.out"
                    });
                    card.style.pointerEvents = "none";
                }
            });

            updateDots(currentSlide);
            setTimeout(function () {
                isAnimating = false;
                animateCardBars(allCards[currentSlide]);
            }, 420);
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
            if (window._nextRenderStagger) {
                window._nextRenderStagger = false;
                positionAllCardsStaggered();
            } else {
                positionAllCards();
            }
            animateCardBars(allCards[currentSlide]);
            allCards.forEach(function (card) {
                card.addEventListener("mouseenter", function () {
                    gsap.to(card, { y: -6, duration: 0.35, ease: "power2.out", overwrite: "auto" });
                });
                card.addEventListener("mouseleave", function () {
                    gsap.to(card, { y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
                });
            });
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
    var _allArticles = [];
    var _currentFilter = "all";
    var _uiInitialized = false;

    function estimateReadTime(text) {
        var words = (text || "").split(/\s+/).length;
        var mins = Math.max(1, Math.round(words / 200));
        return mins + " min read";
    }

    function getCategoryFromTitle(title) {
        var t = (title || "").toLowerCase();
        if (/defi|yield|liquidity|amm|swap|protocol|lending|staking|vault/.test(t)) return "DeFi";
        if (/nft|metaverse|gaming|collectible|opensea|mint/.test(t)) return "NFT";
        if (/regulation|sec|ban|law|legal|government|regulatory|court|ruling|policy/.test(t)) return "Regulation";
        if (/analysis|forecast|prediction|technical|chart|indicator|signal|outlook|report/.test(t)) return "Analysis";
        if (/solana|ethereum|polygon|avalanche|cardano|ripple|xrp|bnb|altcoin|ada|dot/.test(t)) return "Altcoin";
        return "Market";
    }

    var CAT_STYLE = {
        "Market":     { bg: "rgba(59,130,246,0.85)",  text: "#fff",  border: "rgba(59,130,246,0.5)"  },
        "DeFi":       { bg: "rgba(16,185,129,0.85)",  text: "#fff",  border: "rgba(16,185,129,0.5)"  },
        "Analysis":   { bg: "rgba(245,158,11,0.85)",  text: "#111",  border: "rgba(245,158,11,0.5)"  },
        "NFT":        { bg: "rgba(139,92,246,0.85)",  text: "#fff",  border: "rgba(139,92,246,0.5)"  },
        "Regulation": { bg: "rgba(239,68,68,0.85)",   text: "#fff",  border: "rgba(239,68,68,0.5)"   },
        "Altcoin":    { bg: "rgba(6,182,212,0.85)",   text: "#111",  border: "rgba(6,182,212,0.5)"   },
    };

    function catBadge(cat, extraClass) {
        var c = CAT_STYLE[cat] || CAT_STYLE["Market"];
        var cls = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide " + (extraClass || "");
        return '<span class="' + cls + '" style="background:' + c.bg + ';color:' + c.text + ';">' + cat + '</span>';
    }

    function getRelativeTime(dateStr) {
        var now = new Date();
        var past = new Date(dateStr);
        if (isNaN(past)) return "";
        var diff = Math.floor((now - past) / 1000);
        if (diff < 60)     return "Baru saja";
        if (diff < 3600)   return Math.floor(diff / 60) + " menit lalu";
        if (diff < 86400)  return Math.floor(diff / 3600) + " jam lalu";
        if (diff < 604800) return Math.floor(diff / 86400) + " hari lalu";
        return past.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }

    function isBreaking(dateStr) {
        var diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        return diff < 21600;
    }

    function buildFeaturedCard(article) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
        var title = article.title || "Berita Crypto Terbaru";
        var subtitle = article.subtitle || "";
        var url = article.url || "#";
        var relTime = getRelativeTime(article.released_at);
        var source = article.source || "Crypto News";
        var readTime = estimateReadTime(subtitle);
        var cat = article._cat || getCategoryFromTitle(title);
        var breaking = isBreaking(article.released_at);
        var c = CAT_STYLE[cat] || CAT_STYLE["Market"];
        var accentGlow = c.bg.replace("0.85", "0.07");

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "group relative block w-full h-full rounded-3xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-500 shadow-xl hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]";
        a.style.minHeight = "440px";
        a.innerHTML = `
            <div class="absolute inset-0">
                <img src="${coverUrl}" alt="Featured News" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10"></div>
                <div class="absolute inset-0 transition-opacity duration-500" style="background:linear-gradient(135deg,${accentGlow} 0%,transparent 55%);"></div>
            </div>
            <div class="relative z-10 flex flex-col h-full p-6 sm:p-7" style="min-height:440px;">
                <div class="flex items-center gap-2 mb-auto flex-wrap">
                    ${catBadge(cat)}
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white/15 border border-white/15 text-white uppercase tracking-wide backdrop-blur-sm">FEATURED</span>
                    ${breaking ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/90 text-white uppercase tracking-wide"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block"></span>Breaking</span>' : ''}
                </div>
                <div class="mt-auto">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                        <span class="text-xs font-bold text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">${source}</span>
                        <span class="text-xs text-gray-400 flex items-center gap-1"><i class="fa-regular fa-clock"></i>${relTime}</span>
                        <span class="text-xs text-gray-500 flex items-center gap-1"><i class="fa-regular fa-bookmark"></i>${readTime}</span>
                    </div>
                    <h3 class="text-xl lg:text-2xl font-extrabold text-white mb-3 leading-tight group-hover:text-blue-100 transition-colors line-clamp-3">${title}</h3>
                    <p class="text-sm text-gray-300/80 line-clamp-2 mb-5 leading-relaxed">${subtitle}</p>
                    <div class="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                        Baca Artikel <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1"></i>
                    </div>
                </div>
            </div>
        `;
        return a;
    }

    function buildSideCard(article) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
        var title = article.title || "Berita Crypto";
        var subtitle = article.subtitle || "";
        var url = article.url || "#";
        var relTime = getRelativeTime(article.released_at);
        var source = article.source || "Crypto News";
        var readTime = estimateReadTime(subtitle);
        var cat = article._cat || getCategoryFromTitle(title);
        var c = CAT_STYLE[cat] || CAT_STYLE["Market"];

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "group flex gap-0 rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 flex-1";
        a.style.background = "rgba(255,255,255,0.035)";
        a.innerHTML = `
            <div class="relative w-28 sm:w-32 shrink-0 overflow-hidden" style="min-height:130px;">
                <img src="${coverUrl}" alt="News" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/30"></div>
                <div class="absolute bottom-0 left-0 w-1 h-full" style="background:${c.bg};opacity:0.8;"></div>
            </div>
            <div class="flex flex-col justify-center px-4 py-3 min-w-0 flex-1">
                <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    ${catBadge(cat, "!text-[9px] !px-1.5 !py-0")}
                    <span class="text-[9px] font-bold text-gray-500 uppercase tracking-wide truncate">${source}</span>
                </div>
                <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-200 transition-colors mb-1.5 leading-snug">${title}</h3>
                <p class="text-xs text-gray-500 line-clamp-1 mb-2">${subtitle}</p>
                <div class="flex items-center gap-3 text-[10px] text-gray-500">
                    <span class="flex items-center gap-1"><i class="fa-regular fa-clock"></i>${relTime}</span>
                    <span class="flex items-center gap-1"><i class="fa-regular fa-bookmark"></i>${readTime}</span>
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
        var relTime = getRelativeTime(article.released_at);
        var source = article.source || "Crypto News";
        var readTime = estimateReadTime(subtitle);
        var cat = article._cat || getCategoryFromTitle(title);
        var c = CAT_STYLE[cat] || CAT_STYLE["Market"];
        var accentRaw = c.bg.replace("0.85", "1");

        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "group news-ticker-card flex flex-col rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-300 shrink-0 hover:shadow-[0_0_25px_rgba(0,0,0,0.5)] hover:-translate-y-1";
        a.style.cssText = "width:250px;background:rgba(255,255,255,0.04);";
        a.innerHTML = `
            <div class="relative h-32 overflow-hidden shrink-0">
                <img src="${coverUrl}" alt="News" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
                <div class="absolute top-0 left-0 w-full h-0.5" style="background:${c.bg};"></div>
                ${catBadge(cat, "absolute bottom-2 left-2 !text-[9px] !px-1.5 !py-0")}
            </div>
            <div class="p-3 flex flex-col flex-1">
                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="text-[9px] font-bold uppercase tracking-wide truncate flex-1" style="color:${accentRaw};">${source}</span>
                    <span class="text-[9px] text-gray-500 font-mono shrink-0 flex items-center gap-0.5"><i class="fa-regular fa-clock"></i>${relTime}</span>
                </div>
                <h4 class="text-xs font-bold text-white line-clamp-3 group-hover:text-blue-200 transition-colors leading-snug flex-1 mb-2">${title}</h4>
                <div class="flex items-center justify-between text-[9px] text-gray-500 mt-auto">
                    <span class="flex items-center gap-0.5"><i class="fa-regular fa-bookmark"></i>${readTime}</span>
                    <span class="flex items-center gap-0.5 group-hover:text-blue-400 transition-colors font-semibold">Baca <i class="fa-solid fa-arrow-right transition-transform group-hover:translate-x-0.5"></i></span>
                </div>
            </div>
        `;
        return a;
    }

    function startTickerScroll(inner, baseCount) {
        
        var duration = Math.min(90, Math.max(25, baseCount * 4));
        inner.style.cssText += ";will-change:transform;animation:news-ticker-scroll " + duration.toFixed(1) + "s linear infinite;";

        function pause()  { inner.style.animationPlayState = "paused"; }
        function resume() { inner.style.animationPlayState = "running"; }

        inner.addEventListener("mouseenter", pause);
        inner.addEventListener("mouseleave", resume);
        inner.addEventListener("touchstart", pause,  { passive: true });
        inner.addEventListener("touchend",   resume);
    }

    function renderGrid(articles) {
        var featuredSlot = document.getElementById("news-featured");
        var sideStack = document.getElementById("news-side-stack");
        var tickerTrack = document.getElementById("news-ticker-track");
        var tickerCountEl = document.getElementById("ticker-count");
        var moreRow = document.getElementById("news-more-stories");

        if (!featuredSlot || !sideStack || !tickerTrack) return;

        featuredSlot.innerHTML = "";
        sideStack.innerHTML = "";
        tickerTrack.innerHTML = "";
        tickerTrack.scrollLeft = 0;

        if (!articles.length) {
            featuredSlot.style.gridColumn = "1 / -1";
            sideStack.style.display = "none";
            featuredSlot.innerHTML = [
                '<div class="news-empty-state">',
                  '<div class="news-empty-icon-wrap">',
                    '<i class="fa-regular fa-newspaper news-empty-icon"></i>',
                    '<div class="news-empty-ping"></div>',
                  '</div>',
                  '<p class="news-empty-title">Belum ada berita di sini</p>',
                  '<p class="news-empty-sub">Kategori ini sedang kosong. Coba pilih kategori lain atau refresh halaman.</p>',
                  '<button class="news-empty-btn" onclick="document.querySelector(\'.news-filter-pill[data-cat=all]\').click()">',
                    '<i class="fa-solid fa-arrow-left mr-2"></i>Lihat Semua Berita',
                  '</button>',
                '</div>'
            ].join('');
            if (moreRow) moreRow.style.display = "none";
            return;
        }
        featuredSlot.style.gridColumn = "";
        sideStack.style.display = "";
        if (moreRow) moreRow.style.display = "";

        if (articles[0]) {
            var fc = buildFeaturedCard(articles[0]);
            gsap.set(fc, { opacity: 0, y: 20 });
            featuredSlot.appendChild(fc);
            gsap.to(fc, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.05 });
        }

        [articles[1], articles[2]].forEach(function (article, i) {
            if (!article) return;
            var sc = buildSideCard(article);
            gsap.set(sc, { opacity: 0, x: 20 });
            sideStack.appendChild(sc);
            gsap.to(sc, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out", delay: 0.15 + i * 0.1 });
        });

var tickerArticles = articles.length > 0 ? articles : [];
        if (tickerArticles.length > 0) {
            
            var inner = document.createElement("div");
            inner.id = "news-ticker-inner";
            var loopSet = tickerArticles.concat(tickerArticles).concat(tickerArticles);
            loopSet.forEach(function (article) {
                inner.appendChild(buildTickerCard(article));
            });
            tickerTrack.appendChild(inner);
            gsap.fromTo(inner, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.35 });
            if (tickerCountEl) tickerCountEl.textContent = tickerArticles.length + " artikel";
            if (moreRow) moreRow.style.display = "";
            startTickerScroll(inner, tickerArticles.length);
        } else {
            if (moreRow) moreRow.style.display = "none";
        }
    }

    async function fetchNews() {
        var loader = document.getElementById("news-loader");
        var mainGrid = document.getElementById("news-main-grid");
        var statsBar = document.getElementById("news-stats-bar");
        var articleCountEl = document.getElementById("news-article-count");
        var lastUpdatedEl = document.getElementById("news-last-updated");
        var refreshBtn = document.getElementById("news-refresh-btn");
        var filterPills = document.getElementById("news-filter-pills");
        var tickerTrack = document.getElementById("news-ticker-track");

        if (!loader || !mainGrid) return;

        try {
            var response = await fetchWithTimeout(NEWS_API_URL);
            if (!response.ok) throw new Error("Gagal mengambil data berita");
            var result = await response.json();
            var articles = result.data || [];

            articles.forEach(function (a) { a._cat = getCategoryFromTitle(a.title); });
            _allArticles = articles;

            loader.style.display = "none";
            mainGrid.classList.remove("hidden");

            if (articles.length === 0) {
                mainGrid.innerHTML = '<div class="py-10 text-center text-gray-500">Tidak ada berita saat ini.</div>';
                return;
            }

            var toShow = _currentFilter === "all" ? articles : articles.filter(function (a) { return a._cat === _currentFilter; });
            renderGrid(toShow);

if (statsBar) { statsBar.classList.remove("hidden"); statsBar.classList.add("flex"); }
            if (articleCountEl) { var sp = articleCountEl.querySelector("span"); if (sp) sp.textContent = articles.length + " artikel"; }
            if (lastUpdatedEl) {
                var now = new Date();
                lastUpdatedEl.innerHTML = '<i class="fa-regular fa-clock"></i> ' + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            }

if (filterPills && !_uiInitialized) {
                filterPills.classList.remove("hidden");
                filterPills.classList.add("flex");

                function moveNewsSlider(activeBtn) {
                    var slider = document.getElementById("news-filter-slider");
                    if (!slider || !activeBtn) return;
                    var toggle = activeBtn.parentElement;
                    var toggleRect = toggle.getBoundingClientRect();
                    var btnRect = activeBtn.getBoundingClientRect();
                    slider.style.width = btnRect.width + "px";
                    slider.style.transform = "translateX(" + (btnRect.left - toggleRect.left - 3) + "px)";
                }

var initActive = filterPills.querySelector(".news-filter-pill.active");
                if (initActive) {
                    requestAnimationFrame(function () { moveNewsSlider(initActive); });
                }

                filterPills.querySelectorAll(".news-filter-pill").forEach(function (pill) {
                    pill.addEventListener("click", function () {
                        filterPills.querySelectorAll(".news-filter-pill").forEach(function (p) { p.classList.remove("active"); });
                        pill.classList.add("active");
                        moveNewsSlider(pill);
                        _currentFilter = pill.dataset.cat;
                        var filtered = _currentFilter === "all" ? _allArticles : _allArticles.filter(function (a) { return a._cat === _currentFilter; });
                        gsap.to(mainGrid, { opacity: 0, duration: 0.18, onComplete: function () {
                            renderGrid(filtered);
                            gsap.to(mainGrid, { opacity: 1, duration: 0.28 });
                        }});
                    });
                });
            }

if (refreshBtn && !_uiInitialized) {
                refreshBtn.addEventListener("click", function () {
                    var icon = refreshBtn.querySelector("i");
                    if (icon) { icon.style.transition = "transform 0.5s"; icon.style.transform = "rotate(360deg)"; }
                    setTimeout(function () { if (icon) { icon.style.transition = ""; icon.style.transform = ""; } }, 520);
                    fetchNews();
                });
            }

            _uiInitialized = true;

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

initReviews();
});

const initialReviews = [
    { id: 1, name: "Budi Santoso", avatar: "B", rating: 5, comment: "Sangat membantu untuk pemula seperti saya. Analisanya mudah dipahami!" },
    { id: 2, name: "Siti Rahma", avatar: "S", rating: 4, comment: "Fitur live market-nya sangat responsif. Ditunggu fitur AI Match-Up nya!" },
    { id: 3, name: "Andi Wijaya", avatar: "A", rating: 5, comment: "UI/UX nya sangat modern dan gampang digunakan. Sangat merekomendasikan aplikasi ini." }
];

function initReviews() {
    const reviewsGrid = document.getElementById("reviews-carousel");
    const addReviewContainer = document.getElementById("add-review-container");
    const totalReviewsEl = document.getElementById("total-reviews");

    if (!reviewsGrid) return;

    if (addReviewContainer) addReviewContainer.classList.remove("hidden");

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
        starsHtml += `<i class="fa-solid fa-star text-xs ${i <= review.rating ? 'text-amber-400' : 'text-gray-700'}"></i>`;
    }

    const card = document.createElement('div');
    card.className = "review-card shrink-0 min-w-[240px] md:min-w-[280px] max-w-[280px] group relative rounded-2xl overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1";

    const avatarGradients = [
        'from-blue-600 to-blue-800',
        'from-emerald-500 to-teal-700',
        'from-amber-500 to-orange-600',
        'from-purple-500 to-purple-800',
        'from-pink-500 to-rose-700'
    ];
    const topBarColors = [
        'from-blue-500 via-blue-400 to-cyan-400',
        'from-emerald-500 via-teal-400 to-cyan-400',
        'from-amber-500 via-yellow-400 to-orange-400',
        'from-purple-500 via-violet-400 to-pink-400',
        'from-pink-500 via-rose-400 to-red-400'
    ];
    const glowColors = ['bg-blue-500/8', 'bg-emerald-500/8', 'bg-amber-500/8', 'bg-purple-500/8', 'bg-pink-500/8'];
    const idx = review.name.length % avatarGradients.length;

    const ratingLabels = ['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa!'];

    card.innerHTML = `
      <!-- Card BG -->
      <div class="absolute inset-0 bg-slate-900 rounded-2xl border border-white/8 group-hover:border-white/15 transition-colors duration-300"></div>
      <!-- Top accent bar -->
      <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topBarColors[idx]} opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
      <!-- Ambient glow on hover -->
      <div class="absolute inset-0 ${glowColors[idx]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

      <div class="relative z-10 p-4">
        <!-- Quote Icon + Stars row -->
        <div class="flex items-center justify-between mb-3">
          <div class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/8 transition-colors">
            <i class="fa-solid fa-quote-left text-gray-500 text-xs group-hover:text-gray-400 transition-colors"></i>
          </div>
          <div class="flex items-center gap-1">
            ${starsHtml}
            <span class="text-[10px] font-bold text-gray-600 ml-1.5">${ratingLabels[review.rating] || ''}</span>
          </div>
        </div>

        <!-- Comment -->
        <p class="text-gray-300 text-xs leading-relaxed mb-3 line-clamp-3 group-hover:text-gray-200 transition-colors">"${review.comment}"</p>

        <!-- Divider -->
        <div class="w-full h-px bg-white/6 mb-3"></div>

        <!-- Author Row -->
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradients[idx]} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 border border-white/10">
            ${review.avatar}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-white text-sm truncate">${review.name}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <i class="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
              <span class="text-[10px] text-emerald-400 font-semibold">Verified User</span>
            </div>
          </div>
          <div class="shrink-0 w-7 h-7 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <i class="fa-solid fa-thumbs-up text-gray-500 text-[10px]"></i>
          </div>
        </div>
      </div>
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
                    duration: 0.35,
                    ease: "power2.inOut",
                    onComplete: function () {
                        setTimeout(function () { isButtonAnimating = false; }, 200);
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
                    duration: 0.35,
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

            const ratingLabels = ['', 'Buruk 😞', 'Kurang 😐', 'Cukup 🙂', 'Bagus 😊', 'Luar Biasa! 🤩'];
            const labelEl = document.getElementById('rating-label');
            if (labelEl) labelEl.textContent = ratingLabels[rating] || '';

            starIcons.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.remove('text-gray-700');
                    s.classList.add('text-amber-400');
                } else {
                    s.classList.remove('text-amber-400');
                    s.classList.add('text-gray-700');
                }
            });
        });

        star.addEventListener('mouseenter', (e) => {
            const hoverRating = parseInt(e.target.dataset.rating);
            starIcons.forEach(s => {
                if (parseInt(s.dataset.rating) <= hoverRating) {
                    s.classList.add('text-amber-300');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            starIcons.forEach(s => {
                s.classList.remove('text-amber-300');
                if (parseInt(s.dataset.rating) <= currentRating) {
                    s.classList.add('text-amber-400');
                } else {
                    s.classList.remove('text-amber-400');
                    s.classList.add('text-gray-700');
                }
            });
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = ratingInput.value;
        const comment = commentInput.value.trim();
        const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { name: 'Pengguna CoinSight' };

        if (!rating) {
            showToast("Silakan pilih rating terlebih dahulu.", "warning");
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
        const labelEl = document.getElementById('rating-label');
        if (labelEl) labelEl.textContent = '';
        starIcons.forEach(s => {
            s.classList.remove('text-amber-400', 'text-amber-300');
            s.classList.add('text-gray-700');
        });

        renderReviews(reviews);
        document.getElementById("total-reviews").innerText = reviews.length;

        showToast("Terima kasih! Review Anda berhasil ditambahkan.", "success");
    });
}

