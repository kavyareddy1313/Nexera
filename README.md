# Nexera

> **A full-stack real-time collaboration and learning platform** — combining the instant communication of Slack/Discord with the structured course delivery of an LMS, all in one containerised workspace.

[![CI/CD Pipeline](https://github.com/kavyareddy1313/Nexera/actions/workflows/ci.yml/badge.svg)](https://github.com/kavyareddy1313/Nexera/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-lightblue)
![Docker](https://img.shields.io/badge/Docker-Containerised-blue)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Database Design Summary](#database-design-summary)
- [Installation Instructions](#installation-instructions)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Build and Deployment Instructions](#build-and-deployment-instructions)
- [Testing Instructions](#testing-instructions)
- [CSV Import Workflow](#csv-import-workflow)
- [Assumptions](#assumptions)
- [AI Tools Used](#ai-tools-used)
- [Known Limitations](#known-limitations)

---

## Project Overview

Nexera is a comprehensive, production-grade full-stack platform that bridges real-time communication and structured e-learning. Built with Node.js, Express, React 19, PostgreSQL (via Supabase), Redis, Socket.IO, and Docker, it enables users to:

- Register, authenticate, and manage profiles
- Send real-time direct messages and group conversations (WhatsApp-parity)
- Browse, purchase, and enrol in courses via Razorpay payment integration
- Auto-join a course community group chat upon successful enrolment
- Collaborate on interactive whiteboards and virtual meetings
- Upload and share rich media (images, video, audio with waveform extraction)

The repository is structured as a monorepo with `Frontend/` (React/Vite SPA) and `Backend/` (Node.js/Express API + Socket.IO server), orchestrated via Docker Compose and deployed through Jenkins and GitHub Actions CI/CD pipelines.

---

## Problem Statement

Modern remote teams and learners use disconnected tools: Slack for chat, Zoom for meetings, Udemy for courses. Switching between platforms creates context loss, communication gaps, and a fragmented experience. Nexera solves this by providing a **unified workspace** where:

- Purchasing a course automatically places the student inside a live group chat with their instructor and peers
- Real-time collaboration (whiteboard, meetings) is accessible from within the same interface as learning
- All communication and course data lives in one relational database with real-time push via WebSockets

---

## Features

| Feature | Description |
|---|---|
| **JWT Authentication** | Register/login with Zod-validated inputs, bcrypt password hashing, JWT access (1d) + refresh (7d) tokens |
| **Real-Time Messaging** | DMs and group channels via Socket.IO; typing indicators, online presence, message delivery receipts |
| **WhatsApp-Parity Chat** | Reply-to, forward, edit (15-minute window), delete-for-me/everyone, emoji reactions, pinned messages |
| **Rich Media Uploads** | Images (Sharp compression), video/audio (FFmpeg waveform extraction) uploaded to Supabase Storage |
| **Course Marketplace** | Browse, view, and purchase courses; Razorpay order creation + HMAC signature verification |
| **Auto Community Chat** | Course purchase triggers auto-enrolment into a group conversation for the course |
| **Whiteboard Module** | Real-time collaborative canvas via dedicated Socket.IO events |
| **Meetings Module** | Route scaffolding for virtual meeting integration |
| **Status Updates** | Ephemeral user statuses (text/image/video) with 24h auto-expiry via cron |
| **Redis Caching** | Conversation list and initial messages cached with 60s TTL and invalidated on mutation |
| **Rate Limiting** | 100 req/15min global; 10 req/15min on auth endpoints |
| **Disappearing Messages** | Cron job deletes expired messages every hour |
| **Search** | User search by username/fullName (iLike); message search by content (ILIKE) |
| **Invite Links** | Group conversations can generate shareable invite links |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component framework |
| Vite | 8 | Build tool and dev server |
| React Router | 7 | Client-side routing |
| Zustand | 5 | Global state management |
| TanStack React Query | 5 | Server-state caching & data fetching |
| Axios | 1.16 | HTTP client |
| Socket.IO Client | 4.8 | Real-time WebSocket communication |
| TailwindCSS | 4 | Utility-first styling |
| Framer Motion | 12 | Animations and transitions |
| Tiptap | 3 | Rich text message editor |
| TanStack Virtual | 3 | Virtualised message list rendering |
| Emoji Mart | 5 | Emoji picker |
| Fuse.js | 7 | Client-side fuzzy search |
| date-fns | 4 | Date formatting |
| react-dropzone | 15 | Drag-and-drop file upload |
| yet-another-react-lightbox | 3 | Image/media lightbox viewer |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18 | JavaScript runtime |
| Express | 4.18 | HTTP API framework |
| Socket.IO | 4.7 | Real-time bidirectional communication |
| Sequelize | 6.37 | ORM for PostgreSQL model definitions |
| `pg` | 8.20 | Raw PostgreSQL client for chat queries |
| Supabase JS SDK | 2.106 | Media storage upload |
| Redis (ioredis) | 5.10 | Conversation/message caching |
| JWT (jsonwebtoken) | 9.0 | Authentication tokens |
| bcryptjs | 3.0 | Password hashing |
| Zod | 3.22 | Schema validation for API inputs |
| Multer | 2.1 | Multipart file upload handling |
| Sharp | 0.34 | Image processing and compression |
| fluent-ffmpeg | 2.1 | Audio/video metadata and waveform extraction |
| Winston | 3.11 | Structured application logging |
| Morgan | 1.10 | HTTP request logging |
| Helmet | 7.1 | Security HTTP headers |
| express-rate-limit | 7.1 | API rate limiting |
| compression | 1.7 | Gzip response compression |
| node-cron | 4.2 | Scheduled jobs for message/status expiry |
| Razorpay | 2.9 | Payment gateway integration |

### DevOps & Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Container orchestration |
| Jenkins | Primary CI/CD pipeline (Declarative Pipeline) |
| GitHub Actions | Alternative CI (`ci.yml`) + CD (`cd.yml`) pipeline |
| Docker Hub (`kavya00/`) | Container image registry |
| Render (`render.yaml`) | Alternative PaaS deployment |
| Vercel (`vercel.json`) | Frontend SPA deployment with SPA rewrites |
| AWS EC2 / VPS | Production server (`43.204.143.166` in Jenkinsfile) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│  React 19 SPA • Zustand • React Query • Socket.IO   │
└───────────────────────┬──────────────────────────────┘
                        │ HTTPS / WSS
          ┌─────────────▼──────────────┐
          │     Node.js / Express      │
          │  REST API  +  Socket.IO    │
          │  Port 4000                 │
          │  ┌─────────────────────┐   │
          │  │  Auth Middleware    │   │
          │  │  Rate Limit        │   │
          │  │  Helmet / CORS     │   │
          │  │  Winston / Morgan  │   │
          │  └─────────────────────┘   │
          │  Modules:                  │
          │  auth • chat • courses     │
          │  media • meetings          │
          │  whiteboard               │
          └──┬──────────┬─────────────┘
             │          │
    ┌────────▼───┐  ┌───▼──────────┐
    │ PostgreSQL │  │    Redis      │
    │ (Supabase) │  │ (Cache/State)│
    │ pg + ORM   │  │ ioredis      │
    └────────────┘  └──────────────┘
             │
    ┌────────▼──────────┐
    │  Supabase Storage │
    │  (chat-media      │
    │   bucket)         │
    └───────────────────┘
```

**Dual database access pattern:** Sequelize ORM is used for model definitions and associations. Raw `pg` Client is used for complex chat queries (nested JSON aggregations) where ORM overhead is impractical.

---

## Database Design Summary

The database is hosted on Supabase (PostgreSQL). Schema is split into:

- **`auth.users`** — Supabase's built-in authentication table; synced manually on register
- **`public.profiles`** — User display data (avatar, colour, initials, online status)
- **`public.Users`** — Sequelize-managed user table with hashed passwords
- **`public.conversations`** — DM and group conversations with invite links and disappearing mode
- **`public.conversation_members`** — Membership join table with role, mute, pin, archive, and unread count
- **`public.messages`** — All chat messages with type enum, metadata JSONB, reply/forward chains, and soft-delete
- **`public.message_status`** — Per-user delivery/read tracking
- **`public.message_reactions`** — Emoji reaction per user per message
- **`public.statuses`** — Ephemeral user statuses with expiry
- **`public.status_views`** — View tracking for statuses
- **`public.Courses`** — Course catalogue with pricing, rating, category
- **`public.CourseEnrollments`** — Enrolment records with Razorpay payment ID and status
- **`public.Rooms`** / **`public.RoomMembers`** — Legacy room model (partially superseded by conversations)

See [SCOPE.md](./SCOPE.md) for full schema documentation.

---

## Installation Instructions

### Prerequisites

- Node.js v18 or higher
- npm v9+
- Docker Desktop (optional but recommended)
- A [Supabase](https://supabase.com) project (PostgreSQL database)
- A [Redis](https://redis.io) instance (local or hosted, e.g. Upstash)
- A [Razorpay](https://razorpay.com) account (test keys sufficient for development)
- A [Cloudinary](https://cloudinary.com) account (for media — currently referenced but media upload uses Supabase Storage)

### Clone the Repository

```bash
git clone https://github.com/kavyareddy1313/Nexera.git
cd Nexera
```

---

## Environment Variables

### Backend (`Backend/.env`)

Copy `Backend/.env.example` to `Backend/.env` and fill in values:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 4000) | HTTP server port |
| `NODE_ENV` | No (default: development) | Environment flag |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (Supabase pooler URL) |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs (min 8 chars) |
| `FRONTEND_URL` | **Yes** | CORS origin for the frontend (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `REDIS_URL` | No (default: `redis://localhost:6379`) | Redis connection URL |
| `RAZORPAY_KEY_ID` | **Yes** (for payments) | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | **Yes** (for payments) | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | Razorpay webhook secret |

> **⚠️ Security Warning:** The `.env` file is committed to the repository with real credentials including database passwords, API keys, and payment secrets. This is a critical security vulnerability. Rotate all credentials immediately and add `.env` to `.gitignore`.

### Frontend (`Frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:4000/api/v1`) |
| `VITE_SOCKET_URL` | **Yes** | Socket.IO server URL (e.g. `http://localhost:4000`) |

---

## Local Development Setup

### Option 1: Docker Compose (Recommended)

```bash
# From repository root
docker-compose up -d

# Frontend: http://localhost:80
# Backend API: http://localhost:4000
# Health check: http://localhost:4000/health
```

### Option 2: Manual Setup

**Backend:**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev       # Starts with nodemon on port 4000
```

**Frontend:**
```bash
cd Frontend
npm install
# Create Frontend/.env with VITE_API_URL and VITE_SOCKET_URL
npm run dev       # Starts Vite dev server on port 5173
```

### Seed the Database

```bash
cd Backend
npm run db:seed   # Runs seed.js — creates 8 users, 5 channels, 1 DM, sample messages
```

Seed credentials (password for all: `Nexera@123`):
- `ethan@nexera.dev`, `sarah@nexera.dev`, `marcus@nexera.dev`, `priya@nexera.dev`
- `liam@nexera.dev`, `nora@nexera.dev`, `arjun@nexera.dev`, `zara@nexera.dev`

---

## Build and Deployment Instructions

### Production Docker Build

```bash
# Build individual images
docker build -t kavya00/nexera-backend:latest ./Backend
docker build \
  --build-arg VITE_API_URL=http://YOUR_SERVER_IP:4000/api/v1 \
  --build-arg VITE_SOCKET_URL=http://YOUR_SERVER_IP:4000 \
  -t kavya00/nexera-frontend:latest ./Frontend

docker push kavya00/nexera-backend:latest
docker push kavya00/nexera-frontend:latest
```

### GitHub Actions (Automated)

Push to `main` branch triggers:
1. **CI** (`.github/workflows/ci.yml`): Installs dependencies, builds frontend, verifies Docker Compose build
2. **CD** (`.github/workflows/cd.yml`): Builds and pushes Docker images to Docker Hub, deploys to VPS via SSH

Required GitHub Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`

### Jenkins Pipeline

`Jenkinsfile` at repository root defines a 3-stage declarative pipeline:
1. `Checkout` — pulls source code
2. `Docker Build & Push` — builds both images and pushes to `kavya00/` Docker Hub
3. `Deploy to VPS` — SSH into `43.204.143.166`, pulls latest images, runs `docker compose up -d`

### Render (Alternative)

`render.yaml` defines a `web` service pointing to `Backend/` with `npm start`. Environment variables are injected from Render dashboard.

### Vercel (Frontend)

`Frontend/vercel.json` configures SPA routing rewrites so all paths serve `index.html`.

---

## Testing Instructions

> **⚠️ No automated tests exist in this repository.** The CI pipeline has a commented-out test step:
> ```yaml
> # - name: Run Tests
> #   run: npm test
> ```

**Manual testing approach:**

1. Start the stack locally (see above)
2. Access `http://localhost:5173` (or `:80` via Docker)
3. Register two accounts and verify JWT token is returned
4. Open two browser windows and verify real-time message delivery
5. Use the `/health` endpoint to verify backend connectivity: `GET http://localhost:4000/health`
6. Test payment flow using Razorpay test card: `4111 1111 1111 1111`

**Recommended next steps:**
- Add Jest/Vitest unit tests for Zod schema validators
- Add Supertest integration tests for API routes
- Add Playwright or Cypress E2E tests for critical flows (register, login, send message, purchase course)

---

## CSV Import Workflow

> **No CSV import pipeline currently exists in this codebase.**

The project uses a **seed script** (`Backend/seed.js`) for initial data population, not CSV import. This script:
- Creates 8 hardcoded user records directly in `auth.users` and `public.profiles`
- Creates 5 group channels and 1 DM conversation
- Inserts sample messages

There is also a `Backend/seed_db.js` file (secondary seed). There is no evidence of any CSV ingestion, parsing, or bulk import functionality. If CSV import is a requirement, it has **not been implemented**.

See [SCOPE.md](./SCOPE.md) for a full anomaly log of what validations would be required if CSV import were added.

---

## Assumptions

1. **Database schema is managed externally** — Sequelize `sync()` is explicitly commented out (`// await sequelize.sync()`). Schema is assumed to exist in Supabase already (managed via Supabase dashboard or migrations).
2. **Redis is available** — The application will log errors but not crash if Redis is unavailable (graceful degradation in `getCache`/`setCache`).
3. **Supabase Storage bucket `chat-media` exists** — Media upload to Supabase Storage assumes this bucket is pre-created.
4. **Currency for Razorpay** — The course payment uses `"USD"` as currency (line 94, `course.routes.js`) but Razorpay is an Indian payment gateway defaulting to INR. This may cause failures in production.
5. **Supabase trigger creates `public.profiles`** — The seed script comments `"The trigger creates the profile"`, meaning a Supabase database trigger is assumed to exist but is not in the repository.
6. **`public.workspaces`, `public.pinned_messages`, `public.polls`, `public.poll_options`, `public.poll_votes` tables** — These are referenced in code (`seed.js`, `interaction.controller.js`) but no Sequelize models or migration files exist for them.

---

## AI Tools Used

AI assistance (specifically Gemini/Claude) was integrated during development to accelerate scaffolding of:
- Sequelize model definitions and association boilerplate
- Express route and controller patterns
- Socket.IO event handler structure
- Zod validation schema design
- Docker and CI/CD pipeline YAML configuration

See [AI_USAGE.md](./AI_USAGE.md) for a complete disclosure including inferred prompts and identified risks.

---

## Known Limitations

| # | Limitation | Location | Impact |
|---|---|---|---|
| 1 | **Credentials committed to Git** | `Backend/.env`, `Backend/.env.example` | Critical security risk |
| 2 | **No automated tests** | Entire repo | No regression safety net |
| 3 | **No Supabase migrations in repo** | `supabase/` has only `seedTestUsers.ts` | Schema not reproducible |
| 4 | **Razorpay uses `"USD"` currency** | `course.routes.js:94` | Payment failures in production |
| 5 | **`Room`/`RoomMember` models unused** | `src/models/` | Dead code; schema inconsistency |
| 6 | **`toggleStar` is a stub** | `message.controller.js:252` | Feature not implemented |
| 7 | **No refresh token revocation** | `auth.routes.js` | Tokens cannot be invalidated on logout |
| 8 | **Redis URL not in `.env.example`** | `Backend/.env.example` | Developers may miss Redis config |
| 9 | **`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing from env schema** | `config/env.js` | `supabaseClient.js` uses mock fallbacks |
| 10 | **Message search uses ILIKE, not full-text** | `message.controller.js:266` | Poor performance at scale; `search_vector` column unused |
| 11 | **Password minimum length is 1 character** | `auth.routes.js:25` | Weak security policy |
| 12 | **`JWT_SECRET` is `mysecretkey` in committed .env** | `Backend/.env:10` | Cryptographically weak; must be rotated |
| 13 | **No CSV import** | Entire repo | If required, not implemented |
| 14 | **`socket/index.js` references `Room`/`RoomMember` without importing them** | `socket/index.js:14-31` | Runtime `ReferenceError` if `ensureGeneralChannel` is called |