# AI_USAGE.md — AI Tools Disclosure

> **Disclosure statement:** AI assistance tools were integrated during the development of Nexera to accelerate scaffolding, boilerplate generation, and architectural pattern implementation. This document discloses the tools used, the likely prompts that drove major code generation, known risks introduced by AI-generated code, and the human verification process that should accompany AI usage.

---

## 1. AI Tools Used

### Evidence from Repository

The repository does not contain any explicit AI tool logs, `.cursor_ignore`, `.copilot` configuration files, or AI prompt comments. However, the following patterns strongly suggest AI assistance was used:

| Indicator | Evidence | Likely Tool |
|---|---|---|
| Highly consistent boilerplate across all models | All 12 Sequelize models follow identical structure with UUID PKs, `underscored: true`, tableName | GitHub Copilot / ChatGPT |
| `ApiError` + `ApiResponse` pattern | Classic pattern popularised by Hitesh Choudhary's YouTube tutorials — exactly reproduced | ChatGPT / Copilot |
| `asyncHandler` utility (1 line) | Identical to pattern from popular Node.js course content | ChatGPT |
| Zod env validation at startup | Exact pattern from Josh Tried Coding / T3 Stack documentation | Copilot / Claude |
| Socket.IO room management boilerplate | `onlineUsers = new Map(); socket.join()` pattern with typed presence events | ChatGPT |
| Jenkins Declarative Pipeline | Complete 3-stage pipeline with `withCredentials` and SSH — complex DevOps boilerplate unlikely written from scratch | ChatGPT |
| GitHub Actions YAML | Both CI and CD workflows follow `uses:` action pattern from official GitHub docs examples | Copilot |
| Dense JSONB aggregation SQL | `json_build_object` + `json_agg` nested queries in `chat.controller.js` | ChatGPT |

### Assessment

Based on code pattern analysis, the following tools were **most likely** used:
- **ChatGPT (GPT-4 or later)** — primary tool for architecture scaffolding, complex SQL, and CI/CD YAML
- **GitHub Copilot** — inline code completion for model definitions, route handlers, and middleware
- *(No evidence of Cursor IDE, Claude, or Windsurf specifically, though these cannot be ruled out)*

---

## 2. Likely Development Prompts

The following prompts are inferred from major code structures in the repository.

### Prompt 2.1 — Sequelize Model Architecture

> *"Create a Sequelize model for a Users table in PostgreSQL using ES modules. The model should have UUID primary key, full_name, username (unique), email (unique with isEmail validation), password (bcrypt hashed via beforeCreate hook), avatarUrl, and isOnline fields. Use underscored: true and add a comparePassword instance method."*

**Resulting code:** `Backend/src/models/User.js` — exact match

---

### Prompt 2.2 — JWT Authentication Routes with Zod

> *"Create Express JWT authentication routes with Zod validation. Include register, login, refresh token, and logout endpoints. Register should check for duplicate email/username. Generate both accessToken (1d) and refreshToken (7d). Return structured ApiResponse objects."*

**Resulting code:** `Backend/src/modules/auth/auth.routes.js:16–148`

---

### Prompt 2.3 — Socket.IO Chat Server with Presence

> *"Build a Socket.IO server that tracks online users in a Map, auto-joins users to their conversation rooms on connect, handles message:send events with DB persistence, emits typing:start/stop indicators, and updates presence (online/offline) on connect/disconnect."*

**Resulting code:** `Backend/src/socket/index.js`

---

### Prompt 2.4 — Nested SQL for Conversation List

> *"Write a single PostgreSQL query to fetch all conversations for a user including: last message details, all member profiles with avatar colours and initials, and per-member settings like unread count, is_muted, is_pinned. Use json_build_object and json_agg."*

**Resulting code:** `Backend/src/modules/chat/chat.controller.js:28–57`

---

### Prompt 2.5 — Jenkins Declarative Pipeline

> *"Create a Jenkins Declarative Pipeline that: builds and pushes Docker images to Docker Hub using withCredentials, then deploys to a VPS via SSH. Include a frontend build with Vite build args and a backend Docker build."*

**Resulting code:** `Jenkinsfile`

---

### Prompt 2.6 — GitHub Actions CI/CD

> *"Create two GitHub Actions workflows: one CI workflow that installs dependencies, builds the frontend with Vite, and verifies the Docker Compose build; and one CD workflow triggered on push to main that builds and pushes Docker images and deploys to a VPS via SSH using appleboy/ssh-action."*

**Resulting code:** `.github/workflows/ci.yml` and `.github/workflows/cd.yml`

---

### Prompt 2.7 — Razorpay Payment Integration

> *"Implement a Razorpay course purchase flow with Express. Create an order endpoint that calculates amount from course price, and a verify-payment endpoint that validates the HMAC-SHA256 signature. On success, create a CourseEnrollment record and auto-add the user to the course group chat."*

**Resulting code:** `Backend/src/modules/courses/course.routes.js:68–184`

---

### Prompt 2.8 — Redis Caching Helpers

> *"Create Redis caching helper functions using ioredis: getCache, setCache with TTL, and deleteCache. Use lazy connect and gracefully handle errors without crashing."*

**Resulting code:** `Backend/src/config/redis.js`

---

## 3. AI Mistakes Review

### Mistake 3.1 — `uuid` Package Used But Not Installed

**Generated suggestion:** `import { v4 as uuidv4 } from 'uuid';` in `media.controller.js:8`

**Why it's incorrect:**
The `uuid` package is not listed in `Backend/package.json` dependencies. AI commonly assumes `uuid` is available because it is extremely common, but the project uses Node.js's built-in `crypto.randomUUID()` everywhere else.

**How to detect:**
```bash
cd Backend && npm ls uuid
# → (empty — not installed)
```
A runtime `MODULE_NOT_FOUND` error would occur when any file upload endpoint is first called.

**Correct implementation:**
```javascript
import { randomUUID } from 'crypto';
// Replace uuidv4() with randomUUID()
const filename = `${req.user.id}/${randomUUID()}${ext}`;
```

**Risk if not fixed:** All media upload endpoints (`POST /api/v1/media/upload`) crash with a module resolution error. File sharing is completely broken.

---

### Mistake 3.2 — Razorpay Order Currency Set to `"USD"`

**Generated suggestion:**
```javascript
const options = {
  amount,
  currency: "USD", // You can change to INR if needed
  receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
};
```
(`course.routes.js:92–96`)

**Why it's incorrect:**
Razorpay is an Indian payment gateway and only supports INR for most integrations. Using `"USD"` will result in an API error from Razorpay in production. The comment `"// You can change to INR if needed"` shows the AI left this unresolved.

Additionally, `Math.random()` for receipt IDs can collide, and Razorpay receipt IDs should be unique transaction references (e.g. `receipt_${userId}_${courseId}_${Date.now()}`).

**How to detect:**
- Call `POST /api/v1/courses/:id/create-order` with test credentials
- Razorpay returns: `{"error": {"code": "BAD_REQUEST_ERROR", "description": "The value provided for currency is not supported"}}`

**Correct implementation:**
```javascript
const options = {
  amount: Math.round(Number(course.price) * 100), // In paise
  currency: "INR",
  receipt: `rcpt_${req.user.id.slice(0,8)}_${course.id.slice(0,8)}_${Date.now()}`,
};
```

**Risk if not fixed:** All course purchases fail in production. Complete revenue loss.

---

### Mistake 3.3 — `Room` and `RoomMember` Referenced Without Import in Socket Server

**Generated suggestion (in `socket/index.js:12–38`):**
```javascript
const ensureGeneralChannel = async (userId) => {
  let generalRoom = await Room.findOne({ where: { name: 'general', type: 'group' } });
  // ...
  await RoomMember.create({ room_id: generalRoom.id, user_id: userId });
};
```

**Why it's incorrect:**
`Room` and `RoomMember` are used but never imported in `socket/index.js`. The file imports `handleChatSocketEvents` and Socket.IO itself, but not the Sequelize models. This is a classic AI mistake where the AI assumes imports from earlier in a conversation are still in scope.

**How to detect:**
The function `ensureGeneralChannel` is defined but never called in the current code — this is likely why the error hasn't surfaced. If it were called, Node.js would throw:
```
ReferenceError: Room is not defined
```

**Correct implementation:**
```javascript
import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';
```

**Risk if not fixed:** If `ensureGeneralChannel` is re-enabled, the socket server crashes on every new user connection.

---

### Mistake 3.4 — JWT `min` Validation Too Weak

**Generated suggestion:**
```javascript
JWT_SECRET: z.string().min(8),
```
(`config/env.js:9`)

**Why it's incorrect:**
The committed `.env` file uses `JWT_SECRET=mysecretkey` which is exactly 9 characters — passing the `min(8)` validation. A cryptographically secure JWT secret should be at minimum 32–64 random bytes. The Zod validation gives false confidence that the secret is secure.

**How to detect:**
```bash
echo -n "mysecretkey" | wc -c
# → 11 chars — passes min(8) but is trivially brutable
```

**Correct implementation:**
```javascript
JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
```
And generate a proper secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Risk if not fixed:** Any attacker who knows the weak secret can forge valid JWTs, impersonating any user including admins.

---

### Mistake 3.5 — Password Minimum Length of 1

**Generated suggestion:**
```javascript
password: z.string().min(1),
```
(`auth.routes.js:25`)

**Why it's incorrect:**
`min(1)` accepts passwords like `"a"` or `"1"`. AI commonly generates the shortest valid validator when not given a specific security policy, defaulting to ensuring the field is simply not empty.

**How to detect:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"a","fullName":"Test User","username":"testuser"}'
# → 201 Created — single character password accepted
```

**Correct implementation:**
```javascript
password: z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number'),
```

**Risk if not fixed:** Users can register with trivially guessable passwords. Brute-force attacks become trivial.

---

## 4. Human Verification Process

The following process **should have been followed** for each AI-generated code segment:

### Step 1 — Functional Correctness Verification
- Run the generated code against actual API calls using Postman or curl
- Verify all happy-path scenarios work (register, login, send message, purchase course)
- Test all error paths (wrong password, duplicate email, invalid signature)

### Step 2 — Dependency Audit
- Cross-reference every `import` statement against `package.json` dependencies
- Run `npm ls <package>` for any package not obviously in `package.json`
- In this project: `uuid` import in `media.controller.js` would have been caught

### Step 3 — Security Review
- Check all environment variable defaults and minimums
- Verify secrets are not committed to version control (`.gitignore` audit)
- Test rate limiting by making >10 auth requests in a 15-minute window
- Verify JWT token cannot be forged with a known secret

### Step 4 — Integration Testing
- Test the full user flow end-to-end: register → login → send message → purchase course → verify community chat
- Verify Socket.IO events are received by all connected clients in a room
- Test Redis cache invalidation by sending a message and checking conversation list is updated

### Step 5 — Third-Party API Validation
- Test Razorpay order creation with actual test credentials and verify currency is accepted
- Test Supabase Storage upload with a real file and verify signed URL is accessible
- Verify Cloudinary credentials are either used or removed from the codebase

### Step 6 — Code Consistency Review
- Ensure all imports are present in all files that reference them
- Ensure error handling uses `logger` consistently (not mixed with `console.error`)
- Ensure validation (Zod) is applied to all API endpoints, not just auth routes

### Step 7 — Load and Edge Case Testing
- Test with >100 concurrent socket connections
- Test message sending in a group with >50 members
- Test file upload with the maximum 100MB limit
