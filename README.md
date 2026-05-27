# Nexera

Nexera is a comprehensive, full-stack real-time collaboration and learning platform. Designed to seamlessly integrate communication, education, and teamwork, Nexera provides a unified space for users to chat, attend courses, collaborate on whiteboards, and join meetings.

## Table of Contents

- [Project Description](#project-description)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack & Tools](#tech-stack--tools)
- [Workflows & Core Modules](#workflows--core-modules)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Future Scope](#future-scope)
- [Conclusion](#conclusion)

---

## Project Description

Nexera bridges the gap between a learning management system (LMS) and a real-time communication tool like Slack or Discord. It enables instructors to host and sell courses while automatically creating dedicated community channels for enrolled students. Alongside courses, it provides robust real-time direct messaging, group chats, interactive whiteboarding, and video/audio meetings, making it an all-in-one workspace solution.

## Key Features

- **Robust Authentication**: Secure user registration and login using JWT and Supabase.
- **Real-Time Messaging**: WhatsApp-parity chat features including Direct Messages (DMs), group channels, typing indicators, online presence, and read receipts powered by Socket.io.
- **Course Management & Monetization**: Browse, purchase, and enroll in courses. Seamless payment gateway integration via Razorpay.
- **Auto-Community Enrollment**: Purchasing a course automatically adds the student to the course's exclusive real-time group chat.
- **Interactive Whiteboards**: Real-time collaborative canvas for brainstorming and visual teamwork.
- **Virtual Meetings**: Integrated video and audio meeting capabilities.
- **Media Management**: Support for rich media sharing and secure file uploads within chats and courses.

## Architecture

Nexera utilizes a decoupled client-server architecture, containerized with Docker for seamless deployment and scaling.

- **Client Layer (Frontend)**: A Single Page Application (SPA) built with React and Vite. It manages complex local state using Zustand and handles data fetching/caching with React Query. Real-time updates are pushed via WebSockets.
- **API Layer (Backend)**: A Node.js and Express server providing RESTful endpoints for CRUD operations and authentication. It validates requests using Zod and interacts with the database via Sequelize ORM.
- **Real-Time Layer**: A dedicated Socket.io server integrated within the Node.js app handles all low-latency bidirectional communication for chats, presence, and whiteboards.
- **Data Layer**: PostgreSQL (managed via Supabase) serves as the primary relational database. Redis is utilized for caching and managing transient real-time states (like rate-limiting or session management).

## Tech Stack & Tools

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Real-Time**: [Socket.io Client](https://socket.io/)
- **Rich Text / UI**: [Tiptap](https://tiptap.dev/), [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Real-Time Server**: [Socket.io](https://socket.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **ORM**: [Sequelize](https://sequelize.org/)
- **Caching**: [Redis](https://redis.io/)
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Validation**: [Zod](https://zod.dev/)

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Linting & Formatting**: ESLint

## Workflows & Core Modules

1. **User Onboarding**: Users register with secure credentials. Upon registration, their profiles are synced across the relational DB and real-time presence stores.
2. **Communication Flow**: Users can search for peers and initiate DMs or create group channels. The Socket.io layer broadcasts messages, typing events, and read receipts instantly to connected clients while persisting data via Express to Postgres.
3. **E-Learning & Monetization**: Instructors list courses. A student initiates a purchase, triggering a Razorpay order. Upon successful payment verification webhook/callback, the student is granted course access and auto-added to the course's community Socket room.
4. **Collaboration**: Users can spin up temporary or persistent whiteboard sessions and virtual meetings directly from their chat channels or course dashboards.

## Repository Structure

```text
Nexera/
├── Frontend/           # React SPA application
│   ├── src/            # Components, pages, stores, and API hooks
│   ├── public/         # Static assets
│   └── package.json
├── Backend/            # Node.js/Express server
│   ├── src/
│   │   ├── modules/    # Domain-driven features (auth, chat, courses, etc.)
│   │   ├── socket/     # Real-time event handlers
│   │   ├── models/     # Sequelize database models
│   │   └── middleware/ # Custom Express middlewares (auth, rate limiting)
│   └── package.json
└── docker-compose.yml  # Orchestrates both services and networking
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Docker & docker-compose (optional, but recommended)
- A Supabase project (for Postgres database)
- Razorpay API keys (for course payments)

### Docker Setup (Recommended)

The easiest way to spin up the entire stack is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/Nexera.git
cd Nexera

# Start all services in detached mode
docker-compose up -d
```
The frontend will be accessible at `http://localhost:80` and the backend API at `http://localhost:4000`.

### Manual Setup

If you prefer running services locally for development:

1. **Backend**:
   ```bash
   cd Backend
   npm install
   # Copy .env.example to .env and fill in your Supabase DB URL, JWT secrets, and Razorpay keys
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd Frontend
   npm install
   # Configure your .env with the VITE_API_URL pointing to your local backend
   npm run dev
   ```

## Future Scope

- **AI Integration**: Implement AI-driven course recommendations and a virtual teaching assistant chatbot.
- **Mobile Application**: Port the React web application to React Native for native iOS and Android experiences.
- **Advanced Analytics**: Dashboards for instructors to track student engagement, video watch times, and assessment scores.
- **WebRTC Upgrades**: Enhance the meeting module with screen sharing, recording, and lower-latency peer-to-peer WebRTC connections.
- **Gamification**: Introduce badges, leaderboards, and certificates for course completions.

## Conclusion

Nexera is built to showcase the power of modern web technologies in creating a cohesive, low-latency, and feature-rich platform. By combining the social and instant aspects of chat applications with the structured knowledge delivery of an LMS, it provides a unique environment where learning and collaboration happen simultaneously.
it is a devops project