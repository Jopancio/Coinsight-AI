// Rate limiting is handled via Cloudflare Workers Rate Limiting API (env.RATE_LIMITER binding).
// Configure in wrangler.toml:
//   [[unsafe.bindings]]
//   name = "RATE_LIMITER"
//   type = "ratelimit"
//   namespace_id = "1001"
//   simple = { limit = 25, period = 60 }
const RATE_LIMIT = 25;
const TIME_WINDOW = 60000;

const CACHE_TTL = {
  "/api/coins": 60,
  "/api/news": 300,
  "/api/coin-news": 180,
  "/api/ai-analyze": 300,
};

async function getCached(cacheKey) {
  const cached = await caches.default.match(cacheKey);
  if (!cached) return null;
  return cached;
}

async function putCached(cacheKey, body, ttl) {
  const res = new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttl}`,
    },
  });
  await caches.default.put(cacheKey, res);
}

function jsonResponse(body, corsHeaders, status = 200) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function calculateVolatility(prices) {
  if (!prices || prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return (Math.sqrt(variance) * 100).toFixed(2);
}

function calculateMaxDrawdown(prices) {
  if (!prices || prices.length < 2) return 0;
  let peak = prices[0];
  let maxDd = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) peak = prices[i];
    const dd = ((prices[i] - peak) / peak) * 100;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd.toFixed(2);
}

function formatCompactNum(val) {
  if (!val) return "$0";
  if (val >= 1e12) return "$" + (val / 1e12).toFixed(2) + "T";
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return "$" + (val / 1e3).toFixed(2) + "K";
  return "$" + val.toFixed(2);
}

async function handleAiAnalyze(request, env, url, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResponse(JSON.stringify({ error: "Method not allowed. Use POST." }), corsHeaders, 405);
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return jsonResponse(JSON.stringify({ error: "Invalid JSON body" }), corsHeaders, 400);
  }

  const coinId = (reqBody.coinId || "").toLowerCase().trim();
  if (!coinId) {
    return jsonResponse(JSON.stringify({ error: "coinId is required" }), corsHeaders, 400);
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResponse(JSON.stringify({ error: "Gemini API key not configured on server" }), corsHeaders, 500);
  }

  // Check cache (use a synthetic GET URL for caching)
  const cacheUrl = new URL(url.toString());
  cacheUrl.pathname = "/api/ai-analyze";
  cacheUrl.searchParams.set("coinId", coinId);
  const cacheKey = new Request(cacheUrl.toString());
  const ttl = CACHE_TTL["/api/ai-analyze"];

  const cached = await getCached(cacheKey);
  if (cached) {
    const body = await cached.text();
    return jsonResponse(body, corsHeaders);
  }

  // Fetch all data in parallel
  const [coinDataRes, historyRes, newsRes, fngRes] = await Promise.allSettled([
    // 1. Detailed coin data from CoinGecko
    fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`, {
      headers: {
        "x-cg-demo-api-key": env.COINGECKO_API_KEY || "",
        "Accept": "application/json"
      }
    }),
    // 2. 30-day price history
    fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=30&interval=daily`, {
      headers: {
        "x-cg-demo-api-key": env.COINGECKO_API_KEY || "",
        "Accept": "application/json"
      }
    }),
    // 3. Related news
    fetch(`https://data-api.coindesk.com/news/v1/search?search_string=${encodeURIComponent(coinId)}&source_key=coindesk&limit=8&lang=EN`),
    // 4. Fear & Greed Index
    fetch("https://api.alternative.me/fng/?limit=7")
  ]);

  // Parse coin data
  let coinData = null;
  if (coinDataRes.status === "fulfilled" && coinDataRes.value.ok) {
    coinData = await coinDataRes.value.json();
  }

  if (!coinData) {
    return jsonResponse(JSON.stringify({ error: "Failed to fetch coin data. The coin might not exist or CoinGecko rate limit reached." }), corsHeaders, 502);
  }

  // Parse history
  let historyData = null;
  let priceArray = [];
  let volatility = "N/A";
  let maxDrawdown = "N/A";
  let priceChange30d = "N/A";
  if (historyRes.status === "fulfilled" && historyRes.value.ok) {
    historyData = await historyRes.value.json();
    if (historyData.prices && historyData.prices.length > 1) {
      priceArray = historyData.prices.map(p => p[1]);
      volatility = calculateVolatility(priceArray);
      maxDrawdown = calculateMaxDrawdown(priceArray);
      const firstPrice = priceArray[0];
      const lastPrice = priceArray[priceArray.length - 1];
      priceChange30d = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
    }
  }

  // Parse news
  let newsArticles = [];
  if (newsRes.status === "fulfilled" && newsRes.value.ok) {
    try {
      const newsData = await newsRes.value.json();
      newsArticles = (newsData.Data || []).slice(0, 8).map(item => ({
        title: item.TITLE || "",
        body: item.BODY ? item.BODY.substring(0, 250) : "",
        url: item.URL || "",
        source: item.SOURCE_DATA?.NAME || "CoinDesk",
        date: item.PUBLISHED_ON ? new Date(item.PUBLISHED_ON * 1000).toISOString().split("T")[0] : ""
      }));
    } catch (e) { /* ignore parse errors */ }
  }

  // If no news from search, try general crypto news as fallback
  if (newsArticles.length === 0) {
    try {
      const fallbackRes = await fetch("https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=5");
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        newsArticles = (fbData.Data || []).slice(0, 5).map(item => ({
          title: item.TITLE || "",
          body: item.BODY ? item.BODY.substring(0, 250) : "",
          url: item.URL || "",
          source: item.SOURCE_DATA?.NAME || "CoinDesk",
          date: item.PUBLISHED_ON ? new Date(item.PUBLISHED_ON * 1000).toISOString().split("T")[0] : ""
        }));
      }
    } catch (e) { /* ignore */ }
  }

  // Parse Fear & Greed
  let fngData = { value: "N/A", classification: "N/A", history: [] };
  if (fngRes.status === "fulfilled" && fngRes.value.ok) {
    try {
      const fngJson = await fngRes.value.json();
      if (fngJson.data && fngJson.data.length > 0) {
        fngData.value = fngJson.data[0].value;
        fngData.classification = fngJson.data[0].value_classification;
        fngData.history = fngJson.data.map(d => ({ value: d.value, classification: d.value_classification, date: new Date(d.timestamp * 1000).toISOString().split("T")[0] }));
      }
    } catch (e) { /* ignore */ }
  }

  // Build the market data object
  const md = coinData.market_data || {};
  const marketInfo = {
    name: coinData.name || coinId,
    symbol: (coinData.symbol || "").toUpperCase(),
    image: coinData.image?.large || coinData.image?.small || "",
    description: coinData.description?.en ? coinData.description.en.substring(0, 500) : "No description available.",
    currentPrice: md.current_price?.usd || 0,
    marketCap: md.market_cap?.usd || 0,
    marketCapRank: md.market_cap_rank || coinData.market_cap_rank || "N/A",
    totalVolume: md.total_volume?.usd || 0,
    high24h: md.high_24h?.usd || 0,
    low24h: md.low_24h?.usd || 0,
    priceChange24h: md.price_change_percentage_24h?.toFixed(2) || "0",
    priceChange7d: md.price_change_percentage_7d?.toFixed(2) || "0",
    priceChange30d: priceChange30d,
    ath: md.ath?.usd || 0,
    athChangePercentage: md.ath_change_percentage?.usd?.toFixed(2) || "0",
    athDate: md.ath_date?.usd || "",
    atl: md.atl?.usd || 0,
    atlChangePercentage: md.atl_change_percentage?.usd?.toFixed(2) || "0",
    circulatingSupply: md.circulating_supply || 0,
    totalSupply: md.total_supply || 0,
    maxSupply: md.max_supply || null,
    volatility30d: volatility,
    maxDrawdown30d: maxDrawdown,
  };

  // Build the Gemini prompt
  const newsContext = newsArticles.length > 0
    ? newsArticles.map((n, i) => `  ${i + 1}. [${n.date}] "${n.title}" (${n.source}) - ${n.body}`).join("\n")
    : "  Tidak ada berita spesifik terkini yang ditemukan untuk koin ini.";

  const fngContext = fngData.value !== "N/A"
    ? `Saat ini: ${fngData.value}/100 (${fngData.classification}). Riwayat 7 hari: ${fngData.history.map(h => `${h.date}: ${h.value} (${h.classification})`).join(", ")}`
    : "Data tidak tersedia.";

  const prompt = `Kamu adalah seorang analis kripto profesional bernama "CoinSight AI". Tugasmu adalah memberikan analisis mendalam dan akurat berdasarkan data real-time yang diberikan.

PENTING: 
- Jawab SELURUHNYA dalam Bahasa Indonesia
- Gunakan data yang diberikan sebagai dasar analisis, jangan mengarang data
- Berikan analisis yang objektif dan berimbang
- SELALU ingatkan bahwa ini bukan financial advice

=== DATA KOIN: ${marketInfo.name} (${marketInfo.symbol}) ===

Harga Saat Ini: $${marketInfo.currentPrice}
Market Cap: ${formatCompactNum(marketInfo.marketCap)} (Rank #${marketInfo.marketCapRank})
Volume 24 Jam: ${formatCompactNum(marketInfo.totalVolume)}
Tertinggi 24h: $${marketInfo.high24h} | Terendah 24h: $${marketInfo.low24h}

Perubahan Harga:
- 24 Jam: ${marketInfo.priceChange24h}%
- 7 Hari: ${marketInfo.priceChange7d}%
- 30 Hari: ${marketInfo.priceChange30d}%

All-Time High: $${marketInfo.ath} (${marketInfo.athChangePercentage}% dari ATH, tanggal: ${marketInfo.athDate})
All-Time Low: $${marketInfo.atl} (${marketInfo.atlChangePercentage}% dari ATL)

Supply:
- Circulating: ${marketInfo.circulatingSupply.toLocaleString()}
- Total: ${marketInfo.totalSupply ? marketInfo.totalSupply.toLocaleString() : "Tidak terbatas"}
- Max: ${marketInfo.maxSupply ? marketInfo.maxSupply.toLocaleString() : "Tidak terbatas"}

Metrik Risiko (30 Hari):
- Volatilitas: ${marketInfo.volatility30d}%
- Max Drawdown: ${marketInfo.maxDrawdown30d}%

Deskripsi Koin:
${marketInfo.description}

=== BERITA TERKINI ===
${newsContext}

=== FEAR & GREED INDEX ===
${fngContext}

=== INSTRUKSI OUTPUT ===
Berikan analisis dengan format berikut (gunakan heading markdown ## untuk setiap section):

## Ringkasan Eksekutif
Berikan ringkasan 2-3 kalimat tentang kondisi koin saat ini. Sertakan sentimen keseluruhan (Bullish/Bearish/Netral) dan skor kepercayaan 1-100.

## Analisis Teknikal
Analisis tren harga berdasarkan data 24h, 7d, dan 30d. Bahas volatilitas, max drawdown, dan level support/resistance yang teridentifikasi dari data. Jelaskan apa artinya bagi investor.

## Analisis Fundamental
Evaluasi market cap, ranking, supply dynamics (inflasi/deflasi), dan volume perdagangan. Bandingkan dengan posisi kompetitif di pasar.

## Sentimen Pasar & Berita
Analisis berita terkini dan Fear & Greed Index. Bagaimana sentimen mempengaruhi prospek koin ini?

## Risiko & Peluang
Buat tabel atau daftar risiko utama dan peluang yang teridentifikasi.

## Kesimpulan & Rekomendasi
Berikan kesimpulan akhir dan rekomendasi (BUKAN financial advice, tapi panduan edukasi). Sertakan level risiko: Rendah/Menengah/Tinggi/Sangat Tinggi.

PENTING: Di akhir, SELALU tambahkan disclaimer bahwa ini adalah analisis edukatif dari AI dan BUKAN merupakan saran investasi (financial advice). Keputusan investasi sepenuhnya tanggung jawab pengguna.`;

  // Call Gemini API
  let aiResponse;
  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return jsonResponse(JSON.stringify({ error: "Gemini API error: " + geminiRes.status, detail: errText }), corsHeaders, 502);
    }

    const geminiData = await geminiRes.json();
    const candidates = geminiData.candidates || [];
    if (candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
      return jsonResponse(JSON.stringify({ error: "Gemini returned empty response", raw: geminiData }), corsHeaders, 502);
    }

    aiResponse = candidates[0].content.parts[0].text;
  } catch (e) {
    console.error("Gemini fetch error:", e);
    return jsonResponse(JSON.stringify({ error: "Failed to call Gemini API", detail: e.message }), corsHeaders, 502);
  }

  // Build response
  const responseBody = JSON.stringify({
    success: true,
    coin: {
      id: coinId,
      name: marketInfo.name,
      symbol: marketInfo.symbol,
      image: marketInfo.image,
      currentPrice: marketInfo.currentPrice,
      marketCap: marketInfo.marketCap,
      marketCapRank: marketInfo.marketCapRank,
      totalVolume: marketInfo.totalVolume,
      high24h: marketInfo.high24h,
      low24h: marketInfo.low24h,
      priceChange24h: parseFloat(marketInfo.priceChange24h),
      priceChange7d: parseFloat(marketInfo.priceChange7d),
      priceChange30d: parseFloat(marketInfo.priceChange30d),
      ath: marketInfo.ath,
      athChangePercentage: parseFloat(marketInfo.athChangePercentage),
      atl: marketInfo.atl,
      atlChangePercentage: parseFloat(marketInfo.atlChangePercentage),
      circulatingSupply: marketInfo.circulatingSupply,
      totalSupply: marketInfo.totalSupply,
      maxSupply: marketInfo.maxSupply,
      volatility30d: parseFloat(marketInfo.volatility30d) || 0,
      maxDrawdown30d: parseFloat(marketInfo.maxDrawdown30d) || 0,
    },
    analysis: aiResponse,
    news: newsArticles.map(n => ({
      title: n.title,
      url: n.url,
      source: n.source,
      date: n.date,
      body: n.body,
    })),
    fearGreed: {
      value: fngData.value,
      classification: fngData.classification,
    },
    timestamp: new Date().toISOString(),
  });

  // Cache the result
  await putCached(cacheKey, responseBody, ttl);

  return jsonResponse(responseBody, corsHeaders);
}

async function handleAiCompare(request, env, url, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResponse(JSON.stringify({ error: "Method not allowed. Use POST." }), corsHeaders, 405);
  }

  let reqBody;
  try {
    reqBody = await request.json();
  } catch (e) {
    return jsonResponse(JSON.stringify({ error: "Invalid JSON body" }), corsHeaders, 400);
  }

  const coinId1 = (reqBody.coinId1 || "").toLowerCase().trim();
  const coinId2 = (reqBody.coinId2 || "").toLowerCase().trim();
  if (!coinId1 || !coinId2) {
    return jsonResponse(JSON.stringify({ error: "coinId1 and coinId2 are required" }), corsHeaders, 400);
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResponse(JSON.stringify({ error: "Gemini API key not configured on server" }), corsHeaders, 500);
  }

  // Cache key: sorted so "btc+doge" and "doge+btc" share the same cache entry
  const sorted = [coinId1, coinId2].sort();
  const cacheUrl = new URL(url.toString());
  cacheUrl.pathname = "/api/ai-compare";
  cacheUrl.searchParams.set("c1", sorted[0]);
  cacheUrl.searchParams.set("c2", sorted[1]);
  const cacheKey = new Request(cacheUrl.toString());
  const ttl = 300;

  const cached = await getCached(cacheKey);
  if (cached) {
    const body = await cached.text();
    return jsonResponse(body, corsHeaders);
  }

  // Fetch all data in parallel: coin markets (both coins in 1 call), 30d history (×2), news (×2), Fear & Greed
  const idsParam = `${encodeURIComponent(coinId1)},${encodeURIComponent(coinId2)}`;
  const [marketsRes, hist1Res, hist2Res, news1Res, news2Res, fngRes] = await Promise.allSettled([
    // 1 call for both coins via markets endpoint (supports comma-separated ids)
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=2&page=1&sparkline=false&price_change_percentage=7d,30d`, {
      headers: { "x-cg-demo-api-key": env.COINGECKO_API_KEY || "", "Accept": "application/json" }
    }),
    fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId1)}/market_chart?vs_currency=usd&days=30&interval=daily`, {
      headers: { "x-cg-demo-api-key": env.COINGECKO_API_KEY || "", "Accept": "application/json" }
    }),
    fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId2)}/market_chart?vs_currency=usd&days=30&interval=daily`, {
      headers: { "x-cg-demo-api-key": env.COINGECKO_API_KEY || "", "Accept": "application/json" }
    }),
    fetch(`https://data-api.coindesk.com/news/v1/search?search_string=${encodeURIComponent(coinId1)}&source_key=coindesk&limit=4&lang=EN`),
    fetch(`https://data-api.coindesk.com/news/v1/search?search_string=${encodeURIComponent(coinId2)}&source_key=coindesk&limit=4&lang=EN`),
    fetch("https://api.alternative.me/fng/?limit=7"),
  ]);

  // Parse both coins from single markets response
  let coinData1 = null, coinData2 = null;
  if (marketsRes.status === "fulfilled" && marketsRes.value.ok) {
    try {
      const marketsArr = await marketsRes.value.json();
      coinData1 = marketsArr.find(c => c.id === coinId1) || null;
      coinData2 = marketsArr.find(c => c.id === coinId2) || null;
    } catch (e) { /* ignore parse errors */ }
  }

  if (!coinData1 || !coinData2) {
    const missing = !coinData1 ? coinId1 : coinId2;
    return jsonResponse(JSON.stringify({ error: `Failed to fetch market data for "${missing}". The coin ID may be invalid or CoinGecko rate limit was reached. Please try again in a moment.` }), corsHeaders, 502);
  }

  // Helper: extract market info from /coins/markets item format
  function extractMarketInfo(c) {
    return {
      id: c.id,
      name: c.name || c.id,
      symbol: (c.symbol || "").toUpperCase(),
      image: c.image || "",
      currentPrice: c.current_price || 0,
      marketCap: c.market_cap || 0,
      marketCapRank: c.market_cap_rank || "N/A",
      totalVolume: c.total_volume || 0,
      high24h: c.high_24h || 0,
      low24h: c.low_24h || 0,
      priceChange24h: (c.price_change_percentage_24h || 0).toFixed(2),
      priceChange7d: (c.price_change_percentage_7d_in_currency || 0).toFixed(2),
      ath: c.ath || 0,
      athChangePercentage: (c.ath_change_percentage || 0).toFixed(2),
      atl: c.atl || 0,
      circulatingSupply: c.circulating_supply || 0,
      maxSupply: c.max_supply || null,
    };
  }

  // Parse history data
  async function parseHistory(histResSettled) {
    if (histResSettled.status !== "fulfilled" || !histResSettled.value.ok) {
      return { priceArray: [], volatility: 0, maxDrawdown: 0, priceChange30d: "N/A" };
    }
    try {
      const histData = await histResSettled.value.json();
      if (!histData.prices || histData.prices.length < 2) {
        return { priceArray: [], volatility: 0, maxDrawdown: 0, priceChange30d: "N/A" };
      }
      const priceArray = histData.prices.map(p => p[1]);
      const volatility = parseFloat(calculateVolatility(priceArray)) || 0;
      const maxDrawdown = parseFloat(calculateMaxDrawdown(priceArray)) || 0;
      const priceChange30d = (((priceArray[priceArray.length - 1] - priceArray[0]) / priceArray[0]) * 100).toFixed(2);
      return { priceArray, volatility, maxDrawdown, priceChange30d };
    } catch (e) {
      return { priceArray: [], volatility: 0, maxDrawdown: 0, priceChange30d: "N/A" };
    }
  }

  const [hist1Data, hist2Data] = await Promise.all([parseHistory(hist1Res), parseHistory(hist2Res)]);

  const info1 = { ...extractMarketInfo(coinData1), priceChange30d: hist1Data.priceChange30d, volatility30d: hist1Data.volatility, maxDrawdown30d: hist1Data.maxDrawdown };
  const info2 = { ...extractMarketInfo(coinData2), priceChange30d: hist2Data.priceChange30d, volatility30d: hist2Data.volatility, maxDrawdown30d: hist2Data.maxDrawdown };

  // Parse news — merge, deduplicate by URL, take top 6
  let newsArticles = [];
  try {
    const seenUrls = new Set();
    for (const newsRes of [news1Res, news2Res]) {
      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const nd = await newsRes.value.json();
        for (const item of (nd.Data || []).slice(0, 4)) {
          if (!seenUrls.has(item.URL)) {
            seenUrls.add(item.URL);
            newsArticles.push({
              title: item.TITLE || "",
              body: item.BODY ? item.BODY.substring(0, 250) : "",
              url: item.URL || "",
              source: item.SOURCE_DATA?.NAME || "CoinDesk",
              date: item.PUBLISHED_ON ? new Date(item.PUBLISHED_ON * 1000).toISOString().split("T")[0] : "",
            });
          }
        }
      }
    }
  } catch (e) { /* ignore */ }

  // Fear & Greed
  let fngData = { value: "N/A", classification: "N/A", history: [] };
  if (fngRes.status === "fulfilled" && fngRes.value.ok) {
    try {
      const fngJson = await fngRes.value.json();
      if (fngJson.data && fngJson.data.length > 0) {
        fngData.value = fngJson.data[0].value;
        fngData.classification = fngJson.data[0].value_classification;
        fngData.history = fngJson.data.map(d => ({
          value: d.value,
          classification: d.value_classification,
          date: new Date(d.timestamp * 1000).toISOString().split("T")[0],
        }));
      }
    } catch (e) { /* ignore */ }
  }

  const newsContext = newsArticles.length > 0
    ? newsArticles.map((n, i) => `  ${i + 1}. [${n.date}] "${n.title}" (${n.source}) - ${n.body}`).join("\n")
    : "  Tidak ada berita spesifik terkini yang ditemukan.";

  const fngContext = fngData.value !== "N/A"
    ? `Saat ini: ${fngData.value}/100 (${fngData.classification}). Riwayat 7 hari: ${fngData.history.map(h => `${h.date}: ${h.value} (${h.classification})`).join(", ")}`
    : "Data tidak tersedia.";

  // Calculate composite risk score (0-100, higher = riskier) from real data
  function riskScore(info) {
    const vol     = Math.abs(parseFloat(info.volatility30d)) || 0;
    const dd      = Math.abs(parseFloat(info.maxDrawdown30d)) || 0;
    const rank    = typeof info.marketCapRank === "number" ? info.marketCapRank
                  : (parseInt(info.marketCapRank) || 500);
    const pc7d    = Math.abs(parseFloat(info.priceChange7d)) || 0;
    const athDist = Math.abs(parseFloat(info.athChangePercentage)) || 0;
    return Math.round(
      Math.min(vol     / 20,  1) * 35 +  // volatility   35%
      Math.min(dd      / 50,  1) * 30 +  // drawdown     30%
      Math.min(rank    / 500, 1) * 20 +  // rank risk    20%
      Math.min(pc7d    / 30,  1) * 10 +  // 7d move      10%
      Math.min(athDist / 80,  1) *  5    // ATH distance  5%
    );
  }
  function riskLabel(s) {
    if (s <= 25) return "Rendah";
    if (s <= 50) return "Menengah";
    if (s <= 75) return "Tinggi";
    return "Sangat Tinggi";
  }
  const risk1 = riskScore(info1);
  const risk2 = riskScore(info2);

  const prompt = `Kamu adalah seorang analis kripto profesional bernama "CoinSight AI". Tugasmu adalah membandingkan dua aset kripto secara menyeluruh dan memberikan analisis risiko yang objektif.

PENTING:
- Jawab SELURUHNYA dalam Bahasa Indonesia
- Gunakan HANYA data yang diberikan sebagai dasar analisis
- Berikan perspektif yang berimbang untuk kedua koin
- SELALU ingatkan bahwa ini adalah analisis edukatif, BUKAN financial advice

=== KOIN 1: ${info1.name} (${info1.symbol}) ===
Harga: $${info1.currentPrice} | Market Cap: ${formatCompactNum(info1.marketCap)} (Rank #${info1.marketCapRank})
Volume 24h: ${formatCompactNum(info1.totalVolume)} | 24h High/Low: $${info1.high24h} / $${info1.low24h}
Perubahan: 24h ${info1.priceChange24h}% | 7d ${info1.priceChange7d}% | 30d ${info1.priceChange30d}%
ATH: $${info1.ath} (${info1.athChangePercentage}% dari ATH)
Supply: Circulating ${info1.circulatingSupply.toLocaleString()} | Max ${info1.maxSupply ? info1.maxSupply.toLocaleString() : "Tidak terbatas"}
Risiko 30d: Volatilitas ${info1.volatility30d}% | Max Drawdown ${info1.maxDrawdown30d}%
Composite Risk Score: ${risk1}/100 (${riskLabel(risk1)})

=== KOIN 2: ${info2.name} (${info2.symbol}) ===
Harga: $${info2.currentPrice} | Market Cap: ${formatCompactNum(info2.marketCap)} (Rank #${info2.marketCapRank})
Volume 24h: ${formatCompactNum(info2.totalVolume)} | 24h High/Low: $${info2.high24h} / $${info2.low24h}
Perubahan: 24h ${info2.priceChange24h}% | 7d ${info2.priceChange7d}% | 30d ${info2.priceChange30d}%
ATH: $${info2.ath} (${info2.athChangePercentage}% dari ATH)
Supply: Circulating ${info2.circulatingSupply.toLocaleString()} | Max ${info2.maxSupply ? info2.maxSupply.toLocaleString() : "Tidak terbatas"}
Risiko 30d: Volatilitas ${info2.volatility30d}% | Max Drawdown ${info2.maxDrawdown30d}%
Composite Risk Score: ${risk2}/100 (${riskLabel(risk2)})

=== BERITA TERKINI (Gabungan) ===
${newsContext}

=== FEAR & GREED INDEX ===
${fngContext}

=== INSTRUKSI OUTPUT ===
Berikan analisis perbandingan dengan format berikut (gunakan heading markdown ## untuk setiap section):

## Ringkasan Perbandingan
Ringkasan 3-4 kalimat tentang perbedaan utama kedua koin. Nyatakan mana yang lebih bullish/bearish saat ini dan mengapa.

## Profil Risiko

### ${info1.name} (${info1.symbol})
Analisis risiko koin pertama: volatilitas, drawdown, supply dynamics, posisi pasar.

### ${info2.name} (${info2.symbol})
Analisis risiko koin kedua: volatilitas, drawdown, supply dynamics, posisi pasar.

## Perbandingan Head-to-Head
Buat tabel markdown yang membandingkan kedua koin pada metrik kunci: harga terkini, volatilitas 30d, max drawdown, market cap rank, perubahan 7d & 30d, potensi reward vs risiko.

## Sentimen Pasar & Dampak Berita
Analisis Fear & Greed Index dan bagaimana berita terkini mempengaruhi kedua koin.

## Untuk Siapa Koin Ini Cocok?

### ${info1.name}
Profil investor yang cocok untuk koin ini (konservatif/moderat/agresif), dengan alasan berdasarkan data.

### ${info2.name}
Profil investor yang cocok untuk koin ini, dengan alasan berdasarkan data.

## Risiko Utama & Peluang
Buat daftar ringkas risiko dan peluang masing-masing koin dalam 30-90 hari ke depan berdasarkan data yang tersedia.

## 🏆 Pemenang & Kesimpulan Final

Nyatakan pemenang secara EKSPLISIT untuk setiap kategori di bawah ini. WAJIB sebutkan nama koin secara langsung, bukan deskripsi umum.

**🔒 Risiko Lebih Rendah:** [nama koin] — berdasarkan Composite Risk Score (${info1.name}: ${risk1}/100 vs ${info2.name}: ${risk2}/100)
**📈 Potensi Growth Lebih Besar:** [nama koin] — berdasarkan momentum harga dan jarak dari ATH
**💼 Pilihan Investor Konservatif:** [nama koin] — sertakan alasan 1-2 kalimat konkret dari data
**⚡ Pilihan Investor Agresif:** [nama koin] — sertakan alasan 1-2 kalimat konkret dari data

---

### 🥇 OVERALL WINNER: [TULIS NAMA KOIN DI SINI]
Jelaskan dalam 2-3 kalimat mengapa koin ini lebih unggul secara keseluruhan berdasarkan data yang diberikan.

### 📊 Composite Risk Score Final
| Koin | Skor Risiko | Level |
|------|-------------|-------|
| ${info1.name} (${info1.symbol}) | **${risk1}/100** | ${riskLabel(risk1)} |
| ${info2.name} (${info2.symbol}) | **${risk2}/100** | ${riskLabel(risk2)} |

---
⚠️ DISCLAIMER: Analisis ini bersifat edukatif dan dihasilkan oleh AI berdasarkan data pasar terkini. Ini BUKAN merupakan saran investasi atau financial advice. Selalu lakukan riset mandiri (DYOR) dan konsultasikan dengan profesional keuangan sebelum membuat keputusan investasi. Investasi aset kripto mengandung risiko tinggi termasuk kehilangan seluruh modal.`;

  // Call Gemini
  let aiResponse;
  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, topP: 0.9, topK: 40, maxOutputTokens: 6144 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return jsonResponse(JSON.stringify({ error: "Gemini API error: " + geminiRes.status, detail: errText }), corsHeaders, 502);
    }

    const geminiData = await geminiRes.json();
    const candidates = geminiData.candidates || [];
    if (!candidates[0]?.content?.parts?.[0]?.text) {
      return jsonResponse(JSON.stringify({ error: "Gemini returned empty response", raw: geminiData }), corsHeaders, 502);
    }
    aiResponse = candidates[0].content.parts[0].text;
  } catch (e) {
    return jsonResponse(JSON.stringify({ error: "Failed to call Gemini API", detail: e.message }), corsHeaders, 502);
  }

  const responseBody = JSON.stringify({
    success: true,
    coin1: {
      id: info1.id, name: info1.name, symbol: info1.symbol, image: info1.image,
      currentPrice: info1.currentPrice, marketCap: info1.marketCap, marketCapRank: info1.marketCapRank,
      totalVolume: info1.totalVolume, priceChange24h: parseFloat(info1.priceChange24h),
      priceChange7d: parseFloat(info1.priceChange7d), priceChange30d: parseFloat(info1.priceChange30d) || 0,
      ath: info1.ath, athChangePercentage: parseFloat(info1.athChangePercentage),
      circulatingSupply: info1.circulatingSupply, maxSupply: info1.maxSupply,
      volatility30d: info1.volatility30d, maxDrawdown30d: info1.maxDrawdown30d,
    },
    coin2: {
      id: info2.id, name: info2.name, symbol: info2.symbol, image: info2.image,
      currentPrice: info2.currentPrice, marketCap: info2.marketCap, marketCapRank: info2.marketCapRank,
      totalVolume: info2.totalVolume, priceChange24h: parseFloat(info2.priceChange24h),
      priceChange7d: parseFloat(info2.priceChange7d), priceChange30d: parseFloat(info2.priceChange30d) || 0,
      ath: info2.ath, athChangePercentage: parseFloat(info2.athChangePercentage),
      circulatingSupply: info2.circulatingSupply, maxSupply: info2.maxSupply,
      volatility30d: info2.volatility30d, maxDrawdown30d: info2.maxDrawdown30d,
    },
    analysis: aiResponse,
    news: newsArticles,
    fearGreed: { value: fngData.value, classification: fngData.classification },
    timestamp: new Date().toISOString(),
  });

  await putCached(cacheKey, responseBody, ttl);
  return jsonResponse(responseBody, corsHeaders);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (path === "/" || path === "") {
      return jsonResponse(JSON.stringify({ error: "Method not allowed" }), corsHeaders, 405);
    }

    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const now = Date.now();

    // Use Cloudflare Workers Rate Limiting binding if available (persistent across isolates)
    if (env.RATE_LIMITER && ip !== "unknown") {
      try {
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) {
          return new Response(JSON.stringify({ error: "Too many requests. Please wait 60 seconds." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
          });
        }
      } catch (e) {
        // Binding not configured — skip rate limiting gracefully
      }
    }

    // AI analyze endpoint — single coin (POST)
    if (path === "/api/ai-analyze") {
      try {
        return await handleAiAnalyze(request, env, url, corsHeaders);
      } catch (error) {
        console.error("AI Analyze error:", error);
        return jsonResponse(JSON.stringify({ error: "Internal server error during AI analysis", detail: error.message }), corsHeaders, 500);
      }
    }

    // AI compare endpoint — two coins comparison (POST)
    if (path === "/api/ai-compare") {
      try {
        return await handleAiCompare(request, env, url, corsHeaders);
      } catch (error) {
        console.error("AI Compare error:", error);
        return jsonResponse(JSON.stringify({ error: "Internal server error during AI comparison", detail: error.message }), corsHeaders, 500);
      }
    }

    const cacheKey = new Request(url.toString());
    const ttl = CACHE_TTL[path];

    if (ttl) {
      const cached = await getCached(cacheKey);
      if (cached) {
        const body = await cached.text();
        return jsonResponse(body, corsHeaders);
      }
    }

    try {
      if (path === "/api/coins") {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false", {
          headers: {
            "x-cg-demo-api-key": env.COINGECKO_API_KEY || "",
            "Accept": "application/json"
          }
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const body = JSON.stringify(await response.json());
        await putCached(cacheKey, body, ttl);
        return jsonResponse(body, corsHeaders);
      }

      if (path === "/api/news") {
        const response = await fetch("https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=6");
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const formattedNews = (data.Data || []).slice(0, 6).map(item => ({
          title: item.TITLE,
          subtitle: item.BODY ? item.BODY.substring(0, 200) + "..." : "",
          url: item.URL,
          cover: item.IMAGE_URL,
          source: item.SOURCE_DATA?.NAME || "CoinDesk",
          released_at: item.PUBLISHED_ON * 1000
        }));
        const body = JSON.stringify({ data: formattedNews });
        await putCached(cacheKey, body, ttl);
        return jsonResponse(body, corsHeaders);
      }

      if (path === "/api/coin-news") {
        const coin = url.searchParams.get("coin") || "";
        const symbol = url.searchParams.get("symbol") || "";

        let response = await fetch(`https://data-api.coindesk.com/news/v1/search?search_string=${encodeURIComponent(coin)}&source_key=coindesk&limit=5&lang=EN`);

        let body;

        if (!response.ok) {
          let fallbackResponse = await fetch(`https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=5`);
          if (!fallbackResponse.ok) throw new Error(`API error: ${fallbackResponse.status}`);

          const fbData = await fallbackResponse.json();
          const formattedNews = (fbData.Data || []).slice(0, 5).map(item => ({
            title: item.TITLE,
            subtitle: item.BODY ? item.BODY.substring(0, 150) + "..." : "",
            url: item.URL,
            cover: item.IMAGE_URL,
            source: item.SOURCE_DATA?.NAME || "CoinDesk",
            released_at: item.PUBLISHED_ON * 1000
          }));
          body = JSON.stringify({ data: formattedNews });
        } else {
          const data = await response.json();
          const formattedNews = (data.Data || []).slice(0, 5).map(item => ({
            title: item.TITLE,
            subtitle: item.BODY ? item.BODY.substring(0, 150) + "..." : "",
            url: item.URL,
            cover: item.IMAGE_URL,
            source: item.SOURCE_DATA?.NAME || "CoinDesk",
            released_at: item.PUBLISHED_ON * 1000
          }));
          body = JSON.stringify({ data: formattedNews });
        }

        await putCached(cacheKey, body, ttl);
        return jsonResponse(body, corsHeaders);
      }

      return jsonResponse(JSON.stringify({ error: "Not found" }), corsHeaders, 404);

    } catch (error) {
      return jsonResponse(JSON.stringify({ detail: error.message }), corsHeaders, 500);
    }
  },
};
