# Nexera

> A full-stack, real-time collaboration and e-learning platform. Nexera combines the instant communication features of Slack/Discord with the structured course delivery of a Learning Management System (LMS) into a single, unified workspace.

[![CI/CD Pipeline](https://github.com/kavyareddy1313/Nexera/actions/workflows/ci.yml/badge.svg)](https://github.com/kavyareddy1313/Nexera/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-lightblue)
![Docker](https://img.shields.io/badge/Docker-Containerised-blue)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Directory Structure](#directory-structure)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development Setup](#local-development-setup)
  - [Docker Setup](#docker-setup)
- [CI/CD & Deployment](#cicd--deployment)

---

## Project Overview

Nexera is designed to solve the fragmentation of modern remote collaboration and learning. Instead of switching between different tools for chat (Slack), meetings (Zoom), and courses (Udemy/LMS), Nexera brings everything under one roof:
- **Automatic Group Chats**: Purchasing a course automatically adds the student to a real-time course discussion channel.
- **Rich Media Sharing**: Share images, video, and audio with automatic waveform extraction.
- **Collaborative Whiteboard**: Draw and brainstorm together on a shared canvas in real time.

---

## Key Features

*   **JWT Authentication**: Secure registration/login using bcrypt password hashing and Zod schema validations.
*   **Real-Time Chat**: Direct messages (DMs) and group channels powered by Socket.IO with typing indicators, online presence, and delivery/read receipts.
*   **WhatsApp-Parity Chat Features**: Reply-to, forward, edit messages (15-minute window), delete-for-everyone, emoji reactions, and message pinning.
*   **Rich Media Uploads**: Image compression (Sharp) and audio/video waveform processing, uploaded directly to Supabase Storage.
*   **Course Marketplace**: Interactive marketplace with Razorpay payment gateway integration and automatic course community enrollment upon successful purchase.
*   **Collaborative Whiteboard**: Dedicated real-time drawing canvas using Socket.IO events.
*   **Redis Caching**: Improved query performance for conversation lists and initial messages (invalidated automatically on new messages or membership updates).
*   **Scheduled Cleanups**: Hourly cron jobs to remove expired statuses (24h expiry) and disappearing messages.

---

## Architecture & Tech Stack

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

### Frontend
- **Framework**: React 19 + Vite
- **State Management**: Zustand
- **Routing**: React Router 7
- **Data Fetching**: TanStack React Query + Axios
- **Real-Time Client**: Socket.IO Client
- **Styling & UI**: TailwindCSS + Framer Motion
- **Rich Text Message Editor**: Tiptap
- **Performance**: TanStack Virtual (virtualized message list rendering)

### Backend
- **Runtime**: Node.js & Express
- **Real-Time Server**: Socket.IO
- **Database Access**: Sequelize ORM (for models & associations) & Raw `pg` client (for performance-critical chat queries)
- **Caching & Storage**: Redis (ioredis) & Supabase Storage (via SDK)
- **Validation & Security**: Zod, bcryptjs, Helmet, and express-rate-limit
- **Media Processing**: Sharp (images) & Fluent-FFmpeg (audio/video waveform extraction)
- **Scheduled Jobs**: node-cron

---

## Directory Structure

```
Nexera-main/
├── Backend/               # Express backend application
│   ├── src/               # Application source code
│   │   ├── config/        # Environment and service configurations
│   │   ├── middleware/    # Auth, rate-limiter, and error handlers
│   │   ├── modules/       # Domain modules (auth, chat, courses, etc.)
│   │   └── socket/        # Socket.IO connection and event handlers
│   ├── Dockerfile         # Backend Docker configuration
│   ├── seed.js            # Database seeder script
│   └── package.json       # Backend dependencies and scripts
├── Frontend/              # React single page application (SPA)
│   ├── src/               # React components, pages, stores, hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Chat, Course, Auth, etc.)
│   │   └── store/         # Zustand global state stores
│   ├── Dockerfile         # Frontend Docker configuration
│   └── package.json       # Frontend dependencies and scripts
├── docker-compose.yml     # Multi-container local deployment orchestrator
└── README.md              # Main documentation file
```

---

## Database Design

The relational database is hosted on PostgreSQL (Supabase) and comprises the following tables:
- **`public.Users`**: Sequelize-managed user accounts with credentials.
- **`public.profiles`**: Public profile details (avatar, online status, colors, etc.).
- **`public.conversations`**: DMs and group channels.
- **`public.conversation_members`**: Membership join table (mapping users to channels, roles, pin status, and unread count).
- **`public.messages`**: Message history (including parent replies and forwards).
- **`public.message_status`**: Delivery and read tracking per recipient.
- **`public.message_reactions`**: User emoji reactions.
- **`public.statuses`**: Ephemeral user stories/status updates with auto-expiry.
- **`public.Courses`**: Course catalog (price, description, levels).
- **`public.CourseEnrollments`**: Records of course enrollments tied to Razorpay transactions.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Docker & Docker Compose (optional, for containerized run)
- A Supabase project (for Database & Storage)
- A Redis instance

### Environment Variables

#### Backend (`Backend/.env`)
Create a `.env` file in the `Backend/` folder with the following variables:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=your_postgresql_supabase_connection_string
JWT_SECRET=your_jwt_signing_secret
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Frontend (`Frontend/.env`)
Create a `.env` file in the `Frontend/` folder with the following variables:
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

---

## Local Development Setup

### Running Backend Locally
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server in development mode:
   ```bash
   npm run dev
   ```

### Running Frontend Locally
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

### Seeding the Database
To populate your database with initial sample data (users, group chats, messages):
```bash
cd Backend
npm run db:seed
```
*Note: The password for all seeded users is `Nexera@123`.*

---

## Docker Setup

To spin up the entire application stack including the frontend, backend, database sync, and Redis using Docker:
```bash
# From the root directory
docker-compose up -d
```
The application will be accessible at:
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:4000`

---

## CI/CD & Deployment

- **GitHub Actions**: Configured via `.github/workflows/` for automated integration tests, building Docker images, and deploying to production.
- **Jenkins**: A declarative `Jenkinsfile` is provided at the root to automate builds and trigger deployments on a VPS.
- **Platform Configurations**:
  - `render.yaml` for alternative API deployment on Render.
  - `vercel.json` for frontend deployment on Vercel.