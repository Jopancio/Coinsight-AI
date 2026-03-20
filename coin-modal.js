(function(window) {
    var favoriteCoins = JSON.parse(localStorage.getItem('coin_favorites') || '[]');
    var API_BASE_URL = 'https://skidibi-toilet.jovancion.workers.dev/api';

    function formatCurrency(val) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: val < 1 ? 6 : 2
        }).format(val || 0);
    }

    function formatCompact(val) {
        if (!val) return '\\';
        if (val >= 1e12) return '\\$' + (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return '\\$' + (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return '\\$' + (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return '\\$' + (val / 1e3).toFixed(2) + 'K';
        return '\\$' + val.toFixed(2);
    }    window.openCoinDetail = function(rowElement, coin) {
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
                    document.dispatchEvent(new CustomEvent('coinFavoriteChanged'));
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

                    var currentRow = rowElement && rowElement.isConnected ? rowElement : document.getElementById("row-" + coin.id);
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
                            if (rowElement && rowElement !== currentRow) rowElement.style.opacity = "1";
                            document.body.style.overflow = "";
                        }
                    });
                };

                document.getElementById("close-detail-btn").onclick = closeAction;
                overlay.onclick = closeAction;
            }
        });
    }
})(window);