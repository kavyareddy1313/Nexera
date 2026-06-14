# SCOPE.md — Nexera Project Scope Document

---

## 1. Database Schema

All tables documented below are inferred from Sequelize model files in `Backend/src/models/`, raw SQL in controllers and seed scripts, and comments in the codebase.

---

### Table: `public."Users"` (Sequelize tableName: `Users`)

Managed by Sequelize ORM. Primary user accounts with hashed passwords.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | Auto-generated UUID |
| `full_name` | VARCHAR | NOT NULL | JS field: `fullName` |
| `username` | VARCHAR | NOT NULL, UNIQUE | Regex: `^[a-z0-9_]+$` |
| `email` | VARCHAR | NOT NULL, UNIQUE | Validated with Sequelize `isEmail` |
| `password` | VARCHAR | NOT NULL | bcrypt hash (cost 10), never returned in API |
| `avatar_url` | VARCHAR | NULL | JS field: `avatarUrl` |
| `is_online` | BOOLEAN | DEFAULT `false` | JS field: `isOnline` |
| `created_at` | TIMESTAMP | AUTO (Sequelize) | |
| `updated_at` | TIMESTAMP | AUTO (Sequelize) | |

**Indexes:** `username` (unique), `email` (unique)  
**Hooks:** `beforeCreate` and `beforeUpdate` hash password with bcrypt  
**Source:** `Backend/src/models/User.js`

---

### Table: `public.profiles`

Managed via raw SQL (not Sequelize model). Supabase-native user display data.  
Created by a Supabase trigger on `auth.users` insert (trigger not present in repo).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PRIMARY KEY, FK → `auth.users(id)` |
| `full_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile photo URL |
| `avatar_color_bg` | VARCHAR | Background colour for avatar initials |
| `avatar_color_text` | VARCHAR | Text colour for avatar initials |
| `initials` | VARCHAR(2) | Derived from `full_name` (first letters of each word) |
| `status` | TEXT | `'online'` \| `'offline'` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Source:** `Backend/src/modules/auth/auth.routes.js` (lines 90–98), `Backend/seed.js` (lines 40–44)

---

### Table: `public.conversations`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `type` | ENUM(`'dm'`, `'group'`) | NOT NULL | |
| `name` | VARCHAR | NULL | Required for group type |
| `description` | TEXT | NULL | |
| `avatar_url` | VARCHAR | NULL | |
| `created_by` | UUID | NULL, FK → `public."Users"(id)` | |
| `invite_link` | VARCHAR | UNIQUE | Random string; used for join-by-link |
| `disappearing_mode` | ENUM(`'off'`, `'1d'`, `'7d'`, `'90d'`) | DEFAULT `'off'` | |
| `last_message_id` | UUID | NULL, FK → `public.messages(id)` | Denormalised for performance |
| `last_activity_at` | TIMESTAMP | DEFAULT NOW | Updated on each message |
| `created_at` | TIMESTAMP | AUTO | |

**Source:** `Backend/src/models/Conversation.js`

---

### Table: `public.conversation_members`

Composite primary key join table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `conversation_id` | UUID | PK (part 1), FK → `conversations(id)` | |
| `user_id` | UUID | PK (part 2), FK → `public."Users"(id)` | |
| `role` | ENUM(`'admin'`, `'member'`) | DEFAULT `'member'` | |
| `is_muted` | BOOLEAN | DEFAULT `false` | |
| `is_pinned` | BOOLEAN | DEFAULT `false` | |
| `is_archived` | BOOLEAN | DEFAULT `false` | |
| `unread_count` | INTEGER | DEFAULT `0` | Incremented on new message, reset on read |
| `last_read_at` | TIMESTAMP | DEFAULT NOW | |
| `joined_at` | TIMESTAMP | DEFAULT NOW | |

**Source:** `Backend/src/models/ConversationMember.js`

---

### Table: `public.messages`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `conversation_id` | UUID | NULL, FK → `conversations(id)` | |
| `sender_id` | UUID | NULL, FK → `public."Users"(id)` | NULL for system messages |
| `type` | ENUM | NOT NULL | `'text'`, `'image'`, `'video'`, `'audio'`, `'voice'`, `'document'`, `'sticker'`, `'location'`, `'contact'`, `'poll'`, `'system'`, `'deleted'` |
| `content` | TEXT | NULL | Set to NULL when `deleted_for = 'everyone'` |
| `metadata` | JSONB | DEFAULT `{}` | Stores file URL, dimensions, duration, waveform |
| `reply_to_id` | UUID | NULL, self-FK → `messages(id)` | Thread reply |
| `forwarded_from` | UUID | NULL, self-FK → `messages(id)` | Forward source |
| `is_edited` | BOOLEAN | DEFAULT `false` | |
| `edited_at` | TIMESTAMP | NULL | Set when message is edited |
| `deleted_at` | TIMESTAMP | NULL | Soft-delete timestamp |
| `deleted_for` | ENUM(`'none'`, `'me'`, `'everyone'`) | DEFAULT `'none'` | |
| `expires_at` | TIMESTAMP | NULL | Used for disappearing messages |
| `temp_id` | VARCHAR | NULL | Client-side optimistic update ID |
| `created_at` | TIMESTAMP | DEFAULT NOW | |
| `search_vector` | TSVECTOR | NULL | Full-text search index (currently unused) |

**Edit constraint:** Edit permitted only if message is <15 minutes old (enforced in `message.controller.js:156`)  
**Source:** `Backend/src/models/Message.js`

---

### Table: `public.message_status`

Composite primary key.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `message_id` | UUID | PK (part 1), FK → `messages(id)` | |
| `user_id` | UUID | PK (part 2), FK → `public."Users"(id)` | |
| `status` | ENUM(`'delivered'`, `'read'`) | NOT NULL | |
| `updated_at` | TIMESTAMP | DEFAULT NOW | |

**Source:** `Backend/src/models/MessageStatus.js`

---

### Table: `public.message_reactions`

Composite primary key on three columns.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `message_id` | UUID | PK (part 1), FK → `messages(id)` | |
| `user_id` | UUID | PK (part 2), FK → `public."Users"(id)` | |
| `emoji` | VARCHAR | PK (part 3), NOT NULL | Emoji string (e.g. `👍`) |
| `created_at` | TIMESTAMP | DEFAULT NOW | |

**Behaviour:** Toggle (insert or delete) on same `(message_id, user_id, emoji)` combination  
**Source:** `Backend/src/models/MessageReaction.js`, `Backend/src/modules/chat/interaction.controller.js`

---

### Table: `public.statuses`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `user_id` | UUID | NOT NULL, FK → `public."Users"(id)` | |
| `type` | ENUM(`'text'`, `'image'`, `'video'`) | NULL | |
| `content` | TEXT | NULL | Text content of the status |
| `media_url` | TEXT | NULL | Media URL for image/video statuses |
| `bg_color` | VARCHAR | NULL | Background colour for text statuses |
| `expires_at` | TIMESTAMP | NULL | Auto-deleted by cron job when expired |
| `created_at` | TIMESTAMP | DEFAULT NOW | |

**Source:** `Backend/src/models/Status.js`

---

### Table: `public.status_views`

Composite primary key.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `status_id` | UUID | PK (part 1), FK → `statuses(id)` | |
| `viewer_id` | UUID | PK (part 2), FK → `public."Users"(id)` | |
| `viewed_at` | TIMESTAMP | DEFAULT NOW | |

**Source:** `Backend/src/models/StatusView.js`

---

### Table: `public."Courses"` (Sequelize tableName: `Courses`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `title` | VARCHAR | NOT NULL | |
| `description` | TEXT | NOT NULL | |
| `price` | DECIMAL(10,2) | NOT NULL, DEFAULT `0.00` | |
| `thumbnail_url` | VARCHAR | NULL | JS field: `thumbnailUrl` |
| `rating` | DECIMAL(2,1) | DEFAULT `0.0` | |
| `students_enrolled` | INTEGER | DEFAULT `0` | JS field: `studentsEnrolled` |
| `category` | VARCHAR | NULL | |
| `duration` | VARCHAR | NULL | Free text (e.g. `"40 Hours"`) |
| `instructor_id` | UUID | FK → `public."Users"(id)` | Set via association |
| `created_at` | TIMESTAMP | AUTO | |
| `updated_at` | TIMESTAMP | AUTO | |

**Source:** `Backend/src/models/Course.js`

---

### Table: `public."CourseEnrollments"` (Sequelize tableName: `CourseEnrollments`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `user_id` | UUID | FK → `public."Users"(id)` | Set via belongsToMany association |
| `course_id` | UUID | FK → `public."Courses"(id)` | Set via belongsToMany association |
| `payment_status` | ENUM(`'pending'`, `'completed'`, `'failed'`) | DEFAULT `'pending'` | JS field: `paymentStatus` |
| `payment_id` | VARCHAR | NULL | Razorpay payment ID; JS field: `paymentId` |
| `created_at` | TIMESTAMP | AUTO | |
| `updated_at` | TIMESTAMP | AUTO | |

**Source:** `Backend/src/models/CourseEnrollment.js`

---

### Table: `public."Rooms"` (Sequelize tableName: `Rooms`) — LEGACY

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `name` | VARCHAR | NOT NULL | |
| `type` | ENUM(`'direct'`, `'group'`) | DEFAULT `'group'` | |
| `avatar_url` | VARCHAR | NULL | |
| `last_message` | TEXT | NULL | |
| `last_message_at` | TIMESTAMP | NULL | |
| `created_at` | TIMESTAMP | AUTO | |
| `updated_at` | TIMESTAMP | AUTO | |

> **Note:** This model exists in the codebase but appears to be superseded by `conversations`. The `socket/index.js` references `Room` and `RoomMember` without importing them, causing a potential runtime `ReferenceError`.

**Source:** `Backend/src/models/Room.js`

---

### Table: `public."RoomMembers"` (Sequelize tableName: `RoomMembers`) — LEGACY

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuidv4()` | |
| `room_id` | UUID | FK → `Rooms(id)` | |
| `user_id` | UUID | FK → `public."Users"(id)` | |
| `created_at` | TIMESTAMP | AUTO | |
| `updated_at` | TIMESTAMP | AUTO | |

**Source:** `Backend/src/models/RoomMember.js`

---

### Tables Referenced in Code But No Model Exists

| Table | Referenced In | Description |
|---|---|---|
| `public.workspaces` | `Backend/seed.js:29,52` | Multi-tenant workspace |
| `public.pinned_messages` | `interaction.controller.js:69` | Pinned message store |
| `public.polls` | `interaction.controller.js:150` | Poll metadata |
| `public.poll_options` | `interaction.controller.js:150` | Poll answer options |
| `public.poll_votes` | `interaction.controller.js:156` | User votes on polls |
| `auth.users` | `auth.routes.js:82`, `seed.js:35` | Supabase built-in auth table |

---

## 2. Data Quality & Anomaly Log

> **Context:** This project uses a seed script (`seed.js`) for initial data, not CSV import. The following documents validations that **are implemented**, **partially implemented**, or **missing**.

---

### Anomalies Currently Detected and Handled

#### A1 — Duplicate Email on Registration
- **Detection method:** `User.findOne({ where: { [Op.or]: [{ email }, { username }] } })` before insert (`auth.routes.js:42`)
- **Impact:** Would create duplicate accounts causing login ambiguity
- **Action taken:** Throws `ApiError.conflict('Email already registered')` → HTTP 409
- **Severity:** High
- **Status:** ✅ Detected and rejected

#### A2 — Duplicate Username on Registration
- **Detection method:** Same query as A1; `existingUser.email === email` check distinguishes the conflict
- **Impact:** Username collision breaks user search and DM flows
- **Action taken:** Throws `ApiError.conflict('Username already taken')` → HTTP 409
- **Status:** ✅ Detected and rejected

#### A3 — Invalid Email Format
- **Detection method:** `z.string().email()` in `signUpSchema` (Zod, `auth.routes.js:17`)
- **Impact:** Unreachable users; broken notification flows
- **Action taken:** `ApiError.badRequest('Validation failed', ...)` → HTTP 400 with Zod issues array
- **Status:** ✅ Detected and rejected

#### A4 — Weak Username Format
- **Detection method:** `z.string().min(3).regex(/^[a-z0-9_]+$/)` in `signUpSchema` (`auth.routes.js:20`)
- **Impact:** Usernames with spaces or capitals would break search queries
- **Action taken:** HTTP 400 with validation details
- **Status:** ✅ Detected and rejected

#### A5 — Already Enrolled Course Purchase
- **Detection method:** `CourseEnrollment.findOne({ where: { user_id, course_id, payment_status: 'completed' } })` (`course.routes.js:75`)
- **Impact:** Double-charges user; creates duplicate enrolment records
- **Action taken:** `ApiError.badRequest('You are already enrolled in this course.')` → HTTP 400
- **Status:** ✅ Detected and rejected

#### A6 — Invalid Razorpay Payment Signature
- **Detection method:** HMAC-SHA256 signature comparison using `crypto.createHmac` (`course.routes.js:120–126`)
- **Impact:** Fraudulent enrolment without payment
- **Action taken:** `ApiError.badRequest('Invalid payment signature')` → HTTP 400; enrolment not created
- **Status:** ✅ Detected and rejected

#### A7 — Expired Message Edit Window
- **Detection method:** Age check `ageMins > 15` (`message.controller.js:156`)
- **Impact:** Enables retroactive message manipulation
- **Action taken:** `ApiError(400, 'Message is too old to edit')`
- **Status:** ✅ Detected and rejected

#### A8 — Non-Member Sending Messages (REST)
- **Detection method:** `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2` (`message.controller.js:31`)
- **Impact:** Unauthorised message injection
- **Action taken:** HTTP 403
- **Status:** ✅ Detected and rejected

#### A9 — Non-Member Sending Messages (Socket)
- **Detection method:** Same membership check in `socket/index.js:123`
- **Impact:** Unauthorised message injection via WebSocket
- **Action taken:** `socket.emit('error', 'Not a member of this conv')`
- **Status:** ✅ Detected and rejected

#### A10 — Non-Admin Updating Group Details
- **Detection method:** Role check `adminCheck.rows[0].role !== 'admin'` (`chat.controller.js:330`)
- **Impact:** Unauthorised group modification
- **Action taken:** HTTP 403 `'Only admins can update group details'`
- **Status:** ✅ Detected and rejected

#### A11 — Empty Message Content (Socket)
- **Detection method:** `if (!content?.trim()) return;` (`socket/index.js:117`)
- **Impact:** Blank messages pollute conversation history
- **Action taken:** Silently dropped — no error emitted
- **Status:** ⚠️ Detected but no error feedback to sender

#### A12 — Expired Statuses
- **Detection method:** Cron job `Status.destroy({ where: { expires_at: { [Op.lt]: now } } })` (`cron.js:40`)
- **Impact:** Stale statuses remain visible
- **Action taken:** Hard-deleted every hour
- **Status:** ✅ Handled

#### A13 — Expired Disappearing Messages
- **Detection method:** Cron job `Message.update({ deleted_at, deleted_for: 'everyone', type: 'deleted' })` (`cron.js:14`)
- **Impact:** Disappearing messages remain visible after expiry
- **Action taken:** Soft-deleted (content nulled) every hour
- **Status:** ✅ Handled

#### A14 — Invalid Environment Variables on Startup
- **Detection method:** Zod schema `envSchema.safeParse(process.env)` in `config/env.js`
- **Impact:** App starts with misconfigured services
- **Action taken:** `process.exit(1)` with detailed error output
- **Status:** ✅ Detected at startup

---

### Anomalies Partially Detected

#### P1 — Empty Message Content (REST API)
- **Code:** `content?.trim() || ''` in `message.controller.js:115`
- **Issue:** Empty string `''` is inserted rather than rejected
- **Impact:** Empty messages can be persisted via the REST fallback
- **Recommended fix:** Validate `content` is non-empty before insert; return HTTP 400

#### P2 — Course Not Found During Payment Verification
- **Code:** `Course.findByPk(course_id)` after enrollment creation (`course.routes.js:137`)
- **Issue:** If `course_id` is invalid, `course.title` call will throw but enrollment is already committed
- **Impact:** Orphaned enrollment record; broken community chat creation
- **Recommended fix:** Validate `course_id` before creating the enrollment

---

### Potential Missing Validations

#### M1 — Password Minimum Length
- **Current:** `z.string().min(1)` (`auth.routes.js:25`)
- **Risk:** Single-character passwords are accepted
- **Recommended:** `z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)` for NIST compliance

#### M2 — No File Type Validation on Upload
- **Code:** `media.controller.js` — `multer` accepts any MIME type up to 100MB
- **Risk:** Executable files, oversized payloads, and malicious content can be uploaded
- **Recommended:** Validate `file.mimetype` against allowlist; reduce limit per type

#### M3 — No Rate Limiting on Socket Events
- **Code:** `socket/index.js` — `message:send` has no per-user throttle
- **Risk:** A connected user can spam thousands of messages per second
- **Recommended:** Implement socket-level rate limiting (e.g., token bucket per `user.id`)

#### M4 — SQL Injection Risk in Group Member Insert
- **Code:** `chat.controller.js:267` — dynamic `$${i+2}` placeholder construction
- **Current status:** Uses parameterised queries; risk is low but pattern is fragile
- **Recommended:** Use a library like `format` from `node-postgres` or a fixed-size parameterised query

#### M5 — No Validation on `emoji` Field Content Length
- **Code:** `interaction.controller.js:17` — only checks `if (!emoji)`
- **Risk:** Arbitrarily long strings could be inserted as emoji values
- **Recommended:** `emoji.length <= 10` check

#### M6 — `course_id` Not Validated in `/verify-payment`
- **Code:** `course.routes.js:113` — `course_id` from request body is trusted without format validation
- **Risk:** Malformed UUID could cause unhandled database errors
- **Recommended:** `z.string().uuid()` validation

#### M7 — No Duplicate DM Check in Group Add
- **Code:** `chat.controller.js:408–413` — uses `ON CONFLICT DO NOTHING` which silently ignores
- **Impact:** No error feedback when re-adding existing members
- **Recommended:** Check and return a conflict response

#### M8 — `search_vector` Column Unused
- **Code:** `Message` model defines `search_vector TSVECTOR` but `searchMessages` uses `ILIKE`
- **Risk:** At scale, `ILIKE` with wildcard prefix (`%q%`) performs sequential scans
- **Recommended:** Implement `to_tsvector`/`to_tsquery` full-text search using the existing column

---

### CSV Import — Not Applicable

> No CSV import pipeline exists in this project. The seed mechanism uses hardcoded JavaScript arrays inserted via raw SQL. If a CSV import requirement exists, the following would need validation:

| Anomaly | Detection Method Needed | Severity |
|---|---|---|
| Missing required columns (email, name) | Column presence check | Critical |
| Invalid email format in rows | Regex / library validation per row | High |
| Duplicate emails within CSV | In-memory Set dedup before insert | High |
| Duplicate emails against database | Bulk `SELECT` before `INSERT` | High |
| Invalid date fields | `Date.parse()` validation | Medium |
| Out-of-range numeric values (price < 0) | Range check | Medium |
| Malformed CSV rows (wrong column count) | Row length vs. header count | Medium |
| Encoding issues (non-UTF-8) | Buffer encoding check | Low |
| Empty file | Row count check | Low |
