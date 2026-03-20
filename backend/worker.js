const rateLimitMap = new Map();
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    if (ip !== "unknown") {
      const userRecord = rateLimitMap.get(ip);
      if (!userRecord) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        if (now - userRecord.lastReset > TIME_WINDOW) {
          rateLimitMap.set(ip, { count: 1, lastReset: now });
        } else {
          userRecord.count++;
          if (userRecord.count > RATE_LIMIT) {
            const retryAfter = Math.ceil((TIME_WINDOW - (now - userRecord.lastReset)) / 1000);
            return new Response(JSON.stringify({ error: "Too many requests" }), {
              status: 429,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Retry-After": retryAfter.toString()
              }
            });
          }
        }
      }
    }

    if (Math.random() < 0.05) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.lastReset > TIME_WINDOW) {
          rateLimitMap.delete(key);
        }
      }
    }

    // AI analyze endpoint (POST, special cache handling)
    if (path === "/api/ai-analyze") {
      try {
        return await handleAiAnalyze(request, env, url, corsHeaders);
      } catch (error) {
        console.error("AI Analyze error:", error);
        return jsonResponse(JSON.stringify({ error: "Internal server error during AI analysis", detail: error.message }), corsHeaders, 500);
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
