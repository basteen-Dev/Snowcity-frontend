import { next } from '@vercel/edge';

/**
 * Vercel Edge Middleware — Dynamic Rendering for SEO crawlers.
 *
 * WHY: This site is a client-rendered Vite SPA. Crawlers that don't (or barely)
 * execute JS — Googlebot's first pass, Bingbot, and every social scraper
 * (Facebook/WhatsApp/Twitter/LinkedIn/Slack/Discord) — would otherwise receive
 * the empty `<div id="root"></div>` shell with no title/OG/content.
 *
 * The backend ALREADY renders full SEO HTML for content slugs at
 *   GET https://app.snowcityblr.com/:slug   (see Snowcity-Backend ssr.routes.js)
 * This middleware simply routes bot traffic there. Humans fall through to the SPA.
 *
 * Strategy: fetch the backend SSR and serve it ONLY when it returns real HTML.
 * For listing pages (/blog, /attractions, …) and the homepage the backend has no
 * matching slug and returns 404/empty, so we fall back to the SPA shell — which
 * already carries baseline meta in index.html. No route list to maintain.
 *
 * This is "dynamic rendering" — explicitly permitted by Google (not cloaking),
 * because bots and users get equivalent content.
 */

// Backend origin that hosts the SSR routes. Overridable via env in Vercel settings.
const SSR_ORIGIN = (process.env.SSR_ORIGIN || 'https://app.snowcityblr.com').replace(/\/$/, '');

// Known crawler / link-preview user agents. Search bots + social scrapers.
const BOT_UA = new RegExp(
  [
    // Search engines
    'googlebot', 'google-inspectiontool', 'storebot-google', 'google-structured-data',
    'bingbot', 'bingpreview', 'slurp', 'duckduckbot', 'baiduspider', 'yandex',
    'sogou', 'exabot', 'ia_archiver', 'applebot', 'petalbot', 'seznambot',
    // SEO tools (optional but harmless)
    'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot',
    // Social / messaging link unfurlers
    'facebookexternalhit', 'facebookcatalog', 'meta-externalagent', 'twitterbot',
    'linkedinbot', 'whatsapp', 'slackbot', 'discordbot', 'telegrambot',
    'pinterest', 'redditbot', 'embedly', 'quora link preview', 'vkshare',
    'skypeuripreview', 'nuzzel', 'w3c_validator', 'outbrain',
  ].join('|'),
  'i'
);

// Only run on HTML routes. Exclude API, admin panel, build assets, and any path
// with a file extension (sitemaps, robots.txt, images, etc.).
export const config = {
  matcher: ['/((?!api/|parkpanel|assets/|.*\\.).*)'],
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  // Real users → straight to the SPA. Zero added latency.
  if (!BOT_UA.test(ua)) return next();

  const url = new URL(request.url);

  try {
    const target = `${SSR_ORIGIN}${url.pathname}${url.search}`;
    const res = await fetch(target, {
      headers: {
        // Forward the bot UA so backend logs/treats it correctly.
        'user-agent': ua,
        accept: 'text/html',
        'x-ssr-proxy': '1',
      },
      redirect: 'manual',
    });

    // Backend issues 301s to canonicalize (e.g. /blog/:slug → /:slug). Honor them.
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      return Response.redirect(new URL(location, url.origin).toString(), 301);
    }

    if (res.ok) {
      const body = await res.text();
      // Only serve genuine SSR output; empty/placeholder → fall back to SPA.
      if (body && body.trim().length > 200) {
        return new Response(body, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=300, s-maxage=600',
            'x-rendered-by': 'ssr-edge',
          },
        });
      }
    }
  } catch {
    // Network error / backend down → never block the crawler; serve the SPA.
  }

  return next();
}
