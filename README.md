# AI Agents Platform Web UI

This is the web UI for the AI Agents Platform, a workflow orchestration system for AI agents. The web UI offers a dynamic and interactive interface for managing and communicating with AI agents.

## Features

- **User Authentication**: Login/signup forms with protected routes.
- **Token Refresh**: Seamless authentication via token refresh mechanism.
- **Dynamic Agent Management**: List and manage AI agents (workflows) with support for dynamic agent selection via URL parameters.
- **Real-Time Chat**: Chat interface for interacting with agents.
- **Agent Preview Sidebar**: Automatically displays a preview sidebar with agent details when an agent is selected.
- **Agent Creation**: Create new agents through a dedicated interface.
- **File Upload & Management**: Upload and manage files.
- **Execution Tracking**: View execution history and details.
- **Next.js Middleware**: Integrated middleware for session refresh and authentication with Supabase.

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher (20.x LTS recommended)
- npm 9.6.7 or higher
- Backend API running (see main project README)

> **Note**: Next.js requires Node.js version "^18.18.0 || ^19.8.0 || >= 20.0.0". If you need to update your Node.js version, see [Node Version Management Guide](./NODE_VERSION_MANAGEMENT.md).

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with the following content:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

Replace the URL with your backend API URL if different.

### Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

To build the application for production:

```bash
npm run build
```

### Start Production Server

To start the production server:

```bash
npm run start
```

## Project Structure

- `src/app`: Next.js app router pages, including:
  - `src/app/login`: Login page
  - `src/app/signup`: Signup page
  - `src/app/create-agent`: Create Agent page
  - `src/app/auth/callback`: Authentication callback route
  - Other pages including the main chat interface.
- `src/components`: React components, including:
  - `src/components/ui`: UI components (buttons, inputs, dialogs, etc.)
  - `src/components/layout`: Layout components (header, sidebar, agent preview sidebar)
  - `src/components/chat`: Chat related components (chat interface)
  - `src/components/auth`: Authentication components (login/signup forms, protected routes)
- `src/lib`: Utility functions and API client.
  - `src/lib/api.ts`: API client with authentication and token refresh.
  - `src/lib/auth.ts`: Authentication utilities.
- `src/middleware.ts`: Next.js middleware for session refresh and authentication integration with Supabase.

## API Integration

The web UI integrates with the backend API using the API client in `src/lib/api.ts`. The client provides functions for:

- User authentication (login, signup, token refresh)
- Listing and managing agents
- Creating and managing chats
- Uploading and processing files
- Tracking executions and their details

## Authentication System

The web UI implements a comprehensive authentication system:

### Features

- **Login/Signup Forms**: User-friendly forms for authentication.
- **Token Management**: Secure storage and handling of JWT tokens.
- **Automatic Token Refresh**: Refreshes tokens before they expire.
- **Protected Routes**: Higher-order component to protect routes that require authentication.
- **Authentication Status**: Header component displays current authentication status.

### Implementation

- **Token Storage**: Tokens are stored in localStorage.
- **API Authentication**: All API requests include the authentication token.
- **Route Protection**: The `withAuth` HOC protects routes that require authentication.
- **Token Refresh**: Automatic token refresh when tokens are close to expiry.

## Styling

The project uses Tailwind CSS for styling, with a custom theme defined in `tailwind.config.ts` and global styles in `src/app/globals.css`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
