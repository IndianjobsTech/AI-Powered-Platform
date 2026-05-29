# Freebuff — Complete Deployment Guide

> **Project:** AI Automation Agency Platform (WhatsApp Business Automation)
> **Generated:** May 29, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [GitHub Repository Setup](#3-github-repository-setup)
4. [Firebase Setup (Authentication)](#4-firebase-setup-authentication)
5. [Railway Deployment (Backend API + PostgreSQL)](#5-railway-deployment-backend-api--postgresql)
6. [Vercel Deployment (Web Frontend)](#6-vercel-deployment-web-frontend)
7. [Expo / EAS Deployment (Mobile App)](#7-expo--eas-deployment-mobile-app)
8. [CI/CD with GitHub Actions](#8-cicd-with-github-actions)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Domain Configuration (Custom Domain)](#10-domain-configuration-custom-domain)
11. [Post-Deployment Checklist](#11-post-deployment-checklist)
12. [URLs Summary](#12-urls-summary)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                           Users                              │
├──────────────┬──────────────────────┬───────────────────────┤
│  Mobile App  │   Web Dashboard      │   WhatsApp            │
│  (Expo/RN)   │   (Next.js 16)       │   (Meta Cloud API)    │
└──────┬───────┴────────┬─────────────┴───────────┬───────────┘
       │                │                         │
       ▼                ▼                         ▼
┌──────────────────────────────────────────────────────────────┐
│                     Firebase Auth                             │
│           (Web SDK ↔ Admin SDK verification)                  │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                Backend API (Express.js)                       │
│              Hosted on Railway (Docker)                       │
├─────────────────┬──────────────────┬─────────────────────────┤
│   OpenAI GPT    │   Razorpay       │   WhatsApp Cloud API    │
│   (AI Replies)  │   (Payments)     │   (Messaging)           │
└────────┬────────┴───────┬──────────┴──────────┬──────────────┘
         │                │                     │
         ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│              PostgreSQL (via Railway)                         │
│              Prisma ORM for data access                       │
└──────────────────────────────────────────────────────────────┘
```

### Platforms Used

| Component   | Platform     | Service                        |
|-------------|-------------|--------------------------------|
| Backend API | Railway      | Node.js + Docker + PostgreSQL  |
| Web App     | Vercel       | Next.js 16 (Static + SSR)      |
| Mobile App  | Expo / EAS   | React Native (Expo SDK 52)     |
| Auth        | Firebase     | Firebase Auth + Admin SDK      |
| Database    | Railway      | PostgreSQL (managed)           |
| CI/CD       | GitHub       | GitHub Actions                 |

---

## 2. Prerequisites

Before starting, create accounts and obtain API keys for the following services:

| Service          | Sign-up URL                          | What You'll Need                            | Approx. Time |
|------------------|--------------------------------------|---------------------------------------------|-------------|
| GitHub           | https://github.com/join              | Repository to push code                     | 5 min       |
| Railway          | https://railway.app/login            | Account + credit card (free tier available) | 5 min       |
| Vercel           | https://vercel.com/signup            | GitHub account for import                   | 2 min       |
| Firebase         | https://console.firebase.google.com  | Google account                              | 10 min      |
| OpenAI           | https://platform.openai.com/signup   | API key for GPT-4o-mini                     | 5 min       |
| Razorpay         | https://razorpay.com/                | Merchant account + API keys                 | 15 min      |
| WhatsApp Meta    | https://developers.facebook.com      | WhatsApp Business API access                | 30+ min     |
| Expo             | https://expo.dev/signup              | Account for EAS Build                       | 5 min       |

---

## 3. GitHub Repository Setup

### Step 1: Initialize Git & Push to GitHub

```bash
# From project root (E:/Freebuff)
git init
git add .
git commit -m "Initial commit: Freebuff AI Automation Platform"

# Create a repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/freebuff.git
git branch -M main
git push -u origin main
```

### Step 2: Configure Repository Secrets

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret Name                      | Description                         |
|----------------------------------|-------------------------------------|
| `NEXT_PUBLIC_API_URL`            | Railway backend URL (set after deploy) |
| (Add production secrets later)   |                                     |

---

## 4. Firebase Setup (Authentication)

Firebase handles authentication for both the web and mobile apps. The backend uses Firebase Admin SDK to verify tokens.

### Web Firebase Configuration

#### 4a. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → Name it `freebuff-aaa`
3. Disable Google Analytics (or enable if desired)
4. Wait for project creation

#### 4b. Enable Email/Password Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

#### 4c. Get Firebase Web SDK Config

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Web** (</> icon)
3. Register app (nickname: `freebuff-web`)
4. Copy the `firebaseConfig` object — you'll need these values:

```
apiKey:            "AIzaSy..."
authDomain:        "freebuff-aaa.firebaseapp.com"
projectId:         "freebuff-aaa"
storageBucket:     "freebuff-aaa.firebasestorage.app"
messagingSenderId: "123456789"
appId:             "1:123456789:web:abc123"
```

#### 4d. Generate Firebase Admin SDK Credentials

1. Go to **Project Settings → Service accounts**
2. Click **Generate new private key**
3. Save the JSON file — you'll extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Mobile Firebase Configuration (Android)

1. In Firebase Console → **Project Settings → General → Your apps**
2. Click **Add app → Android**
3. Package name: `com.freebuff.app`
4. Download `google-services.json` (not needed for Expo — use web config)

### Expected Output After Setup

```
Firebase Project:    freebuff-aaa
Web API Key:         AIzaSy...
Auth Domain:         freebuff-aaa.firebaseapp.com
Project ID:          freebuff-aaa
Admin Private Key:   (stored securely)
```

---

## 5. Railway Deployment (Backend API + PostgreSQL)

Railway hosts the Express.js backend API and managed PostgreSQL database.

### 5a. Install Railway CLI (Optional)

```bash
npm install -g @railway/cli
railway login
```

### 5b. Deploy via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `freebuff` repository
4. Railway auto-detects `railway.json` and `Dockerfile`

### 5c. Add PostgreSQL Database

1. In your Railway project → Click **New** → **Database** → **Add PostgreSQL**
2. Wait for provisioning
3. Click the PostgreSQL service → **Connect** tab
4. Copy the `DATABASE_URL` (looks like: `postgresql://user:pass@host:port/railway`)

### 5d. Add Environment Variables

In Railway → Your backend service → **Variables**, add:

| Variable                     | Value (example)                          | Source                     |
|------------------------------|------------------------------------------|----------------------------|
| `PORT`                       | `5000`                                   | Default                    |
| `NODE_ENV`                   | `production`                             | Static                     |
| `DATABASE_URL`               | `postgresql://...`                       | From Railway PostgreSQL    |
| `FIREBASE_PROJECT_ID`        | `freebuff-aaa`                           | Firebase Console           |
| `FIREBASE_PRIVATE_KEY`       | `-----BEGIN PRIVATE KEY-----\n...`       | Firebase Admin SDK JSON    |
| `FIREBASE_CLIENT_EMAIL`      | `firebase-adminsdk-...@freebuff-aaa.iam.gserviceaccount.com` | Firebase Admin SDK |
| `OPENAI_API_KEY`             | `sk-proj-...`                            | OpenAI Dashboard           |
| `RAZORPAY_KEY_ID`            | `rzp_live_...`                           | Razorpay Dashboard         |
| `RAZORPAY_KEY_SECRET`        | `your_razorpay_secret`                   | Razorpay Dashboard         |
| `WHATSAPP_API_TOKEN`         | `EAAx...`                                | Meta Developers Console    |
| `WHATSAPP_PHONE_NUMBER_ID`   | `123456789`                              | Meta WhatsApp API          |
| `WHATSAPP_VERIFY_TOKEN`      | `freebuff_webhook_123`                   | Your custom token          |
| `JWT_SECRET`                 | `your-random-secret-string`              | Generate via `openssl rand -hex 32` |
| `FRONTEND_URL`               | `https://freebuff.vercel.app`            | Vercel URL (set after)     |
| `SMTP_HOST`                  | `smtp.gmail.com`                         | Your email provider        |
| `SMTP_PORT`                  | `587`                                    | Your email provider        |
| `SMTP_USER`                  | `your@email.com`                         | Your email                 |
| `SMTP_PASS`                  | `your-app-password`                      | Gmail App Password         |

### 5e. Database Migration

After Railway deploys, run Prisma migrations:

```bash
# Option 1: Via Railway CLI
railway run npx prisma db push
railway run npx prisma db seed

# Option 2: Via Railway Dashboard
# Open a Railway shell and run:
npx prisma db push
npx prisma db seed
```

> ℹ️ Railway's health check pings `GET /api/v1/health` automatically every 30 seconds. Ensure your backend returns HTTP 200 at this endpoint (already configured in `src/index.ts`).

### 5f. Verify Backend Deployment

```bash
curl https://your-app.up.railway.app/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Freebuff API is running",
  "timestamp": "2026-05-29T..."
}
```

---

## 6. Vercel Deployment (Web Frontend)

Vercel hosts the Next.js 16 web dashboard.

### 6a. Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import your GitHub repository (`freebuff`)
4. Configure:

| Setting              | Value                                          |
|----------------------|------------------------------------------------|
| Framework Preset     | Next.js                                        |
| Root Directory       | `/` (project root, not `web`)                  |
| Build Command        | `cd web && npm run build`                      |
| Output Directory     | `web/.next`                                    |

> ⚠️ **Important:** Keep Root Directory as `/` (project root) — not `web`. The `vercel.json` already handles `cd web` prefixes.
> If you set Root Directory to `web`, the `cd web` commands in `vercel.json` will fail since you'd already be in `web`.

5. Add Environment Variables:

| Variable                            | Value (example)                          |
|-------------------------------------|------------------------------------------|
| `NEXT_PUBLIC_API_URL`               | `https://your-app.up.railway.app/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      | `AIzaSy...`                              |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  | `freebuff-aaa.firebaseapp.com`           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   | `freebuff-aaa`                           |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `freebuff-aaa.firebasestorage.app`    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789`                    |
| `NEXT_PUBLIC_FIREBASE_APP_ID`       | `1:123456789:web:abc123`                |

### 6b. Custom Domain (Optional)

1. In Vercel → Project → **Settings → Domains**
2. Add your domain (e.g., `app.freebuff.in`)
3. Configure DNS records as instructed by Vercel

### 6c. Set Vercel Environment Variables from `vercel.json`

The `vercel.json` references variables with `@` prefix for Vercel's encrypted environment variables. Add these in the Vercel dashboard:

| Vercel Secret Name                   | Value                              |
|--------------------------------------|------------------------------------|
| `next_public_api_url`                | `https://your-app.up.railway.app/api/v1` |
| `next_public_firebase_api_key`       | `AIzaSy...`                        |
| `next_public_firebase_auth_domain`   | `freebuff-aaa.firebaseapp.com`     |
| `next_public_firebase_project_id`    | `freebuff-aaa`                     |
| `next_public_firebase_storage_bucket`| `freebuff-aaa.firebasestorage.app` |
| `next_public_firebase_messaging_sender_id` | `123456789`                 |
| `next_public_firebase_app_id`        | `1:123456789:web:abc123`           |

### 6d. Verify Web Deployment

Visit `https://freebuff.vercel.app` — you should see the login/signup page.

---

## 7. Expo / EAS Deployment (Mobile App)

> 💡 **Note:** Your mobile app uses **React Native (Expo SDK 52)**, not Flutter. If you intended to use Flutter, the mobile codebase would need to be rewritten from scratch. The instructions below cover Expo/React Native deployment.

The mobile app is built with React Native (Expo SDK 52).

### 7a. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 7b. Configure `app.json` (Already Done)

The `mobile/app.json` is pre-configured with:

```json
{
  "expo": {
    "name": "Freebuff",
    "slug": "freebuff",
    "android": { "package": "com.freebuff.app" },
    "ios": { "bundleIdentifier": "com.freebuff.app" }
  }
}
```

### 7c. Create `eas.json` (Build Profile)

If not present, create `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 7d. Set Expo Environment Variables

Create `mobile/.env` (for local dev) or set in EAS:

```bash
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app/api/v1
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=freebuff-aaa.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=freebuff-aaa
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=freebuff-aaa.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 7e. Build the Mobile App

```bash
cd mobile

# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production

# For iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### 7f. Publish to App Stores

```bash
# Android Play Store
eas submit --platform android

# iOS App Store
eas submit --platform ios
```

### 7g. Alternative: Expo Go (Testing)

For quick testing without building:

```bash
cd mobile
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## 8. CI/CD with GitHub Actions

The `.github/workflows/ci.yml` is pre-configured with three jobs:

| Job     | What it Does                          | Runs On          |
|---------|---------------------------------------|------------------|
| backend | Install deps, generate Prisma, type-check, build | `ubuntu-latest` |
| web     | Install deps, lint, build Next.js     | `ubuntu-latest` |
| mobile  | Install deps, TypeScript type-check   | `ubuntu-latest` |

### How to Enable

1. Push your code to GitHub
2. Go to your repo → **Actions** tab
3. The workflow runs automatically on pushes to `main`/`develop`

### Adding Production Deploy Step (Optional)

To auto-deploy on push to `main`, add to `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy
  needs: [backend, web]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway up --service=backend-api
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

> **Note:** You'll need a Railway token from `railway token generate`.

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/railway

# Firebase Admin SDK
FIREBASE_PROJECT_ID=freebuff-aaa
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@freebuff-aaa.iam.gserviceaccount.com

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_secret

# WhatsApp Cloud API
WHATSAPP_API_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_VERIFY_TOKEN=freebuff_webhook_123
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# JWT (for fallback auth)
JWT_SECRET=your-random-64-char-hex-string
JWT_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_URL=https://freebuff.vercel.app

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

### Web Frontend (`web/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=freebuff-aaa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=freebuff-aaa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=freebuff-aaa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app/api/v1
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=freebuff-aaa.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=freebuff-aaa
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=freebuff-aaa.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 10. Domain Configuration (Custom Domain)

### Recommended Domain Structure

| Subdomain         | Points To                    | Platform |
|-------------------|------------------------------|----------|
| `freebuff.in`     | Vercel (landing/redirect)    | Vercel   |
| `app.freebuff.in` | Vercel (Next.js dashboard)   | Vercel   |
| `api.freebuff.in` | Railway (backend API)        | Railway  |
| `firebase.freebuff.in` | (managed by Firebase)   | Firebase |

### Configure at Your DNS Provider

```dns
# Vercel (Web App)
app.freebuff.in  CNAME  cname.vercel-dns.com

# Railway (Backend API) — Railway provides a CNAME or you can use their proxy
api.freebuff.in  CNAME  your-app.up.railway.app
```

---

## 11. Post-Deployment Checklist

- [ ] **Backend health check**: `GET /api/v1/health` returns 200
- [ ] **Database**: Prisma migrations ran successfully
- [ ] **Firebase Auth**: Can sign up and sign in on web
- [ ] **Firebase Admin**: Backend can verify tokens (check logs)
- [ ] **Web dashboard**: Login page loads at Vercel URL
- [ ] **Mobile app**: Builds and runs on device
- [ ] **CORS**: Backend allows requests from Vercel domain
- [ ] **WhatsApp webhook**: Meta can reach `/whatsapp/webhook`
- [ ] **Razorpay**: Test payment flow works
- [ ] **OpenAI**: AI replies are generated
- [ ] **CI/CD**: GitHub Actions passes on push
- [ ] **SSL**: All URLs use HTTPS

---

## 12. URLs Summary

| Service                 | URL (Example)                                      | Credentials / Notes                                |
|------------------------|----------------------------------------------------|---------------------------------------------------|
| **Backend API**        | `https://freebuff-api.up.railway.app`              | Railway auto-generated URL                        |
| **Health Check**       | `https://freebuff-api.up.railway.app/api/v1/health` | Verify deployment — should return 200 OK          |
| **WhatsApp Webhook**   | `https://freebuff-api.up.railway.app/api/v1/whatsapp/webhook` | Set this URL in Meta Developers Console    |
| **Web Dashboard**      | `https://freebuff.vercel.app`                      | Vercel auto-generated URL                         |
| **Mobile (Expo Go)**   | `exp://192.168.x.x:8081`                           | Local dev only (QR code from `npx expo start`)    |
| **Mobile (Google Play)** | `https://play.google.com/store/apps/details?id=com.freebuff.app` | After EAS submit                    |
| **Mobile (App Store)**  | `https://apps.apple.com/app/freebuff`             | After EAS submit (requires Apple Developer account) |
| **Firebase Console**   | `https://console.firebase.google.com/project/freebuff-aaa` | Google account login                         |
| **Railway Dashboard**  | `https://railway.app/dashboard`                    | Railway account login                             |
| **Vercel Dashboard**   | `https://vercel.com/dashboard`                     | Vercel / GitHub account login                     |
| **GitHub Repo**        | `https://github.com/YOUR_USERNAME/freebuff`        | Your GitHub credentials                           |
| **OpenAI Dashboard**   | `https://platform.openai.com/api-keys`             | OpenAI account login                              |
| **Razorpay Dashboard** | `https://dashboard.razorpay.com`                   | Razorpay merchant account                         |
| **Meta Developers**    | `https://developers.facebook.com/apps`             | Facebook/Meta account — configure webhook here    |

### Default Test Credentials (After Running Seed Script)

After deployment and database migration, run the seed script to create demo users:

```bash
# Via Railway shell or CLI:
railway run npx prisma db seed
```

This creates test accounts (check `backend/prisma/seed.ts` for exact credentials). Defaults:

| Role        | Email                         | Password (set in seed) |
|-------------|-------------------------------|------------------------|
| Admin       | `admin@freebuff.in`           | Check `seed.ts`        |
| Demo User   | `demo@freebuff.in`            | Check `seed.ts`        |

> ⚠️ **Note:** After seeding, go to Firebase Console → Authentication and manually verify/create these users if needed. Change passwords in production.

---

## Quick-Start Command Summary

```bash
# === 1. PUSH TO GITHUB ===
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/freebuff.git
git push -u origin main

# === 2. DEPLOY BACKEND (Railway) ===
# Do via Railway Dashboard: New Project → Deploy from GitHub

# === 3. RUN MIGRATIONS ===
# In Railway shell:
npx prisma db push
npx prisma db seed

# === 4. DEPLOY FRONTEND (Vercel) ===
# Do via Vercel Dashboard: Add New → Import GitHub Repo

# === 5. BUILD MOBILE (Optional) ===
cd mobile
eas build --platform android --profile production

# === 6. VERIFY ===
curl https://YOUR-RAILWAY-URL.up.railway.app/api/v1/health
# Open https://YOUR-VERCEL-URL.vercel.app in browser
```

---

> **Document Version:** 1.0  
> **Last Updated:** May 29, 2026  
> **Project:** Freebuff — AI Automation Agency Platform
