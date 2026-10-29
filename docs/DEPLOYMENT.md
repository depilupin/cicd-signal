# 🚀 Signal Deployment Guide — Render + Hostinger

This guide covers deploying the **Signal CI/CD Vulnerability Scanner** monorepo:

| Component | Platform | Service Type |
|:---|:---|:---|
| **API** (`apps/api`) | Render | Web Service (Node.js) |
| **Worker** (`apps/worker`) | Render | Background Worker |
| **Database** (PostgreSQL) | Render | Managed Database |
| **Redis** (BullMQ) | Render | Managed Redis |
| **Frontend** (`apps/web`) | Hostinger | Static Website |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Hostinger                         │
│   ┌─────────────────────────────────────────────┐   │
│   │  Static React SPA (Vite build output)       │   │
│   │  threadsecurity.in / your-domain.com        │   │
│   └──────────────────┬──────────────────────────┘   │
└──────────────────────┼──────────────────────────────┘
                       │ HTTPS API calls
                       ▼
┌─────────────────────────────────────────────────────┐
│                     Render                          │
│   ┌──────────────┐  ┌──────────┐  ┌─────────────┐  │
│   │  signal-api   │  │  Redis   │  │ PostgreSQL  │  │
│   │  (Express)    │◄►│ (BullMQ) │  │ (Prisma)    │  │
│   └──────────────┘  └────┬─────┘  └──────┬──────┘  │
│                          │               │          │
│   ┌──────────────┐       │               │          │
│   │ signal-worker │◄─────┘───────────────┘          │
│   │ (Scanner)     │                                 │
│   └──────────────┘                                  │
└─────────────────────────────────────────────────────┘
```

---

## Part 1: Render Deployment (Backend)

### Option A: Blueprint (Recommended — One-Click)

1. Push this repo to GitHub/GitLab
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your repo — Render auto-detects [`render.yaml`](../render.yaml)
4. Fill in the `sync: false` env vars (secrets that can't be in YAML):
   - `FRONTEND_URL` → your Hostinger domain (e.g. `https://threadsecurity.in`)
   - `API_BASE_URL` → Render gives you this after deploy (e.g. `https://signal-api.onrender.com`)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - GitHub App credentials (when ready)
5. Click **Apply** — Render provisions DB, Redis, API, and Worker

### Option B: Manual Setup

#### 1. Create PostgreSQL Database
- Render Dashboard → **New** → **PostgreSQL**
- Name: `signal-db`, Plan: Free (or Starter for production)
- Copy the **Internal Connection String**

#### 2. Create Redis Instance
- **New** → **Redis**
- Name: `signal-redis`, Plan: Free
- Copy the **Internal Connection String**

#### 3. Deploy API Service
- **New** → **Web Service** → Connect your repo
- **Build Command:**
  ```bash
  npm install && npm run build:api
  ```
- **Start Command:**
  ```bash
  npm run start:api
  ```
- **Environment Variables:** Add all from the table below
- **Health Check Path:** `/health`

#### 4. Deploy Worker Service
- **New** → **Background Worker** → Connect your repo
- **Build Command:**
  ```bash
  npm install && npm run build:worker
  ```
- **Start Command:**
  ```bash
  npm run start:worker
  ```
- **Environment Variables:** Add `DATABASE_URL`, `REDIS_URL`, worker-specific vars

#### 5. Run Database Migrations
After the first deploy, open the API service **Shell** tab and run:
```bash
npm run db:push
```
Or if using Prisma migrations:
```bash
npm run db:migrate:deploy
```

### Environment Variables (Render)

| Variable | Where to Get It | Required |
|:---|:---|:---|
| `DATABASE_URL` | Auto-injected from Render PostgreSQL | ✅ |
| `REDIS_URL` | Auto-injected from Render Redis | ✅ |
| `NODE_ENV` | Set to `production` | ✅ |
| `PORT` | Render sets this automatically (default 10000) | ✅ |
| `FRONTEND_URL` | Your Hostinger domain | ✅ |
| `API_BASE_URL` | Your Render service URL | ✅ |
| `SESSION_SECRET` | Generate a 32+ char random string | ✅ |
| `COOKIE_SECRET` | Generate a 32+ char random string | ✅ |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | For OAuth |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | For OAuth |
| `GOOGLE_CALLBACK_URL` | `https://<api-url>/api/v1/auth/google/callback` | For OAuth |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | For Billing |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | For Billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | For Billing |
| `RESEND_API_KEY` | Resend Dashboard | For Email |

> **⚠️ Important:** After deploying on Render, update `GOOGLE_CALLBACK_URL` to use your Render API URL instead of `localhost`.

---

## Part 2: Hostinger Deployment (Frontend)

### Step 1: Build the Frontend Locally

```bash
# Set the production API URL before building
# Option A: Create apps/web/.env.production
echo "VITE_API_URL=https://signal-api.onrender.com" > apps/web/.env.production

# Option B: Or pass it inline
VITE_API_URL=https://signal-api.onrender.com npm run deploy:hostinger
```

On Windows (PowerShell):
```powershell
# Create the production env file
Set-Content -Path "apps\web\.env.production" -Value "VITE_API_URL=https://signal-api.onrender.com"

# Build
npm run deploy:hostinger
```

This generates the production bundle in `apps/web/dist/`.

### Step 2: Upload to Hostinger

#### Method A: Hostinger File Manager (Easiest)
1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **File Manager** → Navigate to `public_html`
3. **Delete** existing contents (keep `.htaccess` if Hostinger created one)
4. **Upload** the entire contents of `apps/web/dist/`:
   - All files and folders inside `dist/` go directly into `public_html/`
   - Also upload the `.htaccess` file from `apps/web/.htaccess`
5. Your file structure should look like:
   ```
   public_html/
   ├── .htaccess          ← SPA routing + caching + security
   ├── index.html         ← Vite entry point
   ├── favicon.svg
   └── assets/
       ├── index-[hash].js
       ├── index-[hash].css
       └── vendor-[hash].js
   ```

#### Method B: Hostinger Git Deployment
1. In hPanel → **Advanced** → **Git**
2. Connect your repository
3. Set the **deployment branch** and **public directory** to `apps/web/dist`
4. You'll need to build locally and commit the `dist/` folder, OR set up a GitHub Action (see below)

#### Method C: FTP/SFTP Upload
1. In hPanel → **Files** → **FTP Accounts** — get your FTP credentials
2. Use FileZilla or any FTP client:
   - Host: `ftp.yourdomain.com`
   - Upload `apps/web/dist/*` → `/public_html/`
   - Upload `apps/web/.htaccess` → `/public_html/.htaccess`

### Step 3: Configure Domain & SSL
1. In hPanel → **Domains** → Point your domain to Hostinger nameservers
2. **SSL** → Enable **Free SSL** (Let's Encrypt) — Hostinger does this automatically
3. **Force HTTPS** → Enable in hPanel (our `.htaccess` also handles this)

### Step 4: Verify CORS
Make sure your Render API's `FRONTEND_URL` env var matches your Hostinger domain exactly:
```
FRONTEND_URL=https://threadsecurity.in
```

---

## Part 3: GitHub Actions CI/CD (Optional Automation)

Create `.github/workflows/deploy.yml` to automate deployments:

```yaml
name: Deploy Signal

on:
  push:
    branches: [main]

jobs:
  # --- Deploy Backend to Render (auto via webhook) ---
  # Render automatically deploys on push if connected to your repo.
  # No action needed here — just connect the repo in Render Dashboard.

  # --- Build & Deploy Frontend to Hostinger ---
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Build frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run deploy:hostinger

      - name: Deploy to Hostinger via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASS }}
          local-dir: ./apps/web/dist/
          server-dir: /public_html/
```

**GitHub Secrets to set:**
| Secret | Value |
|:---|:---|
| `VITE_API_URL` | `https://signal-api.onrender.com` |
| `HOSTINGER_FTP_HOST` | Your Hostinger FTP hostname |
| `HOSTINGER_FTP_USER` | Your Hostinger FTP username |
| `HOSTINGER_FTP_PASS` | Your Hostinger FTP password |

---

## Post-Deployment Checklist

- [ ] Render API returns `200` on `/health`
- [ ] Frontend loads on Hostinger domain
- [ ] SPA routing works (navigate to a deep URL, refresh — should NOT 404)
- [ ] API CORS allows requests from Hostinger domain
- [ ] Google OAuth callback URL updated to Render API URL
- [ ] Stripe webhook endpoint updated to Render API URL
- [ ] SSL/HTTPS working on both frontend and API
- [ ] Database migrations applied (`npm run db:push`)
- [ ] Worker service running and consuming Redis queue

---

## Troubleshooting

| Issue | Solution |
|:---|:---|
| **CORS errors** | Ensure `FRONTEND_URL` in Render matches your Hostinger domain exactly (including `https://`) |
| **404 on page refresh** | `.htaccess` not uploaded or `mod_rewrite` not enabled on Hostinger |
| **API unreachable** | Check Render service logs; ensure `PORT` env var is set |
| **Database connection fails** | Verify `DATABASE_URL` includes `?sslmode=require` for Render PostgreSQL |
| **Prisma client error** | Run `npx prisma generate` in Render shell |
| **Build fails on Render** | Ensure `Node.js` version is set to 22 in environment variables |
| **Worker not processing jobs** | Check Redis connection and `REDIS_URL` env var |
| **Google OAuth redirect mismatch** | Update `GOOGLE_CALLBACK_URL` to `https://<render-api>/api/v1/auth/google/callback` |

