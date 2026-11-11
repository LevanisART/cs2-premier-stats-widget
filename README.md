# CS2 Premier and Faceit Stats Widget

Live **CS2 Premier + Faceit** stats overlay for streamers. Enter your Steam ID or
Faceit nickname, pick a design, and drop the URL into OBS, Streamlabs, or any
browser source. Your rank, stats, and recent form update on stream automatically.

![CS2 Stats Widget preview](https://i.ibb.co/0RD8GqBy/cs2-stats-widget-1.png)

> ⚠️ **For Premier, a free [Leetify](https://leetify.com) account is required.**
> Sign up, make your profile **public**, and
> **[connect Matchmaking](https://leetify.com/app/data-sources)** with your
> **[authentication code](https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128)** -
> otherwise your Premier rank and stats won't load. (Faceit works on its own, no
> Leetify account needed.)

**Live:** [cs2livestats.com](https://cs2livestats.com)

---

## Features

### Ranks (free)
- **Premier + Faceit together** in one widget - show both, or hide either.
- **Premier**: CS Rating, rating change (+/-), and an `UNRANKED` state before
  your rating unlocks. Tier-colored (gray to gold, red at 25k+).
- **Faceit**: official skill-level icon + ELO, colored by level (1-10).
- **Steam ID *or* Faceit nickname** - enter a nickname and we auto-pull the
  Premier rating from the linked Steam account.

### Stats & history (free)
- **Stats row**, averaged over your last *N* matches (3 / 5 / 8 / 10):
  - Premier: **AVG kills · K/D · AIM**
  - Faceit: **K/D · Win % · HS %**
- **Match history** - recent W/L/T as colored letters.
- **Avatar** (Steam or Faceit) and **player name** (Steam name, or switch to your
  Faceit username).
- **Auto-refresh** (1 / 3 / 5 min) and a transparent background for OBS.

### Pro features - `PRO`
- **Cheaters faced today** - a best-effort flag of suspicious **Premier /
  Competitive** opponents you faced today (optionally lists their names). Not a
  confirmed ban count; not available for Faceit matches.
- **Map cover** - a circular version of the widget sized to sit over your in-game
  radar/minimap and hide it from stream snipers.
- **Today's session** - net rating gained/lost and your W/L for today.

### Designs - `PRO`
8 themes. **Default** is free; the rest are Pro:
| Theme | Look |
| --- | --- |
| **Default** | Clean dark card (free) |
| **Neon** | Glowing border + text, tinted to your rank color |
| **Glass** | Frosted translucent panel |
| **Gradient** | Rank-colored diagonal gradient |
| **Terminal** | Monospace green-on-black |
| **Compact** | Condensed layout |
| **Minimal** | Text only, no box (shadowed for legibility) |
| **Stacked** | Vertical, centered badge |

### Quick presets
One click sets what shows (no fiddling with checkboxes):
**Everything · Ranks only · Ranks + stats · Vertical · Map cover**

### Works everywhere
OBS, Streamlabs, Twitch Studio, XSplit - anything with a browser source. No
install, no download. Just paste a URL.

---

## How to use

1. Go to **[cs2livestats.com](https://cs2livestats.com)**.
2. Enter your **Steam ID** (steamid.io) or **Faceit nickname**, pick a design, and
   choose what to show (live preview).
3. Copy the generated URL into OBS/Streamlabs as a **Browser Source**. Done.

---

## Pricing

- **Free** - ranks, stats, match history, the Default design.
- **Pro - $10 one-time** (not a subscription): all premium designs, cheaters
  faced today, map cover, today's session. Sign in with Steam and purchase once;
  it unlocks **forever on your Steam account**.

---

## Data & credits

- **Premier** data from [Leetify](https://leetify.com) (public API).
- **Faceit** data from the official [Faceit](https://faceit.com) Data API.
- Sign in with **Steam** (OpenID) to purchase/manage Pro.

---
