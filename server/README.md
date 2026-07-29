# Aurex Backend API

Aurex is an AI-powered Developer Intelligence Platform that analyzes GitHub repositories and generates AI-powered engineering reports. This directory contains the Node.js + Express backend service foundation for Aurex.

## Technology Stack

- **Runtime**: Node.js (ES Modules, natively using `"type": "module"`)
- **Web Framework**: Express.js
- **Database Object Modeling**: Mongoose / MongoDB
- **Development Tooling**: Nodemon

## Architecture & Scalability

The project follows a **Clean Architecture** with a clear separation of concerns (MVC + Service Layer pattern):

- **`src/config/`**: System configuration, environment variables loader, database client initializers.
- **`src/controllers/`**: HTTP controllers mapped to business logic handlers.
- **`src/routes/`**: Express routers grouping endpoints by context.
- **`src/models/`**: Mongoose schemas and database models representing core data structures.
- **`src/middlewares/`**: Custom Express middlewares (authentication, validators, request logging, error handling).
- **`src/services/`**: Independent business logic tier decoupling databases from controllers.
- **`src/utils/`**: Shared helpers, custom classes (e.g., APIError), and common logic.
- **`src/validators/`**: Input validation definitions (e.g., using Joi/Zod schema validation).
- **`src/jobs/`**: Asynchronous background jobs and cron workers.

---

## Directory Layout

```text
server/
├── src/
│   ├── config/          # Configurations (db, environment variables)
│   ├── controllers/     # Controller handlers (MVC layer)
│   ├── routes/          # API route definitions
│   ├── models/          # Mongoose database schemas
│   ├── middlewares/     # Global/route-specific middlewares
│   ├── services/        # Business logic services (Service layer)
│   ├── utils/           # Shared utility classes/helpers
│   ├── validators/      # Schema-based request validators
│   ├── jobs/            # Queue workers and scheduled jobs
│   ├── app.js           # Express App configuration & middleware binding
│   └── server.js        # Server entry point & connection bootstrapper
│
├── .env.example         # System environment variables template
├── .gitignore           # Git ignore configurations
├── package.json         # Dependency manifests & npm scripts
└── README.md            # System documentation (this file)
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: `v18.x` or higher
- **MongoDB**: Active connection instance or URI

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment settings:
   Copy the template environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify database and port properties.

### Running the App

- **Development Mode** (with Nodemon hot-reload):
  ```bash
   npm run dev
   ```

- **Production Mode**:
  ```bash
   npm start
   ```

---

## Default API Endpoints

### Health Check
- **Route**: `GET /api/health`
- **Description**: Validate server uptime and connection status.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Aurex API is running"
  }
  ```
