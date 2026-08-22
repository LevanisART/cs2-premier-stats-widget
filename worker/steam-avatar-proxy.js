// Cloudflare Worker: Steam avatar proxy
//
// The widget is a static GitHub Pages site, so it can't call Steam's Web API
// directly: the API needs a key (which must stay secret) and sends no CORS
// headers (so browsers block the request). This Worker sits in between —
// it resolves a Steam64 ID to a Steam avatar image URL using the Steam Web
// API, keeps the key server-side, and adds the CORS headers the browser needs.
//
// Setup (see worker/README.md for details):
//   1. Deploy this Worker (`wrangler deploy`, or paste it in the CF dashboard).
//   2. Add your Steam Web API key as a secret named STEAM_API_KEY:
//        wrangler secret put STEAM_API_KEY
//      (or dashboard → Settings → Variables and Secrets → Add). Get a key at
//      https://steamcommunity.com/dev/apikey
//   3. Point the widget at the Worker's URL via VITE_AVATAR_PROXY_URL
//      (see the repo README).

// Only these site origins may call the Worker from a browser. CORS is what
// stops other websites from using your Steam key / Cloudflare quota. Add or
// remove entries here (scheme + host only, no trailing slash or path).
const ALLOWED_ORIGINS = new Set([
  'https://levanisart.github.io',
  'https://sidkapahi.github.io',
  'http://localhost:5173', // local dev (npm run dev)
]);

// Builds the CORS headers for a request. When the caller's Origin is on the
// allowlist we echo it back (the CORS spec allows only one origin per response,
// so it can't be a static list); otherwise no Allow-Origin is sent and the
// browser blocks the response. `Vary: Origin` keeps caches from mixing origins.
function corsHeaders(request) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const steamId = url.searchParams.get('steam64_id');

    // Steam64 IDs are 17-digit numbers; reject anything else to avoid the
    // Worker being used as an open proxy for arbitrary Steam API calls.
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return json({ error: 'Invalid or missing steam64_id' }, 400, cors);
    }

    if (!env.STEAM_API_KEY) {
      return json({ error: 'Worker is missing the STEAM_API_KEY secret' }, 500, cors);
    }

    const api =
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/' +
      `?key=${env.STEAM_API_KEY}&steamids=${steamId}`;

    let player;
    try {
      const res = await fetch(api);
      if (!res.ok) return json({ error: `Steam API error: ${res.status}` }, 502, cors);
      const data = await res.json();
      player = data?.response?.players?.[0];
    } catch {
      return json({ error: 'Failed to reach the Steam API' }, 502, cors);
    }

    // Private profile or unknown ID: no player returned. Reply 200 with an
    // empty avatar so the widget just hides the avatar slot rather than erroring.
    if (!player) return json({ avatarUrl: '' }, 200, cors);

    // avatarfull is the 184x184 image; avatarmedium (64x64) is also available.
    return json({ avatarUrl: player.avatarfull ?? '' }, 200, cors);
  },
};

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Steam avatars rarely change, so let the edge cache the answer.
      'Cache-Control': 'public, max-age=3600',
      ...cors,
    },
  });
}
