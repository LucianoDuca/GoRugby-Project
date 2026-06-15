// Vercel Edge Function — proxy for api-sports.io Rugby API
// All requests hit /api/rugby?_e=<endpoint>&<params...>
// The _e param selects the upstream endpoint; all other params are forwarded as-is.
// The API key is never exposed to the browser.

export const config = { runtime: 'edge' };

const BASE = 'https://v1.rugby.api-sports.io';
const CACHE: Record<string, { data: unknown; ts: number }> = {};
const TTL = 30_000;

export default async function handler(request: Request): Promise<Response> {
  const apiKey = (process.env.RUGBY_API_KEY ?? '').trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RUGBY_API_KEY not configured on Vercel' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const url = new URL(request.url);
  const endpoint = url.searchParams.get('_e') ?? '';
  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Missing _e parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Build upstream URL: strip _e, keep all other query params
  const fwd = new URLSearchParams(url.searchParams);
  fwd.delete('_e');
  const upstream = `${BASE}/${endpoint}${fwd.size > 0 ? `?${fwd.toString()}` : ''}`;

  const cached = CACHE[upstream];
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
    const res  = await fetch(upstream, {
      headers: { 'x-apisports-key': apiKey, 'Accept': 'application/json' },
    });
    const data = await res.json();
    CACHE[upstream] = { data, ts: Date.now() };

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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
