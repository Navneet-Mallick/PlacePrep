# PlacePrep — Free Deployment Guide

## Architecture

| Layer | Service | Cost |
|---|---|---|
| React Frontend | Vercel | Free forever |
| Django Backend | Render (free tier) | Free (sleeps after 15 min idle) |
| FastAPI ML Service | Render (free tier) | Free (sleeps after 15 min idle) |
| PostgreSQL Database | Supabase | Free forever (500 MB) |

---

## Step 1 — Push to GitHub

All three services are deployed from your GitHub repo. Push everything first.

```bash
git add .
git commit -m "chore: add deployment config"
git push origin main
```

---

## Step 2 — Set up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to `oregon` (to match Render)
3. After creation, go to **Settings → Database**
4. Copy these values — you'll need them for Render:
   - **Host** → `DB_HOST` (looks like `db.xxxx.supabase.co`)
   - **Database name** → `DB_NAME` (usually `postgres`)
   - **User** → `DB_USER` (usually `postgres`)
   - **Password** → `DB_PASSWORD` (the one you set during project creation)
   - **Port** → `5432`

---

## Step 3 — Deploy Django Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `placeprep-backend`
   - **Root Directory**: `.` (repo root)
   - **Runtime**: Python
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Plan**: Free
4. Set **Environment Variables** in the Render dashboard:

| Key | Value |
|---|---|
| `SECRET_KEY` | Click "Generate" (Render auto-generates) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `placeprep-backend.onrender.com` |
| `DB_ENGINE` | `postgresql` |
| `DB_NAME` | (from Supabase) |
| `DB_USER` | (from Supabase) |
| `DB_PASSWORD` | (from Supabase) |
| `DB_HOST` | (from Supabase) |
| `DB_PORT` | `5432` |
| `ML_API_URL` | `https://placeprep-ml.onrender.com/api` *(set after ML deploy)* |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(set after Vercel deploy)* |

5. Click **Create Web Service** — first deploy takes ~5 minutes

> Note the backend URL, e.g. `https://placeprep-backend.onrender.com`

---

## Step 4 — Deploy ML Service on Render

1. **New → Web Service** again (same repo)
2. Configure:
   - **Name**: `placeprep-ml`
   - **Root Directory**: `.` (repo root)
   - **Runtime**: Python
   - **Build Command**: `./ml/build.sh`
   - **Start Command**: `uvicorn ml.api.server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
3. Environment Variables:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key (optional, degrades resume AI if absent) |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(update after Vercel deploy)* |

4. Deploy — first deploy takes ~10 minutes (downloads spaCy model)

> Note the ML URL, e.g. `https://placeprep-ml.onrender.com`

---

## Step 5 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
4. Add **Environment Variables**:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://placeprep-backend.onrender.com/api` |
| `VITE_ML_API_URL` | `https://placeprep-ml.onrender.com/api` |

5. Click **Deploy**

> Note the Vercel URL, e.g. `https://placeprep-xyz.vercel.app`

---

## Step 6 — Wire Everything Together

Go back and update these env vars:

**On Render (placeprep-backend):**
- `ML_API_URL` → `https://placeprep-ml.onrender.com/api`
- `CORS_ALLOWED_ORIGINS` → `https://placeprep-xyz.vercel.app`

**On Render (placeprep-ml):**
- `CORS_ALLOWED_ORIGINS` → `https://placeprep-xyz.vercel.app`

Trigger a manual redeploy on both Render services after updating env vars.

---

## Step 7 — Load Initial Data (Optional)

After the backend deploys, run management commands via Render's Shell:

```bash
# Load aptitude questions
python manage.py load_aptitude_questions

# Load technical questions
python manage.py load_technical_questions
```

Access the Render Shell: **Dashboard → placeprep-backend → Shell**

---

## Local Docker Testing (Before Deploying)

Test the full stack locally with Docker Compose:

```bash
# Copy .env.example and fill in your values
cp .env.example .env

# Build and start all services
docker compose up --build

# Frontend: http://localhost:3000
# Django:   http://localhost:8000
# ML API:   http://localhost:8001
```

---

## Known Limitations of Free Tier

| Issue | Impact | Workaround |
|---|---|---|
| Render services sleep after 15 min idle | First request takes ~30s to wake | Expected on free tier; upgrade to $7/mo for always-on |
| Render free tier: 512 MB RAM | ML service uses lazy loading to stay under limit | First resume/technical analysis request will be slow (~10s) after cold start |
| Supabase free tier: 500 MB storage | Fine for development and demos | Upgrade if you store many resumes |
| Media files (uploaded resumes) stored locally | Lost on Render redeploy (ephemeral filesystem) | Use Supabase Storage or Cloudinary for persistent file storage |

---

## Checking Logs

- **Render**: Dashboard → Service → **Logs** tab
- **Vercel**: Dashboard → Deployment → **Functions** tab

## Custom Domain

Both Vercel and Render support custom domains on free plans. Add your domain
in the respective dashboard and update `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` accordingly.
