# CS2 Premier Widget

OBS browser source widget that displays your CS2 Premier rating, stats, and recent match history. Data is fetched from the Leetify API.

[![Widget Preview](https://i.ibb.co/YnT75YC/badge-preview-anubis.png)](https://levankotolashvili.github.io/cs2-premier-obs-widget/)

### [Open Customizer](https://levankotolashvili.github.io/cs2-premier-obs-widget/)

## Features

- Live Premier rating with rank-colored display (Gray, Light Blue, Blue, Purple, Pink, Red, Gold)
- Rating change from last match
- Stats: AVG kills, K/D ratio, Aim rating
- Recent match history (W/L)
- Customizer UI to configure and generate widget URLs
- Auto-refresh on configurable interval
- Transparent background — works on any stream layout

## Requirements

- **Leetify account** with match tracking enabled — create one at [leetify.com](https://leetify.com) and make sure your profile is connected to Steam. Leetify needs to track your matches for the widget to have up-to-date data. The more frequently Leetify syncs, the faster your rating updates on stream.
- **Steam64 ID** — find yours at [steamid.io](https://steamid.io)

## Setup

### Development

```bash
npm install
npm run dev
```

The customizer runs at `http://localhost:5173/` and the widget at `http://localhost:5173/widget/`.

## Usage

1. Open the customizer
2. Enter your Steam64 ID
3. Toggle display options (avatar, name, rating change, stats, match history)
4. Set the number of recent matches and refresh interval
5. Copy the generated widget URL
6. In OBS, add a **Browser Source** and paste the URL
7. Set width to **520** and height to **120** (adjust as needed)

## Query Parameters

The widget URL supports these parameters:

| Parameter    | Default | Description                  |
| ------------ | ------- | ---------------------------- |
| `steamId`    | —       | Steam64 ID (required)        |
| `avatar`     | `1`     | Show avatar (`0` to hide)    |
| `name`       | `1`     | Show player name             |
| `change`     | `1`     | Show rating change (+/-)     |
| `stats`      | `1`     | Show AVG, K/D, Aim           |
| `history`    | `1`     | Show W/L match history       |
| `matchCount` | `5`     | Number of recent matches     |
| `refresh`    | `60`    | Refresh interval in seconds  |

## Tech Stack

- TypeScript
- Vite (multi-page build)
- Leetify public API
