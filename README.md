# Bismuth

Monorepo for the Bismuth Discord bot.

| Folder | What it is | Run |
|--------|-----------|-----|
| `api/` | Backend API (Python) | `cd api && python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python main.py` |
| `bot/` | Discord bot (discord.py) | `cd bot && python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python bot.py` |
| `site/` | Dashboard website (Vite + React) | `cd site && npm install && npm run dev` |

Each folder needs its own `.env` (not committed, except the site's public Vite vars).
