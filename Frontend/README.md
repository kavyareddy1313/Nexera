# Nexera - Frontend

Nexera is a modern web application built with React and Vite. This repository contains the frontend client, which connects to the Nexera backend services.

## Tech Stack

- **Framework**: [React](https://react.dev/) 19
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router](https://reactrouter.com/)
- **Real-time Communication**: [Socket.io Client](https://socket.io/)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **Rich Text Editor**: [Tiptap](https://tiptap.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend Services**: [Supabase](https://supabase.com/)

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Ensure you configure the `.env` file with the required environment variables (e.g., API endpoints, Supabase keys) before starting the server.

### Running the Development Server

Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To create a production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

## Docker

The frontend application is containerized and can be run using Docker. A `docker-compose.yml` file is available in the root directory to spin up both the frontend and backend services together.

```bash
cd ..
docker-compose up -d
```

## Project Structure Highlights

- `src/`: Contains all the application source code (components, pages, stores, utils, etc.).
- `public/`: Static assets.
- `vite.config.js`: Configuration for the Vite bundler.
- `package.json`: Project dependencies and NPM scripts.