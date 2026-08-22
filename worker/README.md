# Steam avatar proxy (Cloudflare Worker)

Leetify's public API doesn't return a player avatar, and the widget is a static
GitHub Pages site, so it can't call Steam's Web API itself — that API needs a
secret key and doesn't send CORS headers. This tiny Worker resolves a Steam64 ID
to a Steam avatar URL, keeping the key server-side and adding CORS.

It's **optional**. Without it, the widget simply doesn't show an avatar.

## Deploy

1. **Get a Steam Web API key** (free): https://steamcommunity.com/dev/apikey

2. **Deploy the Worker** with [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

   ```bash
   cd worker
   npx wrangler deploy
   ```

   (Or create a Worker in the Cloudflare dashboard and paste in
   `steam-avatar-proxy.js`.)

3. **Add your key as a secret** — never commit it:

   ```bash
   npx wrangler secret put STEAM_API_KEY
   ```

   (Dashboard equivalent: your Worker → Settings → Variables and Secrets → add a
   **secret** named `STEAM_API_KEY`.)

4. **Point the widget at the Worker.** Note the Worker's URL (e.g.
   `https://cs2-steam-avatar-proxy.<you>.workers.dev`) and set it as the build
   variable `VITE_AVATAR_PROXY_URL`:

   - **Local dev:** add it to `.env.local`.
   - **Deployed site:** add a repository **variable** (or secret)
     `VITE_AVATAR_PROXY_URL` under Settings → Secrets and variables → Actions.
     The URL is not sensitive — it gets inlined into the public bundle — so a
     plain repository *variable* is fine.

That's it. The widget calls `GET {VITE_AVATAR_PROXY_URL}?steam64_id=<id>` and
renders the returned avatar. The **Steam key stays on Cloudflare** and never
reaches the browser.

## Allowed origins (CORS)

The Worker only answers browser requests from the site origins listed in
`ALLOWED_ORIGINS` at the top of `steam-avatar-proxy.js` — that's what stops other
websites from spending your Steam key / Cloudflare quota. Edit that list (scheme +
host only, no trailing slash) to match wherever the widget is hosted, e.g.
`https://<you>.github.io`, plus `http://localhost:5173` for local dev. After
changing it, redeploy the Worker.

## Response shape

```
GET /?steam64_id=76561198123894701
→ 200 { "avatarUrl": "https://avatars.steamstatic.com/<hash>_full.jpg" }
```

A private profile or unknown ID returns `{ "avatarUrl": "" }` (the widget then
just hides the avatar). Invalid IDs return `400`.
