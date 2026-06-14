# DECISIONS.md — Nexera Architectural Decision Log

> Evidence-based decision log. All decisions are inferred from repository files. Each entry cites file locations as evidence. Where a decision is inferred (not explicitly documented), it is marked **(Inferred)**.

---

## Decision 1 — Database: PostgreSQL via Supabase

**Context:** The backend requires a relational database to store users, messages, conversations, courses, and payment records with referential integrity.

**Options considered:**
- Self-hosted PostgreSQL on VPS
- Supabase (managed PostgreSQL)
- MongoDB (document store)
- Firebase Firestore (NoSQL, real-time)

**Chosen option:** Supabase (managed PostgreSQL)

**Trade-offs:**
| Pro | Con |
|---|---|
| Managed service — no DB ops overhead | Vendor lock-in to Supabase auth trigger pattern |
| Built-in Storage for media files | Schema changes require Supabase dashboard; no migration files in repo |
| Real-time subscriptions available | Supabase SDK configured with mock fallbacks (`'https://mock.supabase.co'`) suggesting partial integration |

**Evidence:**
- `Backend/src/config/db.js` — Sequelize connects to `DATABASE_URL` pointing to Supabase pooler (`aws-1-ap-northeast-1.pooler.supabase.com`)
- `Backend/.env` — `DATABASE_URL=postgresql://postgres.bullzggohfthvhelxkog:...@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`
- `Backend/src/modules/chat/media.controller.js:115` — uploads to `supabaseAdmin.storage.from('chat-media')`
- `Backend/seed.js:35` — inserts directly into `auth.users` (Supabase-specific table)

---

## Decision 2 — ORM: Dual Strategy (Sequelize + Raw `pg`)

**Context:** Database access requires both structured model management and complex aggregation queries for chat data.

**Options considered:**
- Sequelize ORM only
- Raw `pg` client only
- Prisma ORM
- Knex.js query builder

**Chosen option:** Hybrid — Sequelize for model definitions and associations; raw `pg` Client for complex chat queries

**Trade-offs:**
| Pro | Con |
|---|---|
| Sequelize handles model lifecycle, hooks (password hashing), and associations cleanly | Two different mental models and connection patterns in one codebase |
| Raw `pg` enables nested `json_build_object`/`json_agg` queries that ORM cannot express efficiently | Each raw `pg` call opens and closes its own `Client` — no connection pooling shared with Sequelize |
| Avoids N+1 ORM queries for chat list with members | Inconsistent: some models use `underscored: true`, others use explicit `field` mappings |

**Evidence:**
- `Backend/src/config/db.js` — Sequelize instance for models
- `Backend/src/models/` — All 12 model files use Sequelize
- `Backend/src/modules/chat/chat.controller.js:15–20` — opens a `new Client()` per request
- `Backend/src/modules/chat/message.controller.js:7–10` — `const getClient = () => new Client({...})`
- Comment in `chat.controller.js:23`: *"The single nested select query to get all conversations…"* justifying raw SQL

---

## Decision 3 — Real-Time: Socket.IO

**Context:** The platform requires bidirectional real-time communication for messaging, typing indicators, presence, and whiteboard collaboration.

**Options considered:**
- Native WebSocket (ws library)
- Socket.IO
- Supabase Realtime (already available)
- Server-Sent Events

**Chosen option:** Socket.IO (`socket.io` v4.7)

**Trade-offs:**
| Pro | Con |
|---|---|
| Auto-reconnection, fallback transports | Additional library overhead vs. native WebSocket |
| Room/namespace abstractions map well to conversations | Supabase Realtime (already licensed) could have reduced duplication |
| Widely understood event API | `ws` library also imported — potential confusion |

**Evidence:**
- `Backend/package.json:35` — `"socket.io": "^4.7.2"`
- `Backend/src/socket/index.js` — full Socket.IO server implementation
- `Backend/src/socket/chat.js` — chat-specific socket event handlers
- `Frontend/package.json:38` — `"socket.io-client": "^4.8.3"`
- `Backend/package.json:37` — `"ws": "^8.20.1"` also present (used in `supabaseClient.js` WebSocket transport)

---

## Decision 4 — Authentication: Custom JWT (not Supabase Auth)

**Context:** User authentication requires secure session management.

**Options considered:**
- Supabase Auth (built-in)
- Custom JWT with Express
- Passport.js
- OAuth-only (Google, GitHub)

**Chosen option:** Custom JWT issued by Express, stored client-side

**Trade-offs:**
| Pro | Con |
|---|---|
| Full control over token payload and expiry | Stateless — no refresh token revocation (logout does not invalidate tokens) |
| No dependency on Supabase Auth SDK for core flows | JWT secret is `'mysecretkey'` in committed `.env` (critical security risk) |
| Simple to implement | Supabase Auth is partially set up in parallel (`auth.users` insert on register) creating a dual identity system |

**Evidence:**
- `Backend/src/modules/auth/auth.routes.js:28–31` — `jwt.sign({ id, email }, env.JWT_SECRET, { expiresIn: '1d' })`
- `Backend/src/middleware/auth.middleware.js` — `jwt.verify(token, env.JWT_SECRET)`
- `Backend/.env:10` — `JWT_SECRET=mysecretkey`
- `Backend/src/modules/auth/auth.routes.js:82–87` — parallel insert into `auth.users` on registration

---

## Decision 5 — Validation: Zod

**Context:** API inputs from untrusted clients must be validated before processing.

**Options considered:**
- Manual validation with `if` statements
- Joi
- Zod
- express-validator

**Chosen option:** Zod

**Trade-offs:**
| Pro | Con |
|---|---|
| TypeScript-first inference (useful even in JS for documentation) | Not used consistently — chat controllers (raw SQL path) have no Zod validation |
| `safeParse` pattern avoids thrown exceptions during validation | Zod errors array is passed directly to `ApiError.errors` exposing internal schema details |
| Integrated at environment level (`config/env.js`) for startup validation | |

**Evidence:**
- `Backend/package.json:38` — `"zod": "^3.22.4"`
- `Backend/src/modules/auth/auth.routes.js:16–26` — `signUpSchema`, `signInSchema`
- `Backend/src/config/env.js:4–15` — `envSchema` for environment variables
- `Backend/src/modules/chat/chat.controller.js` — **no Zod validation** on `createDM`, `createGroup`, `addMembers`

---

## Decision 6 — Caching: Redis (ioredis)

**Context:** Frequently read conversation lists and initial message payloads cause repeated expensive PostgreSQL queries.

**Options considered:**
- No caching (always query DB)
- In-memory Node.js cache (node-cache)
- Redis
- Supabase Realtime for push-based freshness

**Chosen option:** Redis via ioredis with 60-second TTL

**Trade-offs:**
| Pro | Con |
|---|---|
| Reduces DB load for the most frequent read (`conversations:${userId}`) | Redis URL absent from `.env.example` — developers may miss it |
| Cache invalidated on write mutations (`deleteCache`) | Single-node Redis; no cluster/sentinel for HA |
| Lazy-connect pattern prevents startup crash if Redis unavailable | REDIS_URL validated in `env.js` but defaults to `localhost:6379` — silent failure in cloud envs |

**Evidence:**
- `Backend/src/config/redis.js` — `getCache`, `setCache`, `deleteCache` helpers
- `Backend/src/modules/chat/chat.controller.js:8–13` — cache check before DB query
- `Backend/src/modules/chat/message.controller.js:17–24` — message cache with cursor-awareness

---

## Decision 7 — Payment Gateway: Razorpay

**Context:** Course monetisation requires a payment gateway for order creation and verification.

**Options considered:**
- Stripe
- Razorpay
- PayPal

**Chosen option:** Razorpay

**Trade-offs:**
| Pro | Con |
|---|---|
| Popular in Indian market; well-documented | Razorpay primarily supports INR; code specifies `"USD"` as currency (`course.routes.js:94`) — will fail in production |
| HMAC signature verification implemented correctly | Test keys committed to `.env` |
| No webhook receiver implemented | Enrolment relies on client-side callback, not server webhook — easier to spoof |

**Evidence:**
- `Backend/package.json:32` — `"razorpay": "^2.9.6"`
- `Backend/src/config/razorpay.js` — Razorpay client initialisation
- `Backend/src/modules/courses/course.routes.js:92–108` — order creation
- `Backend/src/modules/courses/course.routes.js:112–183` — HMAC signature verification + enrolment

---

## Decision 8 — Deployment: Docker + Jenkins + GitHub Actions (Dual Pipeline)

**Context:** The application needs to be built, containerised, and deployed to a VPS.

**Options considered:**
- Manual SSH deploy
- Render only
- Docker + Jenkins only
- Docker + GitHub Actions only

**Chosen option:** Docker Compose for orchestration; both Jenkins (`Jenkinsfile`) and GitHub Actions (`.github/workflows/`) are configured in parallel

**Trade-offs:**
| Pro | Con |
|---|---|
| Docker Compose ensures environment consistency | Dual pipeline (Jenkins + GHA) creates confusion about which is authoritative |
| Jenkins Declarative Pipeline is explicit and auditable | `Jenkinsfile` hardcodes server IP `43.204.143.166` — infrastructure-as-code antipattern |
| GitHub Actions for CD can run without a Jenkins server | CD pipeline also runs on every push to `main` (not after CI success only — commented-out guard) |

**Evidence:**
- `Jenkinsfile` — 3-stage declarative pipeline
- `.github/workflows/ci.yml` — GitHub Actions CI
- `.github/workflows/cd.yml` — GitHub Actions CD
- `docker-compose.yml` — Docker Compose service definition
- `render.yaml` — Render PaaS alternative
- `Frontend/vercel.json` — Vercel for frontend

---

## Decision 9 — State Management: Zustand + React Query

**Context:** Frontend requires both client-side UI state (auth, chat selection) and server-state caching (conversations, messages).

**Options considered:**
- Redux Toolkit
- Zustand + React Query
- Zustand only
- Context API

**Chosen option:** Zustand for UI/client state; React Query for server state caching and mutation management

**Trade-offs:**
| Pro | Con |
|---|---|
| Zustand is minimal and avoids boilerplate | Large chat store (`useChatStore.js` is 14.7 KB) may indicate over-centralisation |
| React Query provides stale-while-revalidate and cache invalidation | Both Zustand and React Query cache conversation data — potential staleness conflicts |

**Evidence:**
- `Frontend/package.json:18` — `@tanstack/react-query`
- `Frontend/package.json:42` — `zustand`
- `Frontend/src/store/useChatStore.js` (14.7 KB) — main chat state
- `Frontend/src/store/useAuthStore.js` — authentication state
- `Frontend/src/store/useConversationStore.js` — conversation selection state

---

## Decision 10 — Error Handling: Operational vs. Programmer Errors

**Context:** Express needs to differentiate between expected errors (validation, auth) and unexpected bugs.

**Options considered:**
- `try/catch` with manual `res.status(...).json(...)` everywhere
- Centralised error handler with custom error class
- Third-party error handling library

**Chosen option:** Custom `ApiError` class extending `Error` with `isOperational` flag; centralised `errorHandler` middleware

**Trade-offs:**
| Pro | Con |
|---|---|
| Operational errors return structured JSON responses | Stack traces logged in development expose internal structure |
| Unknown errors return safe generic message in production | `console.error` used in some places instead of `logger` (e.g., `auth.routes.js:100`) |
| `asyncHandler` wrapper eliminates try/catch boilerplate | |

**Evidence:**
- `Backend/src/utils/ApiError.js` — `ApiError` class with static factory methods
- `Backend/src/middleware/errorHandler.js` — `isOperational` check for response strategy
- `Backend/src/utils/asyncHandler.js` — promise rejection forwarding to Express `next()`
- `Backend/src/modules/auth/auth.routes.js:100` — `console.error` (inconsistent)

---

## Decision 11 — Media Upload: Supabase Storage (Not Cloudinary)

**Context:** Chat messages need to support image, video, and voice file uploads.

**Options considered:**
- Cloudinary (configured in env)
- Supabase Storage
- S3-compatible storage
- Local filesystem

**Chosen option:** Supabase Storage for chat media; Cloudinary credentials in env but **not used** in current code

**Trade-offs:**
| Pro | Con |
|---|---|
| Supabase Storage co-located with database | Cloudinary configured but unused — developer confusion about which to use |
| 1-year signed URLs provided after upload | `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` absent from `env.js` schema; `supabaseClient.js` uses mock fallbacks |
| FFmpeg waveform extraction and Sharp compression applied before upload | `v4 as uuidv4` imported from non-existent `'uuid'` package (not in `package.json`) — potential runtime error |

**Evidence:**
- `Backend/src/modules/chat/media.controller.js:115` — `supabaseAdmin.storage.from('chat-media').upload(...)`
- `Backend/.env:16–18` — Cloudinary credentials present
- `Backend/src/config/supabaseClient.js:5` — checks for `SUPABASE_URL` that is not in `env.js` schema
- `Backend/src/modules/chat/media.controller.js:8` — `import { v4 as uuidv4 } from 'uuid'` — `uuid` not in `package.json`

---

## Decision 12 — Message Persistence: Socket Primary, REST Fallback

**Context:** Messages sent via Socket.IO need to be persisted to PostgreSQL.

**Chosen option:** Socket.IO is the primary write path; REST `POST /messages` endpoint exists as a fallback

**Trade-offs:**
| Pro | Con |
|---|---|
| Socket write allows immediate broadcast to room members | If socket connection drops mid-send, message may be lost unless client retries via REST |
| `tempId` tracked for optimistic UI updates | REST fallback does not emit socket events, so other clients won't receive real-time updates |

**Evidence:**
- `Backend/src/socket/index.js:115–183` — `message:send` socket event with DB persist
- `Backend/src/modules/chat/message.controller.js:103` — comment: *"REST fallback, socket is primary"*
