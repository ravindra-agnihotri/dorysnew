# Dory's Bakes ✦

Artisan patisserie website with admin panel, powered by Node.js + SQLite.

---

## Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
open http://localhost:3000
```

The SQLite database (`dorys_bakes.db`) is created automatically on first run and seeded with sample data.

---

## Pages

| URL | Page |
|---|---|
| `http://localhost:3000` | Public website |
| `http://localhost:3000/about` | Our Story page |
| `http://localhost:3000/admin` | Admin panel |

---

## Deploy to Railway (recommended — free tier)

1. Push this project to a GitHub repository
2. Go to [railway.app](https://railway.app) and sign in
3. Click **New Project → Deploy from GitHub repo**
4. Select your repository
5. Railway detects Node.js automatically — click **Deploy**
6. Your site is live at the Railway URL in ~2 minutes

> **Persistent storage:** In Railway, add a Volume mounted at `/app` and set `DB_PATH=/app/dorys_bakes.db` as an environment variable so the database survives redeploys.

---

## Deploy to Render (alternative)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variable: `DB_PATH=/var/data/dorys_bakes.db`
7. Add a Disk at `/var/data`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `./dorys_bakes.db` | Path to SQLite database file |

---

## Database

The SQLite database is a single file (`dorys_bakes.db`) containing all website data:

- `products` — cake menu items
- `reviews` — customer reviews (with approval moderation)
- `ingredients` — ingredient highlights
- `videos` — studio videos
- `faq` — frequently asked questions
- `media` — uploaded images/videos (stored as base64)
- `orders` — custom cake requests
- `homepage` — all editable website copy and settings

To back up the database, simply copy the `.db` file.

---

## API Reference

All endpoints return JSON. Base path: `/api`

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List all products |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| GET | `/reviews` | List all reviews |
| PUT | `/reviews/:id` | Update review (approve/unapprove) |
| GET | `/faq` | List FAQ items |
| POST | `/faq` | Create FAQ item |
| GET | `/orders` | List all orders |
| POST | `/orders` | Submit new order |
| GET | `/homepage` | Get homepage settings |
| PUT | `/homepage` | Update homepage settings |
| GET | `/media` | List media files |
| POST | `/media` | Upload media (base64) |

---

Made with ✦ by Dory's Bakes
