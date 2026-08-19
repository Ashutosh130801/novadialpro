# Deployment Guide for NovaDial Pro

This guide covers deploying NovaDial Pro to various free cloud platforms.

## Table of Contents

1. [Railway (Recommended)](#railway-recommended)
2. [Render](#render)
3. [Vercel (Web Client Only)](#vercel-web-client-only)
4. [Local Development with Docker](#local-development-with-docker)

---

## Railway (Recommended)

**Pros:**
- ✅ Easiest setup
- ✅ $5/month free credits
- ✅ PostgreSQL + Redis included
- ✅ Automatic GitHub deployments
- ✅ Great for Node.js monorepos

### Step 1: Connect GitHub

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect `Ashutosh130801/novadialpro`

### Step 2: Configure Project

Railway will automatically detect `railway.json`. You need to:

1. **Add PostgreSQL:**
   - Click "+ Add Service"
   - Select "PostgreSQL"
   - Railway creates `DATABASE_URL` automatically

2. **Add Redis:**
   - Click "+ Add Service"
   - Select "Redis"
   - Railway creates `REDIS_URL` automatically

3. **Set Environment Variables:**
   In Railway dashboard, go to Variables tab and add:
   ```
   NODE_ENV=production
   PORT=3001
   LOG_LEVEL=info
   JWT_SECRET=<generate-a-random-secret>
   CORS_ORIGIN=https://yourdomain.com
   ```

### Step 3: Deploy

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push origin main
   ```

2. Railway auto-deploys on push

3. Check logs in Railway dashboard

### Step 4: Verify Deployment

```bash
curl https://your-railway-domain.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-08-19T10:30:00.000Z"
}
```

---

## Render

**Pros:**
- ✅ Free tier
- ✅ PostgreSQL + Redis included
- ✅ Automatic GitHub deploys

**Cons:**
- Auto-pauses after 15 mins inactivity (free tier)

### Step 1: Connect GitHub

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect `Ashutosh130801/novadialpro`

### Step 2: Configure

**Build & Start:**
- Root Directory: `novadial-pro`
- Build Command: `npm install && npm run build --workspace=server`
- Start Command: `npm run start --workspace=server`
- Node Version: `18`

**Environment Variables:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate-random>
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Step 3: Add PostgreSQL

1. Click "New +" → "PostgreSQL"
2. Name: `novadial-postgres`
3. Render auto-creates `DATABASE_URL`

### Step 4: Add Redis

1. Click "New +" → "Redis"
2. Name: `novadial-redis`
3. Render auto-creates `REDIS_URL`

### Step 5: Link Services

In Web Service, go to Environment and link:
- `DATABASE_URL` → PostgreSQL
- `REDIS_URL` → Redis

---

## Vercel (Web Client Only)

Use Vercel for the **web frontend** and Vercel/Railway for the backend API.

### Deploy Web Client to Vercel

1. Create `novadial-pro/client/web/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "REACT_APP_API_URL": "https://your-api-url.railway.app"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-api-url.railway.app/api/:path*"
    }
  ]
}
```

2. Deploy:
```bash
npm i -g vercel
cd novadial-pro/client/web
vercel --prod
```

---

## Local Development with Docker

### Prerequisites

- Docker
- Docker Compose

### Run Locally

```bash
cd novadial-pro

# Start all services
docker-compose up

# In another terminal, apply migrations
docker-compose exec server npm run db:migrate

# Access the app
# Server: http://localhost:3001
# Health: http://localhost:3001/health
```

### Stop Services

```bash
docker-compose down
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

---

## Environment Variables Reference

### Required
- `NODE_ENV`: `production` or `development`
- `PORT`: `3001`
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Random string (generate with `openssl rand -hex 32`)

### Optional
- `LOG_LEVEL`: `info`, `debug`, `error`, `warn`
- `CORS_ORIGIN`: Frontend URL (e.g., `https://app.novadial.com`)
- `SIP_DOMAIN`: SIP server domain
- `DINSTAR_HOST`: Dinstar gateway IP/hostname
- `TWILIO_*`: Twilio credentials (if using Twilio)
- `SMTP_*`: Email configuration

---

## Troubleshooting

### Build Fails with "ENOENT: package.json"

**Solution:** Ensure root directory is set to `novadial-pro` in deployment settings.

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

### Database connection fails

1. Check `DATABASE_URL` format:
   ```
   postgresql://username:password@host:5432/dbname
   ```

2. Verify database is running:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate --workspace=server
   ```

### Health check returns 500

1. Check server logs
2. Verify database connectivity
3. Check environment variables are set
4. Ensure required route files exist

### Port already in use

```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

---

## Next Steps

1. **Setup CI/CD:** Add GitHub Actions workflow for automated tests
2. **Add Monitoring:** Use Sentry for error tracking
3. **Setup Logging:** Configure Winston for centralized logging
4. **Add CDN:** Use Cloudflare for performance
5. **SSL Certificates:** Railway/Render handle this automatically
6. **Backups:** Enable database backups in production settings

---

## Support

For issues, check:
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- Repository Issues: https://github.com/Ashutosh130801/novadialpro/issues
