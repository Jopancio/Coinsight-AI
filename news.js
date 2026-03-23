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

    var topNewsContainer = document.getElementById("top-news-container");
    var allNewsContainer = document.getElementById("all-news-container");
    var searchForm = document.getElementById("search-form");
    var searchInput = document.getElementById("news-search-input");
    var searchResultsSection = document.getElementById("search-results-section");
    var searchResultsContainer = document.getElementById("search-results-container");
    var searchQueryText = document.getElementById("search-query-text");
    var clearSearchBtn = document.getElementById("clear-search-btn");

    function createNewsCard(article, index, isTopNews = false) {
        var coverUrl = article.cover || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
        var title = article.title || "Berita Kripto Terbaru";
        var subtitle = article.subtitle || "Klik untuk membaca selengkapnya.";
        var url = article.url || "#";
        var date = new Date(article.released_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        var source = article.source || 'Crypto News';

        var card = document.createElement("a");
        card.href = url;
        card.target = "_blank";

        if (isTopNews) {
            card.className = "glass-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-500 group flex flex-col h-full border-[2px] border-amber/20 bg-black/40 hover:border-amber/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.18)]";
            card.innerHTML = `
                <div class="h-32 overflow-hidden relative shrink-0">
                    <div class="absolute inset-0 bg-amber/10 group-hover:bg-transparent transition-colors z-10"></div>
                    <img src="${coverUrl}" alt="News Cover" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                    <div class="absolute top-2 left-2 z-20 bg-amber text-black px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                        TOP STORY
                    </div>
                </div>
                <div class="p-3 flex-1 flex flex-col">
                    <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span class="text-[10px] font-bold text-amber uppercase tracking-wider bg-amber/10 px-1.5 py-0.5 rounded">${source}</span>
                        <p class="text-[10px] text-gray-400 font-mono"><i class="fa-regular fa-clock mr-0.5"></i>${date}</p>
                    </div>
                    <h3 class="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-amber transition-colors leading-snug">${title}</h3>
                    <p class="text-[11px] text-gray-400 line-clamp-2 mb-2 flex-1 leading-relaxed">${subtitle}</p>
                    <div class="flex items-center gap-1.5 text-[11px] font-bold text-white mt-auto group-hover:text-amber transition-colors">
                        Baca Selengkapnya <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1 text-[9px]"></i>
                    </div>
                </div>
            `;
        } else {
            card.className = "glass-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-500 group flex flex-col h-full bg-white/5 border border-white/10";
            card.innerHTML = `
                <div class="h-28 overflow-hidden relative">
                    <div class="absolute inset-0 bg-tech-blue/20 group-hover:bg-transparent transition-colors z-10"></div>
                    <img src="${coverUrl}" alt="News Cover" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'" />
                    <div class="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/10">
                        ${source}
                    </div>
                </div>
                <div class="p-3 flex-1 flex flex-col">
                    <p class="text-[10px] text-emerald mb-1 font-mono"><i class="fa-regular fa-clock mr-0.5"></i>${date}</p>
                    <h3 class="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-tech-blue transition-colors leading-snug">${title}</h3>
                    <p class="text-[11px] text-gray-400 line-clamp-2 mb-2 flex-1 leading-relaxed">${subtitle}</p>
                    <div class="flex items-center gap-1.5 text-[11px] font-semibold text-white mt-auto group-hover:text-emerald transition-colors">
                        Baca Artikel <i class="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1 text-[9px]"></i>
                    </div>
                </div>
            `;
        }

        gsap.set(card, { opacity: 0, y: 30 });
        return card;
    }

    function animateCards(container) {
        var cards = container.querySelectorAll('a.glass-card');
        gsap.set(cards, { opacity: 0, y: 40 });

        var obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    var card = entry.target;
                    var idx = Array.from(cards).indexOf(card);
                    if (entry.isIntersecting) {
                        gsap.to(card, { opacity: 1, y: 0, duration: 0.8, delay: idx * 0.15, ease: "power3.out", overwrite: "auto", clearProps: "all" });
                        obs.unobserve(card);
                    }
                });
            },
            { root: null, rootMargin: "0px", threshold: 0.1 }
        );

        cards.forEach(function (c) { obs.observe(c); });
    }

    function setupCarouselButtons(carouselId, prevBtnId, nextBtnId) {
        var carousel = document.getElementById(carouselId);
        var prevBtn = document.getElementById(prevBtnId);
        var nextBtn = document.getElementById(nextBtnId);

        if (!carousel) return;

        carousel.style.scrollBehavior = "auto";

        var scrollSpeed = 0.8;
        var isPaused = false;
        var isButtonAnimating = false;
        var autoScrollRAF = null;

        function autoScrollStep() {
            if (!isPaused && !isButtonAnimating && carousel.scrollWidth > carousel.clientWidth) {
                carousel.scrollLeft += scrollSpeed;
                if (carousel.scrollLeft >= (carousel.scrollWidth - carousel.clientWidth - 1)) {
                    carousel.scrollLeft = 0;
                }
            }
            autoScrollRAF = requestAnimationFrame(autoScrollStep);
        }

        autoScrollRAF = requestAnimationFrame(autoScrollStep);

        carousel.addEventListener('mouseenter', function () { isPaused = true; });
        carousel.addEventListener('mouseleave', function () { isPaused = false; });
        carousel.addEventListener('touchstart', function () { isPaused = true; }, { passive: true });
        carousel.addEventListener('touchend', function () { isPaused = false; });

        if (prevBtn && nextBtn) {
            function getCardWidth() {
                var firstCard = carousel.querySelector('a.glass-card');
                if (firstCard) return firstCard.offsetWidth + 24; 
                return Math.min(window.innerWidth * 0.75, 280) + 24;
            }

            prevBtn.addEventListener("click", function () {
                if (isButtonAnimating) return;
                isButtonAnimating = true;

                var targetScroll = Math.max(0, carousel.scrollLeft - getCardWidth());

                gsap.to(carousel, {
                    scrollLeft: targetScroll,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onComplete: function () {
                        setTimeout(function () { isButtonAnimating = false; }, 800);
                    }
                });
            });

            nextBtn.addEventListener("click", function () {
                if (isButtonAnimating) return;
                isButtonAnimating = true;

                var maxScroll = carousel.scrollWidth - carousel.clientWidth;
                var targetScroll = carousel.scrollLeft + getCardWidth();

                if (targetScroll >= maxScroll) {
                    targetScroll = 0;
                }

                gsap.to(carousel, {
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

    async function fetchCarouselNews(coinName, symbol, containerId, isTopTheme = false) {
        var container = document.getElementById(containerId);
        if (!container) return;

        try {
            var response = await fetchWithTimeout(API_BASE_URL + "/coin-news?coin=" + encodeURIComponent(coinName) + "&symbol=" + encodeURIComponent(symbol));
            if (!response.ok) throw new Error("Gagal mengambil berita " + coinName);
            var result = await response.json();
            var articles = result.data || [];

            if (articles.length === 0) {
                container.innerHTML = '<div class="w-full text-center text-gray-500 py-10">Belum ada berita untuk ' + coinName + '.</div>';
                return;
            }
            container.innerHTML = "";

            articles.forEach(function (article, i) {
                var card = createNewsCard(article, i, isTopTheme);
                card.className = card.className.replace("h-full", "") + " w-[75vw] max-w-[280px] sm:w-[280px] sm:max-w-none shrink-0";
                container.appendChild(card);
            });

            if (articles.length >= 3) {
                articles.forEach(function (article, i) {
                    var card = createNewsCard(article, i + articles.length, isTopTheme);
                    card.className = card.className.replace("h-full", "") + " w-[75vw] max-w-[280px] sm:w-[280px] sm:max-w-none shrink-0";
                    container.appendChild(card);
                });
            }

            animateCards(container);
        } catch (e) {
            container.innerHTML = '<div class="w-full text-center text-red-500 py-10">Terjadi kesalahan memuat berita ' + coinName + '.</div>';
        }
    }

    async function fetchAllNews() {
        if (!allNewsContainer) return;
        try {
            var response = await fetchWithTimeout(API_BASE_URL + "/news");
            if (!response.ok) throw new Error("Gagal mengambil all news");
            var result = await response.json();
            var articles = result.data || [];

            if (articles.length === 0) {
                allNewsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Belum ada berita kripto saat ini.</div>';
                return;
            }
            allNewsContainer.innerHTML = "";

            articles.forEach(function (article, i) {
                var card = createNewsCard(article, i, false);
                allNewsContainer.appendChild(card);
            });
            animateCards(allNewsContainer);
        } catch (e) {
            allNewsContainer.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Terjadi kesalahan memuat semua berita.</div>';
        }
    }

    async function searchNews(query) {
        if (!searchResultsContainer) return;
        searchResultsSection.classList.remove("hidden");
        searchQueryText.textContent = '"' + query + '"';
        searchResultsContainer.innerHTML = '<div class="col-span-full py-10 flex flex-col items-center justify-center"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tech-blue mb-4"></div><p class="text-gray-500">Mencari berita...</p></div>';

        window.scrollTo({
            top: searchResultsSection.offsetTop - 100,
            behavior: "smooth"
        });

        try {
            var symbolMatch = query.substring(0, 4).toUpperCase();
            var response = await fetchWithTimeout(API_BASE_URL + "/coin-news?coin=" + encodeURIComponent(query) + "&symbol=" + encodeURIComponent(symbolMatch));
            if (!response.ok) throw new Error("Gagal mencari berita");
            var result = await response.json();
            var articles = result.data || [];

            if (articles.length === 0) {
                searchResultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 bg-white/5 rounded-2xl">Tidak ada berita ditemukan untuk "' + query + '". Coba koin lain.</div>';
                return;
            }
            searchResultsContainer.innerHTML = "";

            articles.forEach(function (article, i) {
                var card = createNewsCard(article, i, false);
                searchResultsContainer.appendChild(card);
            });
            animateCards(searchResultsContainer);
        } catch (e) {
            searchResultsContainer.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 bg-white/5 rounded-2xl">Terjadi kesalahan saat mencari berita.</div>';
        }
    }

    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var query = searchInput.value.trim();
            if (query) {
                searchNews(query);
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", function () {
            searchResultsSection.classList.add("hidden");
            searchInput.value = "";
        });
    }

    setupCarouselButtons('carousel-btc', 'btn-prev-btc', 'btn-next-btc');
    setupCarouselButtons('carousel-eth', 'btn-prev-eth', 'btn-next-eth');
    setupCarouselButtons('carousel-sol', 'btn-prev-sol', 'btn-next-sol');

    fetchCarouselNews('Bitcoin', 'BTC', 'carousel-btc', true);
    fetchCarouselNews('Ethereum', 'ETH', 'carousel-eth', true);
    fetchCarouselNews('Solana', 'SOL', 'carousel-sol', true);

    fetchAllNews();

})();

document.addEventListener("DOMContentLoaded", function () {
    var beritaLinks = document.querySelectorAll('a[href="news.html"]');
    beritaLinks.forEach(function (link) {
        link.classList.add("nav-active");
        if (!link._isHovered) {
            gsap.to(link, { scale: 1.15, color: "#ffffff", duration: 0.3, ease: "power2.out" });
        }
    });
});