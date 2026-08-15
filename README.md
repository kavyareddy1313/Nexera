# Nexera — AI-Powered Learning Management System

> An AI-powered, full-stack Learning Management System with multi-provider LLMs, RAG knowledge base, real-time chat, and automated course generation.

![Node.js](https://img.shields.io/badge/Node.js-≥18.0-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-AI%20Engine-FF6600?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)

---

## Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [AI and RAG Architecture](#-ai-and-rag-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [AI API Reference](#-ai-api-reference)
- [Database Models](#-database-models)
- [Frontend Pages and Components](#-frontend-pages-and-components)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Contributing](#-contributing)

---

## Overview

**Nexera** is a production-grade, AI-augmented Learning Management System built for the modern web. It combines a **React 19 + Vite** frontend with a **Node.js + Express** backend, backed by **Supabase (PostgreSQL + pgvector)** and powered by a fully custom **LangChain RAG engine** that supports multiple LLM providers with automatic fallback.

Nexera is designed for three user roles — **Students**, **Instructors**, and **Admins** — each with dedicated dashboards, analytics, and AI tools.

### What makes Nexera unique

- **Multi-provider LLM factory** — Groq, Google Gemini, and OpenAI with automatic fallback and rate-limit recovery
- **Full RAG pipeline** — Upload documents → chunk → embed → vector search → stream grounded AI answers
- **AI Course Generator** — Automated multi-phase pipeline that generates full course curricula, lessons, quizzes, and resources from a single topic prompt
- **Real-time Chat** — Socket.io-powered messaging with emoji reactions, media support, and typing indicators
- **Live Classes and Whiteboard** — Meeting scheduling and collaborative whiteboard tools for instructors
- **Payments** — Razorpay integration for course purchases

---

## Core Features

### Student Features

| Feature | Description |
|---|---|
| Course Enrollment | Browse, search, and enroll in published courses |
| AI Study Assistant | Chat with an AI tutor grounded in uploaded course documents |
| Document Q&A | Upload personal PDFs/notes and ask questions with cited answers |
| Flashcard Generator | Auto-generate study flashcards from any document |
| MCQ Generator | Practice with auto-generated multiple-choice questions |
| Progress Tracking | Track completion across modules and lessons |
| Real-time Chat | Message instructors or peers with reactions and media sharing |

### Instructor Features

| Feature | Description |
|---|---|
| AI Course Generator | Generate complete courses from a topic prompt in minutes |
| Course Content Manager | Edit, preview, and publish AI-generated or manual courses |
| Live Class Scheduling | Schedule and manage live classes with calendar integration |
| Whiteboard Tool | Interactive whiteboard for live teaching sessions |
| Analytics Dashboard | View enrollment stats, revenue, and student progress |
| Certificate Management | Issue completion certificates to students |
| Reviews and Ratings | Monitor and respond to student feedback |

### Auth and Security

| Feature | Description |
|---|---|
| JWT Authentication | Access + refresh token strategy with rotation |
| Role-Based Access Control | Strict middleware for Student / Instructor / Admin roles |
| Rate Limiting | Redis-backed rate limiters per endpoint type |
| Helmet + CORS | Security headers and origin whitelisting |

---

## AI and RAG Architecture

Nexera's AI engine is a custom-built, production-ready **Retrieval-Augmented Generation (RAG)** system built on LangChain with a provider-agnostic LLM layer.

### RAG Pipeline Overview

```
User uploads document (PDF / DOCX / TXT / MD / CSV / JSON)
        |
        v
+---------------------+
|   Document Loaders  |  <-- Format-specific parsers (pdf-parse, mammoth, csv-parse)
+---------------------+
        |
        v
+---------------------+
|   Text Splitter     |  <-- Recursive / Token / Semantic chunking strategies
+---------------------+
        |
        v
+---------------------------------+
|  Embedding Service              |
|  (Gemini text-embedding-004 /   |
|   OpenAI text-embedding-3-small)|
+---------------------------------+
        |
        v
+----------------------------------+
|  Supabase pgvector Store         |  <-- Vector similarity search (cosine distance)
|  (document_chunks table)         |
+----------------------------------+
        |  (at query time)
        v
+---------------------------------------+
|  Hybrid Retriever (RRF Fusion)        |
|  - Dense vector search (semantic)     |
|  - Sparse BM25 keyword matching       |
|  - Reciprocal Rank Fusion scoring     |
+---------------------------------------+
        |
        v
+----------------------------------+
|  RAG Chain (LangChain)           |
|  - Chat history memory (8 turns) |
|  - Prompt template injection     |
|  - SSE token streaming           |
|  - Citation extraction           |
+----------------------------------+
        |
        v
   AI Response with citations --> Frontend (NexeraAiPanel)
```

### LLM Factory — Multi-Provider with Automatic Fallback

`LlmFactory` (`Backend/src/services/ai/llm/llmFactory.js`) is the core LLM abstraction layer:

- **Supported Providers**: Groq (primary, `llama3-70b`), Google Gemini, OpenAI GPT
- **Fallback Order**: `groq → gemini → openai`
- **Rate Limit Handling**: Detects HTTP 429 errors, parses retry delay from response headers, waits and retries (up to 3x for Groq)
- **Structured Output**: `invokeStructured()` method with Zod schema validation and automatic retry on parse failure
- **Caching**: Model instances are cached by `provider_model_temperature_streaming` key

```js
// Example: Invoke with automatic provider fallback
const result = await LlmFactory.invokeWithFallback(
  (llm) => promptTemplate.pipe(llm).pipe(new StringOutputParser()),
  { question: "...", context: "..." },
  { primaryProvider: 'groq' }
);
```

### AI Course Generator Pipeline

The **AI Course Generator** is a multi-phase asynchronous pipeline that automatically builds a complete course curriculum:

```
POST /api/ai/course-generator/generate
        |
        v
  Job Record Created (CourseGenerationJob)
        |
        v  (async, non-blocking)
+----------------------------------------+
|  Orchestrator (orchestrator.js)        |
|                                        |
|  Phase 1: Outline Generation           |
|   └─ outlineChain.js                   |
|      - LLM generates structured        |
|        module/lesson outline           |
|                                        |
|  Phase 2: Lesson Content Generation    |
|   └─ contentChain.js                   |
|      - Full markdown lesson content    |
|      - Key takeaways per lesson        |
|      - Learning objectives             |
|                                        |
|  Phase 3: Quiz Generation              |
|   └─ quizChain.js                      |
|      - MCQ questions per lesson        |
|      - Correct answers + explanations  |
|                                        |
|  Phase 4: Resource Linking             |
|   └─ resourceLinker.js                 |
|      - YouTube video suggestions       |
|      - External reading links          |
|                                        |
|  Phase 5: Bundle Assembly              |
|   └─ bundleAssembler.js               |
|      - Saves Course, Modules,          |
|        Lessons, Quizzes to DB          |
+----------------------------------------+
        |
        v
  status = 'draft_ready'
  Frontend polls GET /generate/:jobId --> Redirects to Draft Editor
```

### Document Actions (Streaming)

The `/api/ai/document/action` endpoint supports these pre-built prompt actions streamed via SSE:

| Action | Description |
|---|---|
| `summarize` | Comprehensive document summary |
| `explain_beginner` | Explains concepts for beginners / like a 10-year-old |
| `explain_expert` | Expert-level technical deep-dive |
| `key_points` | Top 10 most important points |
| `flashcards` | 10 Q&A flashcards for study |
| `mcq` | 5 MCQ questions with explanations |
| `interview` | 5 interview questions from document content |

### Supported File Formats

| Format | Loader | Notes |
|---|---|---|
| PDF | `pdf-parse` | Multi-page, metadata extraction |
| DOCX | `mammoth` | Word document converter |
| TXT / MD | Native | Plain text and Markdown |
| CSV | `csv-parse` | Row-by-row ingestion |
| JSON | Native | Structured data indexing |

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js >=18 + Express 4** | REST API server |
| **LangChain** (`@langchain/core`, `@langchain/openai`, `@langchain/google-genai`, `@langchain/community`) | AI/RAG orchestration |
| **Groq API** | Primary LLM provider (llama3-70b-8192) |
| **Google Gemini API** | Secondary LLM + embeddings |
| **OpenAI API** | Tertiary LLM + embeddings |
| **Supabase** | PostgreSQL database + pgvector extension |
| **Sequelize ORM** | Database models and migrations |
| **Socket.io** | Real-time WebSocket communication |
| **Multer** | File upload handling (up to 25MB) |
| **Razorpay** | Payment processing |
| **Redis / ioredis** | Rate limiting and session caching |
| **Winston** | Structured logging |
| **Helmet + CORS** | Security hardening |
| **Zod** | Runtime schema validation |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **pdf-parse / mammoth** | Document parsing |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19 + Vite 8** | UI framework and build tool |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations and micro-interactions |
| **Zustand 5** | Global state management |
| **TanStack Query 5** | Server state and caching |
| **Socket.io-client** | Real-time chat connection |
| **TipTap Editor** | Rich text editing |
| **react-markdown + remark-gfm** | Markdown rendering with syntax highlighting |
| **react-dropzone** | Drag-and-drop file upload |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **react-router-dom 7** | Client-side routing |

### Infrastructure and DevOps

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization |
| **Jenkins** | CI/CD pipeline |
| **Supabase** | Managed PostgreSQL + pgvector + Auth |
| **Cloudinary** | Image and video CDN |
| **Render** | Backend cloud deployment |
| **Vercel** | Frontend deployment |

---

## Project Structure

```
Nexera-main/
├── Backend/
│   ├── src/
│   │   ├── app.js                              # Express app entry, middleware setup
│   │   ├── config/
│   │   │   ├── ai.config.js                   # LLM provider config (models, temps, tokens)
│   │   │   └── supabaseClient.js              # Supabase admin + anon clients
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js             # JWT verification and RBAC guards
│   │   │   ├── errorHandler.js                # Global error handler
│   │   │   ├── rateLimit.js                   # Redis-backed rate limiters
│   │   │   └── requestLogger.js               # Winston request tracing
│   │   ├── models/
│   │   │   ├── User.js                        # User model (Student/Instructor/Admin)
│   │   │   ├── Course.js                      # Course model
│   │   │   ├── CourseModule.js                # Module model
│   │   │   ├── CourseLesson.js                # Lesson model (markdown content)
│   │   │   ├── CourseQuiz.js                  # Quiz/MCQ model
│   │   │   ├── CourseGenerationJob.js         # Async AI generation job tracker
│   │   │   ├── AiDocument.js                  # Uploaded document metadata
│   │   │   ├── Conversation.js                # Chat conversation model
│   │   │   ├── Message.js                     # Chat message model
│   │   │   └── index.js                       # Sequelize model registry
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   │   ├── ai.controller.js           # RAG upload, chat, search, summarize
│   │   │   │   ├── ai.routes.js               # AI API routes (auth-protected)
│   │   │   │   ├── course.generator.controller.js
│   │   │   │   └── course.generator.routes.js
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js             # Login, register, refresh, reset
│   │   │   │   └── auth.validators.js         # Zod input validation
│   │   │   ├── chat/
│   │   │   │   ├── chat.controller.js         # Conversation and message management
│   │   │   │   ├── message.controller.js      # CRUD for messages
│   │   │   │   └── chat.routes.js
│   │   │   ├── courses/
│   │   │   │   └── course.routes.js           # Course CRUD, enrollment, content
│   │   │   ├── media/
│   │   │   │   └── media.routes.js            # File/video upload endpoints
│   │   │   └── meetings/
│   │   │       └── meetings.routes.js         # Live class scheduling
│   │   ├── services/
│   │   │   └── ai/
│   │   │       ├── llm/
│   │   │       │   └── llmFactory.js          # Multi-provider LLM factory (Groq/Gemini/OpenAI)
│   │   │       ├── embeddings/
│   │   │       │   ├── embeddingService.js    # Provider-aware embedding selector
│   │   │       │   ├── geminiEmbeddings.js    # Google text-embedding-004
│   │   │       │   └── openaiEmbeddings.js    # OpenAI text-embedding-3-small
│   │   │       ├── loaders/
│   │   │       │   ├── index.js               # Universal document loader dispatcher
│   │   │       │   ├── pdfLoader.js           # PDF parsing (pdf-parse)
│   │   │       │   ├── docxLoader.js          # DOCX parsing (mammoth)
│   │   │       │   ├── csvLoader.js           # CSV parsing (csv-parse)
│   │   │       │   ├── jsonLoader.js          # JSON ingestion
│   │   │       │   └── textLoader.js          # TXT/MD plain text
│   │   │       ├── splitters/
│   │   │       │   └── splitterService.js     # Recursive/Token/Semantic chunking
│   │   │       ├── vectorstores/
│   │   │       │   ├── supabaseVectorStore.js # pgvector CRUD + cosine similarity
│   │   │       │   └── vectorStoreService.js  # Vector store abstraction
│   │   │       ├── retrievers/
│   │   │       │   └── retrieverService.js    # Hybrid RRF (dense + BM25) retrieval
│   │   │       ├── chains/
│   │   │       │   ├── ragChain.js            # RAG chain: retrieve -> prompt -> stream
│   │   │       │   ├── summarizerChain.js     # Transcript summarization chain
│   │   │       │   └── prompts.js             # Prompt templates (RAG, summarize)
│   │   │       ├── memory/
│   │   │       │   └── memoryService.js       # Conversation memory (8-turn window)
│   │   │       └── courseGeneration/
│   │   │           ├── orchestrator.js        # Multi-phase async pipeline runner
│   │   │           ├── outlineChain.js        # LLM -> course outline structure
│   │   │           ├── contentChain.js        # LLM -> lesson markdown content
│   │   │           ├── quizChain.js           # LLM -> MCQ quiz generation
│   │   │           ├── resourceLinker.js      # LLM -> YouTube + external links
│   │   │           ├── bundleAssembler.js     # Saves full course bundle to DB
│   │   │           └── courseRagService.js    # RAG-enhanced course content enrichment
│   │   ├── socket/                            # Socket.io event handlers
│   │   └── utils/
│   │       ├── asyncHandler.js                # Express async error wrapper
│   │       ├── ApiResponse.js                 # Standardized API response format
│   │       └── ApiError.js                    # Custom error class with HTTP codes
│   ├── prisma/
│   │   └── schema.prisma                      # Prisma schema (reference)
│   ├── uploads/                               # Local file upload storage
│   ├── seed.js                                # Database seed script
│   ├── Dockerfile
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── App.jsx                            # Root app with routing
    │   ├── main.jsx                           # React entry point
    │   ├── api/                               # Axios API client modules
    │   ├── components/
    │   │   ├── ai/
    │   │   │   ├── NexeraAiPanel.jsx          # Full AI chat panel (upload, chat, actions)
    │   │   │   └── AiFloatingButton.jsx       # Global floating AI assistant trigger
    │   │   ├── instructor/
    │   │   │   ├── InstructorWorkspace.jsx
    │   │   │   ├── InstructorCourses.jsx
    │   │   │   ├── InstructorAnalytics.jsx
    │   │   │   ├── InstructorRevenue.jsx
    │   │   │   ├── InstructorStudents.jsx
    │   │   │   ├── InstructorLiveClasses.jsx
    │   │   │   ├── InstructorCalendar.jsx
    │   │   │   ├── InstructorMessages.jsx
    │   │   │   ├── InstructorNotifications.jsx
    │   │   │   ├── InstructorCertificates.jsx
    │   │   │   ├── InstructorReviews.jsx
    │   │   │   ├── InstructorSettings.jsx
    │   │   │   └── wizard/                    # Course generator wizard steps
    │   │   ├── chat/                          # Real-time chat components
    │   │   ├── dashboard/                     # Student dashboard widgets
    │   │   ├── layout/                        # Page layouts and wrappers
    │   │   └── profile/                       # User profile components
    │   ├── pages/
    │   │   ├── LandingPage.jsx                # Marketing landing page
    │   │   ├── AuthPage.jsx                   # Login / Register / OAuth
    │   │   ├── AiDocumentsPage.jsx            # Document library and upload UI
    │   │   ├── AiWorkspaceViewer.jsx          # AI document workspace (PDF + chat)
    │   │   ├── CourseGeneratorWizard.jsx      # Step-by-step AI course builder
    │   │   ├── CourseDetails.jsx              # Course content viewer (student)
    │   │   ├── CourseContentManager.jsx       # Instructor lesson editor
    │   │   ├── CoursesExplore.jsx             # Course catalog / search
    │   │   ├── ChatPage.jsx                   # Main real-time chat page
    │   │   ├── DashboardPage.jsx              # Student dashboard
    │   │   └── AdminDashboard.jsx             # Admin panel
    │   ├── store/                             # Zustand global state stores
    │   ├── context/                           # React context providers
    │   ├── lib/                               # Utility helpers
    │   └── layouts/                           # Shared page layouts
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18.0 or higher
- **npm** v9+
- **Supabase** project (with pgvector extension enabled)
- **Redis** instance (local or cloud)
- At least one LLM API key: **Groq** (free tier available), **Gemini**, or **OpenAI**

### Environment Variables

#### Backend — `Backend/.env`

```env
# Server
PORT=4000
NODE_ENV=development

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres

# Supabase (for vector store and admin operations)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# CORS
FRONTEND_URL=http://localhost:5173

# Cloudinary (media storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Redis
REDIS_URL=redis://localhost:6379

# AI / LLM Providers (set primary: groq | gemini | openai)
AI_LLM_PROVIDER=groq

# Groq (Primary — fast and free tier available)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini (Secondary LLM + Embeddings)
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI (Tertiary LLM + Embeddings)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Frontend — `Frontend/.env`

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Note:** Enable the pgvector extension in Supabase before running:
> ```sql
> CREATE EXTENSION IF NOT EXISTS vector;
> ```

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Nexera.git
cd Nexera-main

# 2. Install and start the Backend
cd Backend
npm install
cp .env.example .env        # Fill in your environment variables
npm run dev                 # Starts on http://localhost:4000

# 3. Install and start the Frontend (new terminal)
cd ../Frontend
npm install
npm run dev                 # Starts on http://localhost:5173

# 4. (Optional) Seed the database
cd ../Backend
npm run db:seed
```

### Docker Deployment

```bash
# Start both containers
docker-compose up -d

# Backend: http://localhost:4000
# Frontend: http://localhost:80
```

Build and push your own images:

```bash
# Backend
cd Backend
docker build -t your-dockerhub/nexera-backend:latest .
docker push your-dockerhub/nexera-backend:latest

# Frontend
cd ../Frontend
docker build -t your-dockerhub/nexera-frontend:latest .
docker push your-dockerhub/nexera-frontend:latest
```

---

## AI API Reference

All AI endpoints are protected by `authMiddleware` and live under `/api/ai`.

### Document Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/upload` | Upload file (PDF/DOCX/TXT/MD/CSV/JSON) → chunk → embed → store in pgvector |
| `POST` | `/api/ai/ingest-text` | Ingest raw text/notes directly into the vector knowledge base |

**Upload Request** (`multipart/form-data`):

```
file:          [binary file, max 25MB]
workspaceId:   "workspace_123"   (optional)
strategy:      "recursive"       (recursive | token | semantic)
chunkSize:     1000              (optional, default 1000)
chunkOverlap:  200               (optional, default 200)
```

### RAG Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat/stream` | Streaming SSE RAG chat with real-time token output |
| `POST` | `/api/ai/chat` | Standard JSON RAG chat (non-streaming) |

**Request Body:**

```json
{
  "question": "What is the main topic of this document?",
  "sessionId": "session_abc123",
  "workspaceId": "workspace_123",
  "filter": { "fileName": "lecture_notes.pdf" }
}
```

**SSE Stream Events:**

```
data: {"type": "citations", "data": [...]}
data: {"type": "token", "data": "Answer"}
data: {"type": "token", "data": " text"}
data: {"type": "done"}
```

### Document Actions (Streaming)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/document/action` | Run a preset AI action on a document (SSE stream) |

**Request Body:**

```json
{
  "documentId": "doc_123",
  "action": "flashcards",
  "userId": "user_456"
}
```

Available actions: `summarize` · `explain_beginner` · `explain_expert` · `key_points` · `flashcards` · `mcq` · `interview`

### Knowledge Base

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/search` | Hybrid vector + keyword search (returns top-k chunks) |
| `GET` | `/api/ai/documents` | List all documents indexed by the current user |
| `DELETE` | `/api/ai/documents/:documentId` | Delete document from DB and vector store |
| `POST` | `/api/ai/summarize` | Summarize a raw text transcript |

### AI Course Generator

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/course-generator/generate` | Start async course generation pipeline |
| `GET` | `/api/ai/course-generator/generate/:jobId` | Poll job status and progress |
| `POST` | `/api/ai/course-generator/generate/:jobId/retry` | Retry a failed job |
| `GET` | `/api/ai/course-generator/courses/:courseId/draft` | Get full generated course draft |
| `PATCH` | `/api/ai/course-generator/courses/:courseId/lessons/:lessonId` | Edit a generated lesson |
| `POST` | `/api/ai/course-generator/courses/:courseId/publish` | Validate and publish course |

**Generate Course Request Body:**

```json
{
  "topic": "Introduction to Machine Learning",
  "targetAudience": "Beginners with Python knowledge",
  "difficulty": "Beginner",
  "moduleCount": 4,
  "lessonsPerModule": 3,
  "language": "English",
  "quizCount": 3,
  "additionalInstructions": "Include hands-on coding examples",
  "category": "Technology",
  "tags": ["AI", "Python", "Data Science"]
}
```

**Job Status Response:**

```json
{
  "jobId": "uuid-xxx",
  "status": "draft_ready",
  "currentStage": "bundle_assembly",
  "progressDetail": "Saving course to database...",
  "courseId": "course-uuid"
}
```

---

## Database Models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Learners, instructors, and admins |
| `Course` | `courses` | Course metadata, status, pricing |
| `CourseModule` | `course_modules` | Ordered modules within a course |
| `CourseLesson` | `course_lessons` | Lesson content (Markdown), YouTube links, takeaways |
| `CourseQuiz` | `course_quizzes` | MCQ questions with options and explanations |
| `CourseEnrollment` | `course_enrollments` | Student enrollment records |
| `CourseGenerationJob` | `course_generation_jobs` | AI pipeline job status tracker |
| `AiDocument` | `ai_documents` | Uploaded document metadata |
| `Conversation` | `conversations` | Chat conversations |
| `ConversationMember` | `conversation_members` | Users in a conversation |
| `Message` | `messages` | Individual chat messages |
| `MessageReaction` | `message_reactions` | Emoji reactions on messages |
| `MessageStatus` | `message_statuses` | Read receipts |
| `RefreshToken` | `refresh_tokens` | JWT refresh token store |
| `PasswordResetToken` | `password_reset_tokens` | Reset token management |
| `Status` | `statuses` | User status updates (story-like) |

> **Vector Store**: The `document_chunks` table in Supabase stores embedding vectors using the pgvector extension with a cosine similarity index.

---

## Frontend Pages and Components

### Pages

| Page | Route | Description |
|---|---|---|
| `LandingPage` | `/` | Marketing homepage |
| `AuthPage` | `/auth` | Login / Register / Forgot Password |
| `DashboardPage` | `/dashboard` | Student home dashboard |
| `CoursesExplore` | `/courses` | Public course catalog and search |
| `CourseDetails` | `/courses/:id` | Course viewer with module player |
| `ChatPage` | `/chat` | Real-time messaging interface |
| `AiDocumentsPage` | `/ai/documents` | AI document library management |
| `AiWorkspaceViewer` | `/ai/workspace/:id` | Split view: document + AI chat panel |
| `CourseGeneratorWizard` | `/instructor/generate` | Multi-step AI course generator UI |
| `CourseContentManager` | `/instructor/courses/:id/edit` | Lesson and quiz editor |
| `InstructorDashboard` | `/instructor` | Instructor home with analytics |
| `AdminDashboard` | `/admin` | Platform admin panel |

### Key AI Components

**`NexeraAiPanel`** (`src/components/ai/NexeraAiPanel.jsx`)
- Full-featured AI assistant panel
- Document upload with drag-and-drop
- Real-time SSE-streamed chat with citation bubbles
- Document action toolbar (flashcards, MCQ, summary, etc.)
- Chat history with multi-turn memory

**`AiFloatingButton`** (`src/components/ai/AiFloatingButton.jsx`)
- Global floating button to open the AI assistant from any page
- Context-aware positioning; remembers last session

**`CourseGeneratorWizard`** (`src/pages/CourseGeneratorWizard.jsx`)
- Step 1: Topic, difficulty, audience, language selection
- Step 2: Module and lesson count, additional instructions
- Step 3: Real-time generation progress with stage indicators
- Step 4: Draft review, inline editing, and publish

---

## CI/CD Pipeline

Nexera uses a Jenkins-based CI/CD pipeline defined in `Jenkinsfile`:

```
Push to main branch
      |
      v
Jenkins Pipeline
  Stage 1: Checkout
  Stage 2: Install Dependencies (Backend + Frontend)
  Stage 3: Run Linting
  Stage 4: Build Frontend (vite build)
  Stage 5: Docker Build (backend + frontend images)
  Stage 6: Push to Docker Hub
  Stage 7: Deploy via docker-compose
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request
---------------------------------------------------------------------

 *** This is the overall project ***