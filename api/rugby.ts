// Vercel Edge Function — proxy for api-sports.io Rugby API
// Keeps the API key server-side, never exposed to the browser.

export const config = { runtime: 'edge' };

const BASE = 'https://v1.rugby.api-sports.io';
const CACHE: Record<string, { data: unknown; ts: number }> = {};
const TTL = 30_000; // 30 s cache for live data

export default async function handler(request: Request): Promise<Response> {
  const apiKey = (process.env.RUGBY_API_KEY ?? '').trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RUGBY_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  // Strip the /api/rugby prefix to get the actual endpoint path + query
  const endpoint = url.pathname.replace(/^\/api\/rugby\/?/, '') || '';
  const qs = url.search;
  const upstream = `${BASE}/${endpoint}${qs}`;

  // Simple in-memory cache (resets on cold start, fine for Edge)
  const cacheKey = upstream;
  const cached = CACHE[cacheKey];
  if (cached && Date.now() - cached.ts < TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const res = await fetch(upstream, {
      headers: {
        'x-apisports-key': apiKey,
        'Accept': 'application/json',
      },
    });

    const data = await res.json();
    CACHE[cacheKey] = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
