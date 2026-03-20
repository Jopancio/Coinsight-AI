
function debounce(func, wait) {
    // Prefer a shared/global debounce implementation if one already exists (e.g., from script.js)
    if (typeof window !== "undefined" &&
        typeof window.debounce === "function" &&
        window.debounce !== debounce) {
        return window.debounce(func, wait);
    }

    // Fallback: local debounce implementation if no shared version is available
    var timeout;
    return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            func.apply(context, args);
        }, wait);
    };
}

var sectionList = document.querySelectorAll(".section-fade-up");
var sectionObserver = new IntersectionObserver(
    function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                gsap.to(entry.target, { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
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

(function () {
    var API_BASE_URL = "https://skidibi-toilet.jovancion.workers.dev/api";

    var container        = document.getElementById("market-container");
    var searchInput      = document.getElementById("market-search");
    var cardBtn          = document.getElementById("view-card-btn");
    var barBtn           = document.getElementById("view-bar-btn");
    var filterTabs       = document.querySelectorAll(".market-tab");

    var topCoinsCarousel = document.getElementById("top-coins-carousel");
    var topBullishList   = document.getElementById("top-bullish-list");
    var topBearishList   = document.getElementById("top-bearish-list");
    var topVolumeList    = document.getElementById("top-volume-list");

    var statMcap      = document.getElementById("stat-total-mcap");
    var statVol       = document.getElementById("stat-total-vol");
    var statBtcDom    = document.getElementById("stat-btc-dom");
    var statCoinCount = document.getElementById("stat-coin-count");

    var allCoins          = [];
    var currentView       = "card";
    var activeFilter      = "all";
    var visibleCount      = 10;
    var LOAD_MORE_STEP    = 10;
    var lastRenderedCount = 0;

    function formatCurrency(val) {
        return new Intl.NumberFormat("en-US", {
            style: "currency", currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: val < 1 ? 6 : 2
        }).format(val || 0);
    }

    function formatCompact(val) {
        if (!val) return "$0";
        if (val >= 1e12) return "$" + (val / 1e12).toFixed(2) + "T";
        if (val >= 1e9)  return "$" + (val / 1e9).toFixed(2)  + "B";
        if (val >= 1e6)  return "$" + (val / 1e6).toFixed(2)  + "M";
        if (val >= 1e3)  return "$" + (val / 1e3).toFixed(2)  + "K";
        return "$" + val.toFixed(2);
    }

    function generateChartSVG(coin, width, height) {
        var low     = coin.low_24h  || 0;
        var high    = coin.high_24h || 0;
        var current = coin.current_price || 0;
        var change  = coin.price_change_percentage_24h || 0;

        if (high === low || high === 0) {
            return '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none"><line x1="0" y1="' + (height / 2) + '" x2="' + width + '" y2="' + (height / 2) + '" stroke="#374151" stroke-width="1" stroke-dasharray="4,4"/></svg>';
        }

        var range = high - low;
        var p = 6;
        var cH = height - p * 2;
        var rawValues;

        if (change >= 0) {
            rawValues = [
                low + range * 0.15, low + range * 0.25, low + range * 0.2,
                low + range * 0.35, low + range * 0.3,  low + range * 0.45,
                low + range * 0.4,  low + range * 0.55, low + range * 0.5,
                low + range * 0.65, low + range * 0.75, current
            ];
        } else {
            rawValues = [
                high - range * 0.05, high - range * 0.1,  high - range * 0.2,
                high - range * 0.15, high - range * 0.3,  high - range * 0.35,
                high - range * 0.4,  high - range * 0.45, high - range * 0.55,
                high - range * 0.6,  high - range * 0.7,  current
            ];
        }

        var points = [];
        for (var i = 0; i < rawValues.length; i++) {
            var x = (i / (rawValues.length - 1)) * width;
            var y = p + cH - ((rawValues[i] - low) / range) * cH;
            points.push(x.toFixed(1) + "," + y.toFixed(1));
        }

        var strokeColor = change >= 0 ? "#10b981" : "#ef4444";
        var gId         = "mc_" + Math.random().toString(36).substr(2, 6);
        var polyline    = points.join(" ");
        var fillPoints  = "0," + (p + cH) + " " + polyline + " " + width + "," + (p + cH);

        return '<svg width="100%" height="100%" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
            '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + strokeColor + '" stop-opacity="0.25"/>' +
            '<stop offset="100%" stop-color="' + strokeColor + '" stop-opacity="0"/>' +
            '</linearGradient></defs>' +
            '<polygon points="' + fillPoints + '" fill="url(#' + gId + ')"/>' +
            '<polyline points="' + polyline + '" fill="none" stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>';
    }

    function startScramble(el, scrambleFn) {
        if (!el) return function () {};
        var running = true;
        var intervalId = setInterval(function () {
            if (!running) return;
            el.textContent = scrambleFn();
        }, 80);
        return function stop() {
            running = false;
            clearInterval(intervalId);
        };
    }

    function animateCountUp(el, targetNum, formatter, duration) {
        return new Promise(function (resolve) {
            if (!el) { resolve(); return; }
            duration = duration || 1800;
            var start = null;

            function step(ts) {
                if (!start) start = ts;
                var progress = Math.min((ts - start) / duration, 1);
                var eased    = 1 - Math.pow(1 - progress, 3);
                el.textContent = formatter(targetNum * eased, progress);
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = formatter(targetNum, 1);
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    function delay(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function renderStatsBar(coins) {
        if (!coins.length) return;
        var totalMcap = coins.reduce(function (s, c) { return s + (c.market_cap || 0); }, 0);
        var totalVol  = coins.reduce(function (s, c) { return s + (c.total_volume || 0); }, 0);
        var btc       = coins.find(function (c) { return c.symbol && c.symbol.toLowerCase() === "btc"; });
        var btcDomPct = btc && totalMcap ? (btc.market_cap / totalMcap) * 100 : 0;

        function rndCompact() {
            var units = ["T", "B", "M"];
            var unit  = units[Math.floor(Math.random() * units.length)];
            return "$" + (Math.random() * 999).toFixed(2) + unit;
        }
        function rndPct() {
            return (Math.random() * 99).toFixed(1) + "%";
        }
        function rndInt() {
            return Math.floor(Math.random() * 9000 + 100).toString();
        }

        var stopVol   = startScramble(statVol,      rndCompact);
        var stopDom   = startScramble(statBtcDom,   rndPct);
        var stopCount = startScramble(statCoinCount, rndInt);

        animateCountUp(statMcap, totalMcap, function (v) {
            return formatCompact(v);
        }, 2600)
        .then(function () { return delay(1500); })
        .then(function () {
            stopVol();
            return animateCountUp(statVol, totalVol, function (v) {
                return formatCompact(v);
            }, 1800);
        })
        .then(function () { return delay(1500); })
        .then(function () {
            stopDom();
            return animateCountUp(statBtcDom, btcDomPct, function (v) {
                if (!btc || !totalMcap) return "–";
                return v.toFixed(1) + "%";
            }, 1800);
        })
        .then(function () { return delay(1500); })
        .then(function () {
            stopCount();
            return animateCountUp(statCoinCount, coins.length, function (v) {
                return Math.round(v).toString();
            }, 1800);
        });
    }

    function renderTopCoins(coins) {
        if (!topCoinsCarousel) return;
        var top20 = coins.slice()
            .sort(function (a, b) { return (b.market_cap || 0) - (a.market_cap || 0); })
            .slice(0, 20);

        function buildChip(coin) {
            var change = coin.price_change_percentage_24h || 0;
            var isUp   = change >= 0;
            var color  = isUp ? "text-emerald"                              : "text-red-400";
            var border = isUp ? "border-emerald/20 hover:border-emerald/50" : "border-red-500/20 hover:border-red-400/50";
            var icon   = isUp ? "fa-caret-up"                               : "fa-caret-down";

            var chip = document.createElement("button");
            chip.className = "shrink-0 w-36 glass-card rounded-2xl border " + border + " p-3 flex flex-col gap-1 cursor-pointer transition-all hover:-translate-y-1 text-left";
            chip.onclick   = function () {
                if (window.openCoinDetail) window.openCoinDetail(chip, coin);
            };
            chip.innerHTML =
                '<div class="flex items-center gap-2">' +
                '<img src="' + (coin.image || "") + '" alt="' + coin.name + '" class="w-6 h-6 rounded-full" onerror="this.style.display=\'none\'" />' +
                '<span class="text-xs font-bold text-white uppercase">' + (coin.symbol || "").toUpperCase() + '</span>' +
                '</div>' +
                '<p class="text-sm font-extrabold text-white leading-tight">' + formatCurrency(coin.current_price) + '</p>' +
                '<p class="text-[11px] font-bold ' + color + '"><i class="fa-solid ' + icon + ' mr-0.5"></i>' + Math.abs(change).toFixed(2) + '%</p>';
            return chip;
        }

        var inner = document.createElement("div");
        inner.className = "market-ticker-inner";

        top20.forEach(function (coin) { inner.appendChild(buildChip(coin)); });
        top20.forEach(function (coin) { inner.appendChild(buildChip(coin)); });

        topCoinsCarousel.innerHTML = "";
        topCoinsCarousel.className = "market-ticker-wrap";
        topCoinsCarousel.appendChild(inner);
    }

    function renderMiniList(listEl, coins, colorClass, iconClass) {
        if (!listEl) return;

        function buildRow(coin, i) {
            var row = document.createElement("button");
            row.className = "w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer text-left shrink-0";
            row.onclick   = function () {
                if (window.openCoinDetail) window.openCoinDetail(row, coin);
            };

            var change = coin.price_change_percentage_24h || 0;
            var vol    = coin.total_volume || 0;
            var label;
            if (colorClass === "text-blue-400") {
                label = '<span class="' + colorClass + ' font-bold text-xs">' + formatCompact(vol) + '</span>';
            } else {
                label = '<span class="' + colorClass + ' font-bold text-xs"><i class="fa-solid ' + iconClass + ' mr-0.5 text-[10px]"></i>' + Math.abs(change).toFixed(2) + '%</span>';
            }

            row.innerHTML =
                '<span class="text-[10px] text-gray-600 font-bold w-4 shrink-0">' + (i + 1) + '</span>' +
                '<img src="' + (coin.image || "") + '" alt="' + coin.name + '" class="w-6 h-6 rounded-full shrink-0" onerror="this.style.display=\'none\'" />' +
                '<span class="text-xs font-semibold text-white flex-1 truncate">' + coin.name + '</span>' +
                label;
            return row;
        }

        var inner = document.createElement("div");
        inner.className = "market-mini-scroll-inner flex flex-col gap-1";

        coins.forEach(function (coin, i) { inner.appendChild(buildRow(coin, i)); });
        coins.forEach(function (coin, i) { inner.appendChild(buildRow(coin, i)); });

        var wrap = document.createElement("div");
        wrap.className = "market-mini-scroll-wrap";
        wrap.appendChild(inner);

        listEl.innerHTML = "";
        listEl.appendChild(wrap);
    }

    function renderHighlights(coins) {
        renderStatsBar(coins);
        renderTopCoins(coins);

        var byGain = coins.slice().sort(function (a, b) {
            return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
        });
        renderMiniList(topBullishList, byGain.slice(0, 10), "text-emerald", "fa-caret-up");

        var byLoss = coins.slice().sort(function (a, b) {
            return (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0);
        });
        renderMiniList(topBearishList, byLoss.slice(0, 10), "text-red-400", "fa-caret-down");

        var byVol = coins.slice().sort(function (a, b) {
            return (b.total_volume || 0) - (a.total_volume || 0);
        });
        renderMiniList(topVolumeList, byVol.slice(0, 10), "text-blue-400", "");
    }

    function renderCards(coins, appendFrom) {
        if (!container) return;
        appendFrom = appendFrom || 0;
        container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

        if (appendFrom === 0) {
            if (coins.length === 0) {
                container.innerHTML = '<div class="col-span-full py-20 text-center text-gray-500">Tidak ada koin ditemukan.</div>';
                return;
            }
            container.innerHTML = "";
        }

        var newEls = [];
        coins.slice(appendFrom).forEach(function (coin, i) {
            var index = appendFrom + i;
            var card = document.createElement("div");
            card.className = "glass-card rounded-3xl border border-white/10 group flex flex-col cursor-pointer relative overflow-hidden hover:-translate-y-2 transition-all";
            card.onclick   = function () {
                if (window.openCoinDetail) window.openCoinDetail(card, coin);
            };

            var priceChange    = coin.price_change_percentage_24h || 0;
            var changeClass    = priceChange >= 0 ? "text-emerald"      : "text-red-500";
            var badgeBgClass   = priceChange >= 0 ? "bg-emerald-500/20" : "bg-red-500/20";
            var changeIcon     = priceChange >= 0 ? "fa-caret-up"       : "fa-caret-down";
            var bearishBullish = priceChange >= 0 ? "BULLISH 24H"       : "BEARISH 24H";
            var coinName       = coin.name   || "";
            var coinSymbol     = (coin.symbol || "").toUpperCase();
            var imgId          = "mcard-" + (coin.id || index);

            card.innerHTML =
                '<div style="height:80px;width:100%;position:relative;overflow:hidden;">' +
                '<div style="position:absolute;inset:0;display:flex;align-items:flex-end;">' + generateChartSVG(coin, 280, 80) + '</div>' +
                '</div>' +
                '<div class="p-5 flex flex-col flex-1">' +
                '<div class="flex justify-between items-start mb-3">' +
                '<div class="bg-white/10 backdrop-blur-md text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">#' + (index + 1) + '</div>' +
                '<span class="' + changeClass + ' ' + badgeBgClass + ' text-[10px] font-bold px-3 py-1 rounded-full border border-current">' + bearishBullish + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-3 mb-4">' +
                '<div id="' + imgId + '-wrap" class="coin-logo-wrap" style="flex-shrink:0;">' +
                '<img id="' + imgId + '" src="' + (coin.image || "") + '" alt="' + coinName + '" class="w-10 h-10 rounded-full" style="display:block;" onerror="this.parentElement.innerHTML=\'<div style=&quot;width:2.5rem;height:2.5rem;border-radius:9999px;background:linear-gradient(135deg,#1e3a8a,#10b981);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;color:#fff;&quot;>' + coinName.charAt(0) + '</div>\'" />' +
                '</div>' +
                '<div>' +
                '<h3 class="coin-name-text text-white font-bold leading-tight">' + coinName + '</h3>' +
                '<p class="coin-symbol-text text-gray-400 text-[10px] uppercase font-semibold">' + coinSymbol + '</p>' +
                '</div>' +
                '</div>' +
                '<h2 class="text-2xl font-extrabold text-white mb-2">' + formatCurrency(coin.current_price) + '</h2>' +
                '<div class="grid grid-cols-3 gap-2 mb-4">' +
                '<div class="bg-white/5 p-2 rounded-lg text-center">' +
                '<p class="text-[9px] text-gray-500 mb-0.5 uppercase font-bold">24 Jam</p>' +
                '<p class="text-xs font-bold ' + changeClass + '"><i class="fa-solid ' + changeIcon + ' mr-0.5 text-[9px]"></i>' + Math.abs(priceChange).toFixed(2) + '%</p>' +
                '</div>' +
                '<div class="bg-white/5 p-2 rounded-lg text-center">' +
                '<p class="text-[9px] text-gray-500 mb-0.5 uppercase font-bold">Mkt Cap</p>' +
                '<p class="text-xs text-white font-bold">' + formatCompact(coin.market_cap) + '</p>' +
                '</div>' +
                '<div class="bg-white/5 p-2 rounded-lg text-center">' +
                '<p class="text-[9px] text-gray-500 mb-0.5 uppercase font-bold">Volume</p>' +
                '<p class="text-xs text-white font-bold">' + formatCompact(coin.total_volume) + '</p>' +
                '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 text-sm font-bold text-white group-hover:text-amber transition-colors mt-auto">' +
                'Lihat Analisis <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>' +
                '</div>' +
                '</div>';

            container.appendChild(card);
            newEls.push(card);
        });

        animateIn(newEls, "card");
    }

    function renderBars(coins, appendFrom, appendFrom) {
        if (!container) return;
        appendFrom = appendFrom || 0;
        container.className = "flex flex-col gap-3";

        if (appendFrom === 0) {
            if (coins.length === 0) {
                container.innerHTML = '<div class="py-20 text-center text-gray-500 w-full">Tidak ada koin ditemukan.</div>';
                return;
            }
            container.innerHTML = "";
        }

        var newEls = [];
        coins.slice(appendFrom).forEach(function (coin, i) {
            var index = appendFrom + i;
            var bar = document.createElement("div");
            bar.className = "glass-card rounded-2xl border border-white/10 p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group";
            bar.onclick   = function () {
                if (window.openCoinDetail) window.openCoinDetail(bar, coin);
            };

            var priceChange = coin.price_change_percentage_24h || 0;
            var changeClass = priceChange >= 0 ? "text-emerald" : "text-red-500";
            var changeIcon  = priceChange >= 0 ? "fa-caret-up"  : "fa-caret-down";
            var coinName    = coin.name   || "";
            var coinSymbol  = (coin.symbol || "").toUpperCase();
            var barImgId    = "mbar-" + (coin.id || index);

            bar.innerHTML =
                '<div class="w-8 text-center text-gray-500 text-sm font-bold shrink-0">' + (index + 1) + '</div>' +
                '<div id="' + barImgId + '-wrap" class="coin-logo-wrap shrink-0">' +
                '<img id="' + barImgId + '" src="' + (coin.image || "") + '" alt="' + coinName + '" class="w-10 h-10 rounded-full" style="display:block;" onerror="this.parentElement.innerHTML=\'<div style=&quot;width:2.5rem;height:2.5rem;border-radius:9999px;background:linear-gradient(135deg,#1e3a8a,#10b981);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;color:#fff;&quot;>' + coinName.charAt(0) + '</div>\'" />' +
                '</div>' +
                '<div class="min-w-0 flex-1">' +
                '<div class="flex items-center gap-2">' +
                '<h3 class="coin-name-text text-white font-bold text-sm truncate">' + coinName + '</h3>' +
                '<span class="coin-symbol-text bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono uppercase text-gray-400">' + coinSymbol + '</span>' +
                '</div>' +
                '<p class="text-gray-500 text-xs mt-0.5">Mkt Cap: ' + formatCompact(coin.market_cap) + ' · Vol: ' + formatCompact(coin.total_volume) + '</p>' +
                '</div>' +
                '<div class="w-24 h-10 shrink-0 hidden md:block">' + generateChartSVG(coin, 96, 40) + '</div>' +
                '<div class="text-right shrink-0 min-w-[100px]">' +
                '<p class="text-white font-bold text-sm">' + formatCurrency(coin.current_price) + '</p>' +
                '<p class="text-xs font-bold ' + changeClass + '"><i class="fa-solid ' + changeIcon + ' mr-0.5 text-[9px]"></i>' + Math.abs(priceChange).toFixed(2) + '%</p>' +
                '</div>' +
                '<div class="shrink-0 text-gray-500 group-hover:text-amber transition-colors">' +
                '<i class="fa-solid fa-chevron-right text-xs"></i>' +
                '</div>';

            container.appendChild(bar);
            newEls.push(bar);
        });

        animateIn(newEls, "bar");
    }

    function animateIn(els, type) {
        var elsArr = Array.from(els);

        elsArr.forEach(function (el) { gsap.set(el, { opacity: 0, x: 0, y: 0 }); });

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var obs = new IntersectionObserver(function (entries, ob) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var idx = elsArr.indexOf(entry.target);
                            gsap.fromTo(entry.target,
                                type === "bar" ? { opacity: 0, x: -20 } : { opacity: 0, y: 30 },
                                { opacity: 1, x: 0, y: 0, duration: 0.45, delay: (idx >= 0 ? idx : 0) * 0.04, ease: "power2.out", overwrite: "auto" }
                            );
                            ob.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.01, rootMargin: "0px 0px 80px 0px" });

                elsArr.forEach(function (el) { obs.observe(el); });
            });
        });
    }

    function renderShowMoreBtn(total, visible) {
        var existing = document.getElementById("show-more-btn-wrap");
        if (existing) existing.remove();

        if (visible >= total) return;

        var remaining = total - visible;
        var wrap = document.createElement("div");
        wrap.id = "show-more-btn-wrap";
        wrap.className = "flex flex-col items-center gap-2 pt-6 pb-4";

        var btn = document.createElement("button");
        btn.className = "px-8 py-3 rounded-full font-bold text-sm glass-card border border-white/10 text-gray-300 hover:bg-emerald/20 hover:border-emerald/40 hover:text-white transition-all";
        btn.innerHTML = '<i class="fa-solid fa-chevron-down mr-2"></i>Tampilkan Lebih <span class="opacity-60">(' + remaining + ' koin lagi)</span>';
        btn.onclick = function () {
            visibleCount += LOAD_MORE_STEP;
            render(true);
        };

        wrap.appendChild(btn);
        if (container && container.parentNode) {
            container.parentNode.insertBefore(wrap, container.nextSibling);
        }
    }

    function getDisplayCoins() {
        var query = (searchInput ? searchInput.value : "").toLowerCase().trim();
        var base  = allCoins;

        if (activeFilter === "bullish") {
            base = allCoins.filter(function (c) { return (c.price_change_percentage_24h || 0) > 0; })
                           .sort(function (a, b) { return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0); });
        } else if (activeFilter === "bearish") {
            base = allCoins.filter(function (c) { return (c.price_change_percentage_24h || 0) < 0; })
                           .sort(function (a, b) { return (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0); });
        } else if (activeFilter === "volume") {
            base = allCoins.slice().sort(function (a, b) { return (b.total_volume || 0) - (a.total_volume || 0); });
        }

        if (!query) return base;
        return base.filter(function (c) {
            return (c.name   || "").toLowerCase().includes(query) ||
                   (c.symbol || "").toLowerCase().includes(query);
        });
    }

    function render(fromShowMore) {
        var displayCoins = getDisplayCoins();
        var coinsToShow  = displayCoins.slice(0, visibleCount);
        var appendFrom   = (fromShowMore && lastRenderedCount > 0 && lastRenderedCount <= coinsToShow.length)
                           ? lastRenderedCount : 0;
        if (appendFrom === 0) lastRenderedCount = 0;
        if (currentView === "card") renderCards(coinsToShow, appendFrom);
        else renderBars(coinsToShow, appendFrom);
        lastRenderedCount = coinsToShow.length;
        renderShowMoreBtn(displayCoins.length, visibleCount);
    }

    var activeViewCls   = "px-5 py-3 rounded-full font-semibold text-sm transition-all bg-emerald text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    var inactiveViewCls = "px-5 py-3 rounded-full font-semibold text-sm transition-all glass-card text-gray-300 hover:bg-white/10 border border-white/10";

    if (cardBtn) {
        cardBtn.onclick = function () {
            currentView = "card";
            visibleCount = 10;
            cardBtn.className = activeViewCls;
            barBtn.className  = inactiveViewCls;
            render();
        };
    }
    if (barBtn) {
        barBtn.onclick = function () {
            currentView = "bar";
            visibleCount = 10;
            barBtn.className  = activeViewCls;
            cardBtn.className = inactiveViewCls;
            render();
        };
    }

    var activeFilterCls   = "market-tab active-tab px-4 py-2 rounded-full text-xs font-bold transition-all bg-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]";
    var inactiveFilterCls = "market-tab px-4 py-2 rounded-full text-xs font-bold transition-all glass-card text-gray-300 border border-white/10 hover:bg-white/10";

    filterTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            activeFilter = tab.getAttribute("data-filter");
            visibleCount = 10;
            filterTabs.forEach(function (t) {
                t.className = (t === tab) ? activeFilterCls : inactiveFilterCls;
            });
            render();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", debounce(function () {
            visibleCount = 10;
            render();
        }, 300));
    }

    async function fetchMarketData() {
        try {
            var response = await fetch(API_BASE_URL + "/coins");
            if (!response.ok) throw new Error("HTTP " + response.status);
            var data = await response.json();
            allCoins = data;

            renderHighlights(allCoins);
            render();

            var urlParams = new URLSearchParams(window.location.search);
            var coinId    = urlParams.get("coin");
            if (coinId && window.openCoinDetail && !window.initialCoinOpened) {
                var selected = allCoins.find(function (c) { return c.id === coinId; });
                if (selected) {
                    window.initialCoinOpened = true;
                    var el = document.getElementById("mcard-" + selected.id) ||
                             document.getElementById("mbar-"  + selected.id);
                    if (el) el = el.parentElement.parentElement;
                    window.openCoinDetail(el, selected);
                }
            }
        } catch (err) {
            console.error("Error fetching market data:", err);
            if (container) {
                container.innerHTML = '<div class="col-span-full py-20 text-center text-red-400">Gagal memuat data. Silakan coba lagi nanti.</div>';
            }
        }
    }

    fetchMarketData();
    setInterval(fetchMarketData, 60000);
})();
