# FootIQ — Deployment Guide

FootIQ deploys as two services:

- **Backend** (FastAPI + RAG) → **Render**
- **Frontend** (React + Vite) → **Vercel**

Deploy the backend first, then point the frontend at it.

---

## 1. Backend → Render

### 1.1 Create the service

1. Push this repo to GitHub (already done if you're reading this in the repo).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect your GitHub repo and select it.
4. Render auto-detects `footiq-backend/render.yaml`. If it doesn't, set manually:
   - **Root Directory:** `footiq-backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free

### 1.2 Set environment variables (the secrets)

In the Render service → **Environment** tab, add:

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_API_KEY` | *your real key* | Encrypted at rest. **Never** commit this. |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Your Vercel URL (set after step 2). Comma-separate multiple. |
| `CHROMA_PATH` | `./chroma_db` | Default is fine. |
| `DATA_DIR` | `./data` | Default is fine. |

> `render.yaml` declares these with `sync: false`, which means "I set the value
> in the dashboard, not in git." That is exactly what you want for secrets.

### 1.3 Deploy & verify

1. Click **Create Web Service**. First build takes ~5–10 min (installs ML deps).
2. When live, open `https://your-backend.onrender.com/health` — you should see:
   ```json
   { "status": "ok", "chroma_connected": true, "vector_count": 0, "collections": [] }
   ```
3. Copy the backend URL — you need it for the frontend.

> **Free-tier notes**
> - The service **sleeps after 15 min idle**; the first request after sleep takes ~30–50s to wake. This is normal on Render free.
> - **No persistent disk on free tier** → ChromaDB resets on every deploy/restart. You'll re-upload match JSON after a restart. For permanent storage, either uncomment the `disk:` block in `render.yaml` (Render paid, ~$0.25/GB-mo) or switch to Qdrant Cloud free tier (see below).
> - The **video/CV feature (YOLOv8 + PyTorch) will NOT run on 512MB** — it needs ~1–2GB RAM. The app boots fine because those imports are lazy, but processing a video on free tier will fail/OOM. Use a paid instance (≥2GB) if you need video.

---

## 2. Frontend → Vercel

### 2.1 Create the project

1. Go to [vercel.com/new](https://vercel.com/new) → import your GitHub repo.
2. Set:
   - **Root Directory:** `footiq-frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `dist` (auto)

### 2.2 Set the API base URL

In Vercel → **Settings** → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE` | `https://your-backend.onrender.com` |

> Vite inlines `VITE_*` vars **at build time**, so you must **redeploy** the
> frontend after changing this value.

### 2.3 Deploy

1. Click **Deploy**. Build takes ~1 min.
2. `vercel.json` already adds the SPA rewrite rule, so direct links to
   `/dashboard`, `/coach`, etc. won't 404 on refresh.

---

## 3. Connect the two (CORS)

After Vercel gives you a URL (e.g. `https://footiq.vercel.app`):

1. Go back to **Render → Environment** and set `ALLOWED_ORIGINS` to that exact URL.
2. Render redeploys automatically. Done.

If the frontend shows CORS errors in the browser console, `ALLOWED_ORIGINS`
doesn't match the Vercel origin exactly (check `https://` vs trailing slash).

---

## 4. Smoke test (end to end)

1. Open your Vercel URL → landing page loads.
2. **Launch App** → `/dashboard`.
3. Enter a `match_id`, upload a StatsBomb JSON → "indexed successfully".
4. Ask a question in the Q&A panel → Gemini answers from your match data.
5. **Settings** page → health check shows `chroma_connected: true` and a
   non-zero `vector_count`.

---

## 5. Optional: persistent vectors on free tier (Qdrant Cloud)

Render free tier loses ChromaDB data on restart. To get free, persistent vector
storage:

1. Create a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io) (no card).
2. In `footiq-backend/requirements.txt`, replace `chromadb` with `qdrant-client`.
3. Swap the vector store in `app/services/embedder.py` to LangChain's `Qdrant`.
4. Add `QDRANT_URL` and `QDRANT_API_KEY` to Render env vars.

Ask and I'll wire this up — it's a ~30 min change.

---

## Quick reference

| | Backend (Render) | Frontend (Vercel) |
|---|---|---|
| Root dir | `footiq-backend` | `footiq-frontend` |
| Config file | `render.yaml`, `Procfile` | `vercel.json` |
| Required env | `GEMINI_API_KEY`, `ALLOWED_ORIGINS` | `VITE_API_BASE` |
| Health check | `GET /health` | `/settings` page |
