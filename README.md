# RENTINGIT — Peer-to-Peer Rental Marketplace for India

> India's first true P2P rental marketplace. Rent anything from verified neighbours near you — cameras, drills, PlayStations, camping gear, designer wear — at 1/10th the buy price. UPI payments, KYC-verified owners, escrow-held security deposits, real-time in-app chat.

Think **Fat Llama × Airbnb for stuff**, built for India with UPI + Aadhaar-style KYC + escrow deposits.

---

## What's new in v2 (production-ready)

This is no longer a demo. v2 ships:

- ✅ **Real image uploads** via Cloudinary (item photos + KYC documents)
- ✅ **DIY KYC verification flow** — user uploads ID + selfie, admin reviews in dashboard (this is what real Indian startups do pre-DigiLocker)
- ✅ **Real-time in-app chat** between owner & renter (Socket.io WebSocket mini-service)
- ✅ **Email notifications** on booking events via Resend (booking approved, paid, completed, disputes)
- ✅ **Premium Airbnb-clean UI** — coral accent (#FF385C), soft shadows, big imagery, rounded-2xl cards
- ✅ **Production-ready schema** — 9 models, including KycDocument, Conversation, ChatMessage
- ✅ **Deployment guide** for Vercel + Neon Postgres + Railway (for chat service)

Still mock (swap to real when you register a business):
- ⚠️ Razorpay payments (mock UPI flow — real SDK swap is a 5-line change)
- ⚠️ Live KYC (DIY upload — for real DigiLocker/Aadhaar API you need DPIIT-approved entity)

---

## Features (12 modules)

### Core user flows
1. **Auth + KYC** — NextAuth credentials login, one-click demo accounts, **real KYC verification** (upload ID + selfie → admin approves)
2. **Item Listings** — Real Cloudinary photo uploads, 12 categories, daily rent + refundable deposit, location, availability calendar
3. **Search & Discovery** — Filter by category, city, max rent; sort by newest/price/rating; live search
4. **Booking Flow** — Pick dates → price calculator (rent + deposit + 10% platform fee + optional insurance) → mock Razorpay UPI payment → status tracking
5. **Security Deposit Escrow** — Deposit held at booking, auto-refunded when owner confirms return
6. **Real-time Chat** — Socket.io WebSocket chat between owner & renter (active once booking approved), typing indicators, online status
7. **Reviews & Trust Score** — Both-side star ratings + comments after completion, weighted trust score updates
8. **Dispute Resolution** — Either side can raise a dispute with reason + description; admin resolves with deposit split (0/50/100% to owner)
9. **Wallet & Payouts** — Owner earnings land in wallet, withdrawable to UPI; full transaction history
10. **Email Notifications** — Resend integration: booking requested/approved/paid/completed/disputed → email the right party
11. **Admin Dashboard** — KPIs (users, items, GMV, platform revenue), Recharts visualizations, top items, recent bookings, **KYC review queue**, disputes queue
12. **Premium UI** — Airbnb-clean design: coral (#FF385C) accent, soft shadows, big imagery, rounded-2xl cards, dark mode, mobile-first

### Roles
- **Owner** — lists items (KYC required), approves/declines requests, confirms returns, earns money, chats with renters
- **Renter** — searches, books, pays (UPI), picks up, returns, reviews, chats with owners
- **Admin** — verifies KYC submissions, resolves disputes, sees platform analytics

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Framer Motion |
| State | Zustand (client nav state), TanStack Query (server state) |
| Auth | NextAuth.js v4 (JWT sessions, credentials provider) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod via Neon) |
| Real-time | Socket.io mini-service on port 3003 (deploy to Railway for prod) |
| Image Storage | Cloudinary (free tier, 25 GB) |
| Email | Resend (free tier, 3,000/month) |
| Charts | Recharts |
| Payments | Mock Razorpay UPI flow (drop-in ready for real Razorpay SDK) |

---

## Database schema (9 models)

```
User              — id, email, name, phone, passwordHash, role, kycStatus, trustScore, walletBalance
Item              — id, ownerId, title, category, description, images[], dailyRent, securityDeposit, city, area, condition
Booking           — id, itemId, renterId, startDate, endDate, totals, status (state machine), timestamps
Payment           — id, bookingId, userId, amount, type (RENT/DEPOSIT/INSURANCE/REFUND), razorpayId, status
Review            — id, bookingId, reviewerId, revieweeId, rating, comment, type (OWNER_TO_RENTER / RENTER_TO_OWNER)
WalletTransaction — id, userId, type (CREDIT/DEBIT), amount, reference, balanceAfter
Dispute           — id, bookingId, raisedById, reason, description, evidencePhotos[], status, resolutionNotes
KycDocument       — id, userId, docType, docNumber, docImageUrl, selfieImageUrl, status, reviewedBy, reviewedAt
Conversation      — id, bookingId (unique), ownerId, renterId, itemId
ChatMessage       — id, conversationId, senderId, message, createdAt
```

**Booking state machine:** `REQUESTED → APPROVED → PAID → PICKED_UP → RETURNED → COMPLETED` (with `DISPUTED` and `CANCELLED` as side-states). All transitions are transactional and role-guarded.

---

## Quick start (local dev)

```bash
# 1. Install deps
bun install
cd mini-services/chat-service && bun install && cd ../..

# 2. Set up env vars (see .env.example below)
cp .env.example .env
# Edit .env with your Cloudinary + Resend keys (or leave blank for dev mode)

# 3. Set up the database
bun run db:push           # create schema
bun run scripts/seed.ts   # seed 7 users + 19 items + sample bookings/reviews/KYC/chat

# 4. Start the chat WebSocket service (in a separate terminal)
cd mini-services/chat-service && bun run dev
# Should print: [rentingit-chat] WebSocket service listening on port 3003

# 5. Run the Next.js dev server (in another terminal)
bun run dev               # http://localhost:3000
```

### `.env.example`

```bash
# Database (use SQLite for dev, Postgres for prod)
DATABASE_URL=file:./db/custom.db

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here-32-chars
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (free tier — https://cloudinary.com)
# Create account → Settings → Upload presets → create unsigned preset named "rentingit_unsigned"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=rentingit_unsigned
# Server-side (optional, for signed uploads / admin API)
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Resend (free tier — https://resend.com — 3,000 emails/month free)
# Leave blank to skip real emails (dev mode logs to console)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=RENTINGIT <noreply@yourdomain.com>

# Chat service URL (for production — Railway URL)
CHAT_SERVICE_URL=http://localhost:3003
```

---

## Demo accounts (one-click on the auth modal)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rentingit.in` | `admin123` |
| Owner (Bengaluru) | `rohan@gmail.com` | `demo123` |
| Owner (Bengaluru) | `priya@gmail.com` | `demo123` |
| Renter + Owner (Delhi) | `vikram@gmail.com` | `demo123` |
| KYC pending review | `sneha@gmail.com` | `demo123` |
| New user, KYC pending | `kabir@gmail.com` | `demo123` |

---

## Production deployment guide

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Neon           │     │   Railway       │
│   (Next.js)     │────▶│   (PostgreSQL)   │     │   (Chat service)│
│                 │     │                  │     │                 │
│   Main app + API│     │   Database       │     │   Socket.io     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                │
         └──────────── /?XTransformPort=3003 ────────────┘
                       (WebSocket via gateway)
```

### Step 1 — Set up Neon Postgres (free)

1. Go to [neon.tech](https://neon.tech) → sign up with GitHub
2. Create a new project → copy the connection string
3. It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

### Step 2 — Set up Cloudinary (free)

1. Go to [cloudinary.com](https://cloudinary.com) → sign up
2. Dashboard → copy your **Cloud Name**
3. Settings → Upload → Upload presets → **Add upload preset**
   - Name: `rentingit_unsigned`
   - Signing mode: **Unsigned**
   - Folder: `rentingit`

### Step 3 — Set up Resend (free, optional)

1. Go to [resend.com](https://resend.com) → sign up
2. API Keys → Create → copy `re_xxxxx`
3. (Optional) Verify your domain to send from `noreply@yourdomain.com`
   - Without verification, you can only send to your own email (good for testing)

### Step 4 — Deploy chat service to Railway (free tier)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Set **Root Directory** to `mini-services/chat-service`
4. Railway auto-detects Bun → set start command to `bun run index.ts`
5. Add a custom domain (or use Railway's URL like `rentingit-chat.up.railway.app`)
6. Note the URL — you'll need it for the frontend

### Step 5 — Deploy Next.js to Vercel

1. Push to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. **Framework preset:** Next.js (auto-detected)
4. **Environment variables** — add all from `.env.example`:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...` (from Neon, **with `?sslmode=require`**) |
| `NEXTAUTH_SECRET` | generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | your cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `rentingit_unsigned` |
| `CLOUDINARY_API_KEY` | your API key |
| `CLOUDINARY_API_SECRET` | your API secret |
| `RESEND_API_KEY` | `re_xxxxx` (optional) |
| `RESEND_FROM_EMAIL` | `RENTINGIT <noreply@yourdomain.com>` (optional) |
| `CHAT_SERVICE_URL` | `https://your-chat.up.railway.app` (Railway URL) |

5. Deploy → Vercel gives you `https://your-project.vercel.app`

### Step 6 — Switch Prisma to Postgres

In `prisma/schema.prisma`, change:

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```

Then push the schema to your Neon database:

```bash
# Set DATABASE_URL to your Neon connection string in .env
bun run db:push           # creates all 9 tables in Postgres
bun run scripts/seed.ts   # seeds demo data
```

### Step 7 — Custom domain (optional)

1. Buy a domain (e.g., `rentingit.in` from GoDaddy/Namecheap)
2. In Vercel → Project → Settings → Domains → Add → enter `rentingit.in`
3. Vercel gives you DNS records to add:
   - `A` record → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
4. Add these records in your domain registrar's DNS panel
5. Wait 5-30 mins for DNS to propagate
6. Update `NEXTAUTH_URL` env var to `https://rentingit.in`

### Step 8 — Update WebSocket URL for production

In `src/components/rentingit/chat-panel.tsx`, the WebSocket connection uses:

```typescript
const socket = io("/?XTransformPort=3003", { transports: ["websocket", "polling"] });
```

For production (where the chat service is on Railway, not localhost), update this to use the Railway URL:

```typescript
const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL || "/?XTransformPort=3003";
const socket = io(CHAT_URL, { transports: ["websocket", "polling"] });
```

And add `NEXT_PUBLIC_CHAT_URL=https://your-chat.up.railway.app` to Vercel env vars.

---

## Going live with real payments (when you register a business)

The mock Razorpay flow is in `src/components/rentingit/booking-flow-modal.tsx`. To swap to real Razorpay:

1. Register a business (Sole Proprietor / LLP / Pvt Ltd)
2. Get GST registration
3. Open a current account in the business name
4. Sign up at [razorpay.com](https://razorpay.com) → complete KYC with business docs
5. Get **Key ID** + **Key Secret** from Razorpay dashboard
6. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
   ```
7. Install `razorpay` npm package
8. In `src/app/api/bookings/[id]/route.ts`, replace the `action === "pay"` mock with real Razorpay order creation + verification
9. In `booking-flow-modal.tsx`, replace the mock UPI screen with Razorpay Checkout SDK:
   ```typescript
   const rzp = new window.Razorpay({ key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, ... });
   rzp.open();
   ```

---

## Project structure

```
prisma/
  schema.prisma           # 9-model relational schema
scripts/
  seed.ts                 # rich seed data (7 users, 19 items, KYC, chat, bookings, reviews)
mini-services/
  chat-service/           # Socket.io WebSocket service (port 3003, deploy to Railway)
    index.ts
    package.json
src/
  app/
    api/                  # REST API routes
      auth/[...nextauth]  # NextAuth handler
      items/              # GET (browse), POST (create), GET/PATCH/DELETE [id]
      bookings/           # GET (mine), POST (create), PATCH [id] (state machine + emails)
      conversations/[bookingId]  # GET (get/create conversation + messages)
      messages/           # GET (list), POST (send + broadcast via WS)
      reviews/            # POST (both-side reviews)
      wallet/             # GET (balance + txns), POST (withdraw)
      kyc/                # POST (submit), GET (history), PATCH [id] (admin approve/reject)
      admin/              # GET (platform analytics), GET /kyc (KYC queue)
      me/                 # GET (current user + stats)
      signup/             # POST (register)
      categories/         # GET (with counts)
    page.tsx              # SPA root — view router via Zustand
    layout.tsx            # Providers (Session, Query, Theme)
    globals.css           # Premium Airbnb-clean theme (coral accent)
  components/
    rentingit/            # All app components
      image-uploader.tsx  # Cloudinary-powered image upload component
      chat-panel.tsx      # Real-time chat UI (Socket.io client)
      kyc-review-queue.tsx # Admin KYC verification UI
      ...
    ui/                   # shadcn/ui primitives
  lib/
    auth.ts               # NextAuth config + password hashing (pbkdf2)
    session.ts            # Server-side session helpers + requireUser/requireAdmin
    db.ts                 # Prisma client
    cloudinary.ts         # Cloudinary upload helper
    email.ts              # Resend integration + event-specific email templates
```

---

## Resume bullet points (updated for v2)

- Built **RENTINGIT**, a production-ready peer-to-peer rental marketplace for India using **Next.js 16, TypeScript, Prisma, NextAuth, Socket.io, Cloudinary, and Resend** — 9-model relational schema with transactional booking state machine, escrow deposits, real-time chat, and admin KYC verification queue
- Implemented **real-time WebSocket chat** between owners and renters using a separate Socket.io mini-service, with typing indicators, online status, and message persistence
- Built **DIY KYC verification flow** — users upload ID + selfie photos to Cloudinary, admins review and approve in a dedicated dashboard queue, with automated email notifications via Resend
- Designed a **9-model Prisma schema** (User, Item, Booking, Payment, Review, WalletTransaction, Dispute, KycDocument, Conversation, ChatMessage) with transactional state machine and role-based access control
- Implemented **email notification system** via Resend that fires on 5 key booking events (request, approve, pay, complete, dispute) with graceful fallback to console logging in dev
- Shipped a **premium Airbnb-clean UI** with coral accent, soft shadows, big imagery, dark mode, mobile-first responsive, real image uploads via Cloudinary, and a real-time chat panel integrated into the booking flow
- Wrote **deployment guide** for productionizing on Vercel (Next.js) + Neon (PostgreSQL) + Railway (Socket.io service) with custom domain setup

---

## Roadmap (what's next)

- [ ] Real Razorpay integration (live keys, when business registered)
- [ ] Real DigiLocker/Aadhaar API (when DPIIT-approved)
- [ ] QR code handshake at pickup/return (proof of item handover + condition photos)
- [ ] Geolocation "items within 5km" filter using PostGIS
- [ ] Push notifications (FCM) for booking status changes + new chat messages
- [ ] Wishlist/favourites
- [ ] Owner analytics page (views, bookings, earnings per item, conversion rate)
- [ ] Social sharing with OpenGraph images for WhatsApp
- [ ] Mobile app (React Native, reusing the same API)

---

## Demo mode disclaimer

This is a **production-ready MVP** but with two mock integrations:
1. **Razorpay** — mock UPI screen (real SDK swap is a 5-line change, needs business registration)
2. **KYC verification** — DIY upload + admin manual review (real DigiLocker API needs DPIIT-approved entity)

Everything else is **real and production-grade**: image uploads, real-time chat, email notifications, database, auth, escrow deposits, etc.

---

© 2026 RENTINGIT · P2P Rental Marketplace · Made in India 🇮🇳
