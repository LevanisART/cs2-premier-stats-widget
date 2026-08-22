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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const steamId = url.searchParams.get('steam64_id');

    // Steam64 IDs are 17-digit numbers; reject anything else to avoid the
    // Worker being used as an open proxy for arbitrary Steam API calls.
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return json({ error: 'Invalid or missing steam64_id' }, 400);
    }

    if (!env.STEAM_API_KEY) {
      return json({ error: 'Worker is missing the STEAM_API_KEY secret' }, 500);
    }

    const api =
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/' +
      `?key=${env.STEAM_API_KEY}&steamids=${steamId}`;

    let player;
    try {
      const res = await fetch(api);
      if (!res.ok) return json({ error: `Steam API error: ${res.status}` }, 502);
      const data = await res.json();
      player = data?.response?.players?.[0];
    } catch {
      return json({ error: 'Failed to reach the Steam API' }, 502);
    }

    // Private profile or unknown ID: no player returned. Reply 200 with an
    // empty avatar so the widget just hides the avatar slot rather than erroring.
    if (!player) return json({ avatarUrl: '' }, 200);

    // avatarfull is the 184x184 image; avatarmedium (64x64) is also available.
    return json({ avatarUrl: player.avatarfull ?? '' }, 200);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Steam avatars rarely change, so let the edge cache the answer.
      'Cache-Control': 'public, max-age=3600',
      ...CORS,
    },
  });
}
