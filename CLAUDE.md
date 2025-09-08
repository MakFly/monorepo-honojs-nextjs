# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a monorepo containing two main applications:

- **web** (`apps/web/`): Next.js 15 RC frontend application with Tailwind CSS, TypeScript, and BetterAuth integration
- **auth-service** (`apps/auth-service/`): Hono-based authentication service using BetterAuth, Prisma ORM, and PostgreSQL

The architecture uses BetterAuth for authentication across both applications, with the auth service running on port 4001 and the web app on port 3000.

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start all services in development mode
pnpm dev

# Start individual services
cd apps/web && pnpm dev          # Next.js app on :3000
cd apps/auth-service && pnpm dev # Hono API on :4001

# Format code
pnpm format
```

### Build & Lint
```bash
# Build all applications
pnpm build

# Lint all applications
pnpm lint
```

### Database Operations
```bash
# Start PostgreSQL database
docker compose up -d db

# Run migrations (from auth-service directory)
cd apps/auth-service
pnpm ba:migrate      # BetterAuth migrations
pnpm prisma:mig      # Prisma migrations
pnpm prisma:gen      # Generate Prisma client
```

### Docker
```bash
# Start entire stack with Docker
docker compose up

# Start only database
docker compose up -d db
```

## Key Dependencies

- **BetterAuth**: Authentication system used across both applications
- **Prisma**: ORM for database operations in auth-service
- **Hono**: Web framework for auth-service API
- **Next.js 15 RC**: React framework for web application
- **Tailwind CSS**: Styling framework
- **React Hook Form + Zod**: Form handling and validation

## Database Setup

The project uses PostgreSQL with default credentials:
- User: postgres
- Password: postgres  
- Database: app
- Port: 5432

Always run both BetterAuth and Prisma migrations when setting up the database.