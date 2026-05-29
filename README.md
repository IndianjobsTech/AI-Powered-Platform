# Freebuff - AI Automation for Your Business

A multi-platform SaaS application that automates WhatsApp customer support, appointment booking, lead generation, and business communications using AI.

## Architecture

```
freebuff/
├── web/          # Next.js 16 web application (Dashboard)
├── mobile/       # React Native (Expo) mobile app
└── backend/      # Express.js API server
```

## Tech Stack

### Backend
- **Runtime:** Node.js, Express 5
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Firebase Admin SDK
- **AI:** OpenAI GPT-4o-mini
- **Payments:** Razorpay
- **Messaging:** WhatsApp Cloud API
- **Deployment:** Docker, Railway

### Web Frontend
- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS 4, shadcn/ui components
- **State:** React Context + hooks
- **Auth:** Firebase Client SDK
- **Charts:** Recharts

### Mobile
- **Framework:** React Native (Expo SDK 52)
- **Navigation:** React Navigation
- **Charts:** react-native-chart-kit

## Features

- 🤖 **AI Auto-Reply** - Intelligent WhatsApp message responses
- 👥 **Lead Management** - Capture, score, and track leads
- 📅 **Appointments** - Schedule and manage bookings
- 📊 **Analytics** - Business performance metrics
- 💳 **Billing** - Subscription plans (Starter/Growth/Enterprise)
- 🔧 **Settings** - Custom AI configuration, FAQs, WhatsApp integration

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- Firebase project (with Auth enabled)
- OpenAI API key
- WhatsApp Business API access
- Razorpay account

### Setup

```bash
# 1. Install all dependencies
npm run setup

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env

# 3. Configure .env files with your credentials

# 4. Initialize database
npm run db:push

# 5. Start development
npm run dev
```

## Environment Variables

See `.env.example` files in each directory:
- `backend/.env.example`
- `web/.env.example`
- `mobile/.env.example`

## Deployment

### Backend (Railway/Docker)
```bash
cd backend
docker build -t freebuff-api .
```

### Web (Vercel)
The `vercel.json` at root handles web deployment configuration.

## API Documentation

Base URL: `/api/v1`

### Health Check
```
GET /api/v1/health
```

### Key Endpoints
- `POST /businesses` - Create business
- `GET /businesses` - List businesses
- `POST /businesses/:id/whatsapp/send` - Send WhatsApp message
- `GET /businesses/:id/leads` - List leads
- `GET /businesses/:id/analytics/dashboard` - Dashboard stats
- `POST /businesses/:id/subscription` - Create subscription

Full API docs available at `/api/v1/health` endpoint.

## License

ISC
