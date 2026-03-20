# Copilot instructions

## Commands

- Install the local FastAPI proxy dependencies with `python -m pip install -r backend\requirements.txt`.
- Run the local FastAPI proxy with `python backend\main.py`. The checked-in entrypoint starts Uvicorn on port `11930`.
- GitHub Pages deployment is handled by `.github\workflows\static.yml`, which uploads the repository as static content. There is no checked-in build, lint, or automated test command in this repository.

## High-level architecture

- The app is a static frontend deployed to GitHub Pages. `index.html` is the landing page and market dashboard, while `news.html` is a dedicated crypto news page. Both pages share `style.css` but each page has its own script file (`script.js` and `news.js`).
- Frontend dependencies are loaded directly from CDNs in the HTML pages, not from a package manager or bundler. Tailwind, Font Awesome, Lucide, GSAP, and TradingView are consumed as globals.
- The browser does not call third-party crypto APIs directly. Both `script.js` and `news.js` call a hardcoded Cloudflare Worker base URL ending in `/api`, and expect JSON from that proxy.
- There are two backend proxy implementations with the same API contract: `backend\worker.js` for Cloudflare Workers and `backend\main.py` for FastAPI/Uvicorn. Both expose `/api/coins`, `/api/news`, and `/api/coin-news`, and both translate third-party responses into the shapes the frontend renders.
- The worker is the production-facing proxy. It adds CORS headers, rate limiting, and reads configuration such as `ALLOWED_ORIGIN` and `COINGECKO_API_KEY` from the environment.
- `script.js` owns the home page behavior: navbar animation, market table rendering, the coin detail modal, favorites, URL deep-linking with `?coin=...`, and the homepage news cards.
- `news.js` owns the news page behavior: featured coin carousels, all-news rendering, the search flow, and the same animated/offline handling patterns used on the homepage.

## Key conventions

- Keep frontend changes compatible with plain browser JavaScript. The current codebase uses global-scope helpers, `var`, direct DOM queries, and large IIFEs instead of modules or framework components.
- Reuse the existing `fetchWithTimeout()` and `showConnectionError()` pattern for frontend network requests so timeout and offline behavior stay consistent across pages.
- Treat HTML IDs and classes as part of the JS contract. The scripts depend on specific element IDs such as `crypto-table-body`, `news-container`, `search-form`, `carousel-btc`, and `coin-news-container`.
- Keep user-facing copy consistent with the existing product language. Most UI text, loading states, and errors are written in Indonesian, even when API/provider names stay in English.
- Preserve the current client-side state contracts when extending features: favorites are stored in `localStorage` under `coin_favorites`, and opening a coin detail modal updates the URL query string with `coin=<id>`.
- Keep the backend response shapes stable when editing API code. News responses are wrapped as `{ "data": [...] }`, and news timestamps are normalized into `released_at` in milliseconds for the frontend.
- If you add or change an API endpoint, update all four touchpoints together: `backend\worker.js`, `backend\main.py`, `script.js`, and `news.js`.
- When you need library or API documentation, setup steps, or configuration details, use Context7 MCP first. The repository already encodes that expectation in `.agents\rules\context7usage.md`.

## Relevant MCP server

- Playwright MCP is a strong fit for this repository because the product is a static, browser-only UI with heavy DOM manipulation, GSAP-driven motion, and two primary page flows in `index.html` and `news.html`.
- Use Playwright MCP to validate behaviors that are hard to catch by reading code alone: market table loading, `?coin=` deep-linking into the detail modal, homepage news rendering, news search results, and carousel/button interactions on `news.html`.
- Prefer browser-driven checks after changing markup, DOM IDs, CDN-loaded globals, or animation code, because this repository does not have a checked-in frontend test suite or build pipeline to catch those regressions automatically.
