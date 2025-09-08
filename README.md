# Monorepo (Hono/Next.js) with BetterAuth

This repository contains a production-ready monorepo setup featuring a Hono-based authentication service and a Next.js web application, both integrated with BetterAuth.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v9 or higher)
- [Docker](https://www.docker.com/) and Docker Compose

## Setup Instructions

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Format Code (Optional)**
    ```bash
    pnpm format
    ```

3.  **Start the Database**
    ```bash
    docker compose up -d db
    ```

4.  **Run Database Migrations**

    Navigate to the auth service directory and run the BetterAuth and Prisma migrations.
    ```bash
    cd apps/auth-service
    pnpm ba:migrate
    pnpm prisma:mig
    cd ../..
    ```

5.  **Start All Services**
    ```bash
    pnpm dev
    ```

## Access URLs

-   **Web Application**: [http://localhost:3000](http://localhost:3000)
-   **Auth Service**: [http://localhost:4001](http://localhost:4001)

## Test Accounts

You can create test accounts by using the sign-up form on the web application.
