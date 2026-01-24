# Mellia POS – Restaurant POS & ERP System

A modern, web-based Point of Sale and mini-ERP system for restaurant management.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and configure DATABASE_URL
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** – Complete project status, architecture, and development checkpoint
- **[prd.md](./prd.md)** – Full Product Requirements Document (PRD)

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + ShadCN/UI
- Prisma ORM + PostgreSQL (Neon)
- Auth.js (NextAuth)
- Zustand + React Hook Form + Zod

## Current Status

✅ **Module 0 – Foundation**: Complete (2026-01-14)  
⏳ **Module 1 – Users & Auth**: Next in queue

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for details.
