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
        if (!val) return '$0';
        if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return '$' + (val / 1e3).toFixed(2) + 'K';
        return '$' + val.toFixed(2);
    }    window.openCoinDetail = function(rowElement, coin) {
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
                        <div style="display:flex;flex-direction:column;padding-bottom:${isMobile ? '20px' : '40px'};gap:0;">

                            <!-- ── PRICE OVERVIEW CARD ───────────────────────────── -->
                            <div style="margin-bottom:20px;margin-top:0;padding:${isMobile ? '14px 16px 14px' : '22px 26px 20px'};background:linear-gradient(135deg,rgba(${modalAccentRgb},0.07) 0%,transparent 70%);border:1px solid rgba(${modalAccentRgb},0.18);border-radius:20px;position:relative;overflow:hidden;">
                                <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:8rem;font-weight:900;color:rgba(255,255,255,0.022);letter-spacing:-5px;user-select:none;pointer-events:none;font-family:ui-monospace,monospace;line-height:1;">${(coin.symbol||'').toUpperCase()}</div>
                                <!-- Price + change badge -->
                                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:${isMobile ? '12px' : '20px'};position:relative;flex-wrap:wrap;gap:12px;">
                                    <div>
                                        <p style="font-size:10px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:0.12em;margin-bottom:8px;">Harga Saat Ini</p>
                                        <h3 style="font-size:${isMobile ? 'clamp(1.0rem,5vw,1.4rem)' : 'clamp(1.8rem,4vw,2.8rem)'};font-weight:900;color:#f8fafc;line-height:1;letter-spacing:-0.03em;">${formatCurrency(coin.current_price)}</h3>
                                    </div>
                                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding-top:6px;">
                                        <div style="display:inline-flex;align-items:center;gap:7px;background:${modalAccentDim};border:1px solid ${modalAccent}50;border-radius:14px;padding:${isMobile ? '5px 10px' : '9px 16px'};">
                                            <i class="fa-solid fa-caret-${modalIsUp ? 'up' : 'down'}" style="font-size:${isMobile ? '12px' : '15px'};color:${modalAccent};"></i>
                                            <span style="font-size:${isMobile ? '13px' : '17px'};font-weight:900;color:${modalAccent};">${percentSign}${(coin.price_change_percentage_24h||0).toFixed(2)}%</span>
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
                            <div style="width:100%;flex-shrink:0;margin-bottom:24px;position:relative;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);height:${isMobile ? '220px' : '400px'};" id="tv_chart_container_${coin.symbol}"></div>

                            <!-- ── MARKET OVERVIEW ──────────────────────────────── -->
                            <div style="margin-bottom:${isMobile ? '16px' : '24px'};">
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:${isMobile ? '10px' : '16px'};">
                                    <div style="width:3px;height:20px;border-radius:9999px;background:${modalAccent};"></div>
                                    <h3 style="font-size:15px;font-weight:800;color:#f1f5f9;letter-spacing:-0.01em;">Market Overview</h3>
                                    <div style="flex:1;height:1px;background:rgba(255,255,255,0.06);"></div>
                                    <span style="font-size:9px;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${coin.name}</span>
                                </div>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                                    <!-- Market Cap -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '28px' : '34px'};height:${isMobile ? '28px' : '34px'};border-radius:10px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-chart-pie" style="font-size:${isMobile ? '11px' : '13px'};color:#60a5fa;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Mkt Cap</span>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '19px'};font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.market_cap)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Kapitalisasi Pasar</p>
                                    </div>
                                    <!-- Rank -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '28px' : '34px'};height:${isMobile ? '28px' : '34px'};border-radius:10px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-trophy" style="font-size:${isMobile ? '11px' : '13px'};color:#f59e0b;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Rank</span>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '19px'};font-weight:900;color:#f1f5f9;line-height:1;">#${coin.market_cap_rank || '-'}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Peringkat Global</p>
                                    </div>
                                    <!-- Volume 24H -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '28px' : '34px'};height:${isMobile ? '28px' : '34px'};border-radius:10px;background:rgba(168,85,247,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-fire" style="font-size:${isMobile ? '11px' : '13px'};color:#a855f7;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Volume 24H</span>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '19px'};font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.total_volume)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">Total Perdagangan</p>
                                    </div>
                                    <!-- Circulating Supply -->
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '28px' : '34px'};height:${isMobile ? '28px' : '34px'};border-radius:10px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-circle-dot" style="font-size:${isMobile ? '11px' : '13px'};color:#10b981;"></i></div>
                                            <span style="font-size:8px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.1em;">Beredar</span>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '17px'};font-weight:900;color:#f1f5f9;line-height:1;">${formatCompact(coin.circulating_supply)}</p>
                                        <p style="font-size:10px;color:#475569;margin-top:5px;">${(coin.symbol||'').toUpperCase()} · ${modalSupplyPct !== null ? modalSupplyPct + '% of max' : 'No max supply'}</p>
                                        ${modalSupplyPct !== null ? '<div style="margin-top:8px;height:4px;border-radius:9999px;background:rgba(255,255,255,0.07);overflow:hidden;"><div style="height:100%;width:' + modalSupplyPct + '%;background:linear-gradient(to right,rgba(16,185,129,0.5),#10b981);border-radius:9999px;"></div></div>' : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- ── HISTORICAL RECORDS ────────────────────────────── -->
                            <div style="margin-bottom:${isMobile ? '16px' : '24px'};">
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:${isMobile ? '10px' : '16px'};">
                                    <div style="width:3px;height:20px;border-radius:9999px;background:linear-gradient(to bottom,#10b981,#ef4444);"></div>
                                    <h3 style="font-size:15px;font-weight:800;color:#f1f5f9;letter-spacing:-0.01em;">Harga Historis</h3>
                                    <div style="flex:1;height:1px;background:rgba(255,255,255,0.06);"></div>
                                </div>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px;">
                                    <!-- ATH Card -->
                                    <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.22);border-radius:14px;padding:${isMobile ? '12px' : '18px'};position:relative;overflow:hidden;">
                                        <div style="position:absolute;top:-8px;right:-4px;font-size:4.5rem;font-weight:900;color:rgba(16,185,129,0.05);user-select:none;line-height:1;font-family:ui-monospace,monospace;pointer-events:none;">ATH</div>
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '26px' : '32px'};height:${isMobile ? '26px' : '32px'};border-radius:10px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-arrow-trend-up" style="font-size:${isMobile ? '10px' : '12px'};color:#10b981;"></i></div>
                                            <div>
                                                <p style="font-size:9px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Record Tertinggi</p>
                                                <p style="font-size:9px;color:#475569;">${athDateStr}</p>
                                            </div>
                                        </div>
                                        <p style="font-size:${isMobile ? '15px' : '20px'};font-weight:900;color:#f1f5f9;margin-bottom:${isMobile ? '4px' : '6px'};">${formatCurrency(coin.ath)}</p>
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:${isMobile ? '6px' : '10px'};">
                                            <span style="font-size:12px;font-weight:800;color:${athValueColor};">${athSign}${(coin.ath_change_percentage||0).toFixed(2)}%</span>
                                            <span style="font-size:10px;color:#475569;">dari ATH</span>
                                        </div>
                                        <div style="height:5px;border-radius:9999px;background:rgba(255,255,255,0.07);">
                                            <div style="height:100%;width:${athProximity}%;background:linear-gradient(to right,rgba(16,185,129,0.4),#10b981);border-radius:9999px;"></div>
                                        </div>
                                    </div>
                                    <!-- ATL Card -->
                                    <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.22);border-radius:14px;padding:${isMobile ? '12px' : '18px'};position:relative;overflow:hidden;">
                                        <div style="position:absolute;top:-8px;right:-4px;font-size:4.5rem;font-weight:900;color:rgba(239,68,68,0.05);user-select:none;line-height:1;font-family:ui-monospace,monospace;pointer-events:none;">ATL</div>
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isMobile ? '8px' : '12px'};">
                                            <div style="width:${isMobile ? '26px' : '32px'};height:${isMobile ? '26px' : '32px'};border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-arrow-trend-down" style="font-size:${isMobile ? '10px' : '12px'};color:#ef4444;"></i></div>
                                            <div>
                                                <p style="font-size:9px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:0.1em;">Record Terendah</p>
                                                <p style="font-size:9px;color:#475569;">${atlDateStr}</p>
                                            </div>
                                        </div>
                                        <p style="font-size:${isMobile ? '15px' : '20px'};font-weight:900;color:#f1f5f9;margin-bottom:${isMobile ? '4px' : '6px'};">${formatCurrency(coin.atl)}</p>
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:${isMobile ? '6px' : '10px'};">
                                            <span style="font-size:12px;font-weight:800;color:${atlValueColor};">${atlSign}${(coin.atl_change_percentage||0).toFixed(2)}%</span>
                                            <span style="font-size:10px;color:#475569;">dari ATL</span>
                                        </div>
                                        <p style="font-size:10px;color:#475569;">Terendah sepanjang masa</p>
                                    </div>
                                </div>
                                <!-- Total + Max Supply -->
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:${isMobile ? '8px' : '10px'};">
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};">
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isMobile ? '6px' : '10px'};">
                                            <div style="width:${isMobile ? '24px' : '30px'};height:${isMobile ? '24px' : '30px'};border-radius:9px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-database" style="font-size:${isMobile ? '10px' : '12px'};color:#818cf8;"></i></div>
                                            <p style="font-size:9px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Total Supply</p>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '18px'};font-weight:900;color:#f1f5f9;">${coin.total_supply ? formatCompact(coin.total_supply) : '-'}</p>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:${isMobile ? '10px 12px' : '16px'};">
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isMobile ? '6px' : '10px'};">
                                            <div style="width:${isMobile ? '24px' : '30px'};height:${isMobile ? '24px' : '30px'};border-radius:9px;background:rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-infinity" style="font-size:${isMobile ? '10px' : '12px'};color:#a78bfa;"></i></div>
                                            <p style="font-size:9px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;">Max Supply</p>
                                        </div>
                                        <p style="font-size:${isMobile ? '14px' : '18px'};font-weight:900;color:#f1f5f9;">${coin.max_supply ? formatCompact(coin.max_supply) : '∞'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- ── RELATED NEWS ──────────────────────────────────── -->
                            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:${isMobile ? '18px' : '32px'};padding-bottom:16px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${isMobile ? '14px' : '20px'};flex-wrap:wrap;gap:8px;">
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
                            coinNewsContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-6 text-sm bg-white/5 rounded-xl border border-white/10">Terjadi kesalahan pada backend server kami. Harap coba lagi nanti.</div>';
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
                        var copyText = shareData.title + "\n" + shareData.text + "\n" + shareData.url;
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
                        currentRow.querySelector("td > div > div:first-child") ||
                        (currentRow.querySelector("img[id^='mcard-']") ? currentRow.querySelector("img[id^='mcard-']").parentElement : null) ||
                        (currentRow.querySelector("img[id^='mbar-']") ? currentRow.querySelector("img[id^='mbar-']").parentElement : null)
                    ) : null;
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
                            if (rowElement && rowElement !== currentRow) rowElement.style.opacity = "1";
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
})(window);