// Vercel Edge Function — proxy for Highlightly (RapidAPI)
// All requests hit /api/highlightly?_e=<endpoint>&<params...>
// Keeps both the API key and host server-side only.

export const config = { runtime: 'edge' };

declare const process: { env: Record<string, string | undefined> };

const CACHE: Record<string, { data: unknown; ts: number }> = {};
const TTL = 60_000; // 1 minute cache

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function err(msg: string, status = 500): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: CORS });
}

export default async function handler(request: Request): Promise<Response> {
  const apiKey  = (process.env.HIGHLIGHTLY_API_KEY  ?? '').trim();
  const apiHost = (process.env.HIGHLIGHTLY_API_HOST ?? '').trim();

  if (!apiKey || !apiHost) {
    return err('HIGHLIGHTLY_API_KEY / HIGHLIGHTLY_API_HOST not configured on Vercel');
  }

  const url      = new URL(request.url);
  const endpoint = url.searchParams.get('_e') ?? '';
  if (!endpoint) return err('Missing _e parameter', 400);

  const fwd = new URLSearchParams(url.searchParams);
  fwd.delete('_e');
  const fwdStr   = fwd.toString();
  const upstream = `https://${apiHost}/${endpoint}${fwdStr ? `?${fwdStr}` : ''}`;

  const cached = CACHE[upstream];
  if (cached && Date.now() - cached.ts < TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { ...CORS, 'X-Cache': 'HIT' },
    });
  }

  try {
    const res  = await fetch(upstream, {
      headers: {
        'x-rapidapi-key':  apiKey,
        'x-rapidapi-host': apiHost,
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    if (res.ok) CACHE[upstream] = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        ...CORS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (e) {
    return err(`Upstream error: ${String(e)}`, 502);
  }
}
