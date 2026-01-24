### Mellia POS – Project Status & Architecture

#### 1. Overview

**Mellia POS** is a web-based restaurant POS & mini-ERP. It handles:
- **POS sales** by space (VIP, Terrace)
- **Stock** by location (Fridge, Locker, Depot)
- **Expected vs real margins**
- **Capital, purchases, losses, and responsibilities**
- **Clients & loyalty points**
- **Dashboards for the owner/investor**

This file serves as a **checkpoint** so that any new developer can see:
- What the system must do (functional scope)
- What tech stack is used
- Which modules exist
- Where the implementation is currently stopped
- What the next steps are

#### 2. Tech Stack

- **Frontend / Backend**: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN/UI (planned)
- **State**: Zustand
- **Forms & Validation**: React Hook Form + Zod
- **Auth**: Auth.js (NextAuth v4.24) with RBAC (Admin, Manager, Cashier/Server)
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Printing**: ESC/POS (58mm / 80mm) – to be implemented later

#### 3. High-Level Modules

1. Core & Infrastructure (Next.js + Prisma + Neon wiring)
2. Users, Roles & Auth (RBAC, audit logs)
3. Products, Sale Spaces, Prices & Costs
4. Stock & Movements (multi-location)
5. Purchases, Capital & Expected Value
6. POS Sales & Payments
7. Loyalty & Clients
8. Losses, Inventory & Responsibilities
9. Expenses, Employees & Salaries
10. Dashboards & KPI
11. Printing & POS UI

#### 4. Current Implementation Status (Module by Module)

- **Module 0 – Foundation (Core & Infrastructure)**
  - **Status**: ✅ COMPLETE
  - **Done**:
    - ✅ `package.json` with all dependencies (Next.js, Prisma, Zustand, NextAuth v4.24, React Hook Form, Zod)
    - ✅ **npm install** executed successfully (all 412 packages installed)
    - ✅ Basic Next.js App Router structure (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`)
    - ✅ Tailwind CSS fully configured (`tailwind.config.ts`, `postcss.config.cjs`)
    - ✅ TypeScript config (`tsconfig.json`, `next-env.d.ts`)
    - ✅ Prisma setup:
      - `prisma/schema.prisma` with PostgreSQL datasource and a placeholder User model
      - `src/lib/prisma.ts` with reusable Prisma client
      - **`npx prisma generate`** executed successfully
    - ✅ **Professional folder structure**:
      - `src/lib/` – Shared libraries (prisma, utils)
      - `src/types/` – TypeScript types and enums
      - `src/components/` – UI, POS, and layout components (prepared)
      - `src/actions/` – Server Actions (prepared)
      - `src/middleware/` – Next.js middleware for auth (prepared)
      - `src/hooks/` – Custom React hooks (prepared)
      - `src/store/` – Zustand stores (prepared)
      - `src/utils/` – Utility functions (prepared)
    - ✅ Common utilities in `src/lib/utils.ts` (currency, date formatting, loyalty calculations)
    - ✅ TypeScript types in `src/types/index.ts` (UserRole, SaleSpace, ProductType, StockLocation, etc.)
    - ✅ `.env.example` with DATABASE_URL and NextAuth placeholders
    - ✅ `.gitignore` configured
    - ✅ `.eslintrc.json` configured
    - ✅ **Dev server running successfully** on http://localhost:3000
  - **Last Stop Point**: Dev server verified and running. Foundation complete.
  - **Date**: 2026-01-14

- **Module 1 – Users, Roles & Auth**
  - **Status**: ✅ COMPLETE (All 6 phases done)
  - **Done**:
    - ✅ Prisma schema for User, Session, AuditLog models
    - ✅ UserRole enum (ADMIN, MANAGER, CASHIER)
    - ✅ UserStatus enum (ACTIVE, INACTIVE, SUSPENDED)
    - ✅ Relations and indexes properly configured
    - ✅ `npx prisma db push` executed successfully
    - ✅ Auth utilities (`src/lib/auth.ts`) with bcrypt password hashing
    - ✅ NextAuth configuration (`src/lib/auth-options.ts`) with credentials provider
    - ✅ NextAuth API route (`src/app/api/auth/[...nextauth]/route.ts`)
    - ✅ SCSS theme system (`src/styles/theme.scss`) with POS-optimized variables:
      - Color palette (Blue, Orange, Green)
      - Large touch targets (min 3rem)
      - POS-optimized spacing, typography, buttons, inputs
    - ✅ Login page (`src/app/login/page.tsx`) – POS-style:
      - Mobile-first, tablet-optimized
      - Simple, centered, no distractions
      - Large inputs and buttons for touch
      - SCSS styling with theme variables
    - ✅ Root page redirects to `/login`
    - ✅ **Dashboard layout** (`src/components/layout/DashboardLayout.tsx`):
      - Single dashboard for all roles
      - Dynamic sidebar menu based on role (Admin sees 8 items, Cashier sees 4)
      - Mobile-responsive with hamburger menu
      - User info panel with avatar and logout
      - POS-optimized navigation (large icons, clear labels)
    - ✅ **Route protection middleware** (`src/middleware.ts`):
      - Protects `/dashboard/*` routes
      - Redirects unauthenticated users to `/login`
    - ✅ **Audit logging system** (`src/lib/audit.ts`):
      - Helper functions to log critical actions
      - Tracks LOGIN, LOGOUT, CRUD operations
      - Stores metadata (user agent, IP, before/after data)
    - ✅ Session provider wrapper
    - ✅ Dashboard home page (`src/app/dashboard/page.tsx`)
    - ✅ Default admin user seeded
  - **Last Stop Point**: Module 1 fully complete. Login works, dashboard loads, routes protected.
  - **Date**: 2026-01-14

- **All other business modules (Products, Stock, POS, Loyalty, Losses, Dashboards, etc.)**
  - **Status**: Not started
  - Only defined functionally in the PRD; no Prisma models or UI yet.

#### 5. Automation & Scripts

These scripts are available in `package.json`:
- **`npm run dev`**: starts the Next.js dev server.
- **`npm run build`**: builds the app for production.
- **`npm start`**: starts the production build.
- **`npm run lint`**: runs ESLint.
- **`npm run prisma:migrate`**: runs `prisma migrate dev` (requires models + DB).
- **`npm run prisma:generate`**: runs `prisma generate`.
- **`npm run db:push`**: runs `prisma db push` (sync schema to DB without migration history – dev use only).
- **`npm run setup`**: convenience script that runs `npm install && prisma generate`.

> **Important:** These scripts assume you have a valid `DATABASE_URL` in `.env` pointing to your Neon Postgres instance.

#### 6. How to Start the Project (for a New Developer)

1. **Clone the repo** and go to the `melliaPos` directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Neon database**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Set a real Neon PostgreSQL connection string in `DATABASE_URL`.
4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
5. **Start the dev server**:
   ```bash
   npm run dev
   ```
6. Open your browser at `http://localhost:3000`.

**Note**: Once database models are defined (Module 1+), you'll run `npx prisma db push` or `npx prisma migrate dev` to sync the schema.

#### 7. Current Limitations / Where Work Has Stopped

- ✅ **Module 0 (Foundation)**: COMPLETE
- ✅ **Module 1 (Users & Auth)**: COMPLETE (2026-01-14)
  - ✅ Prisma schema ready
  - ✅ NextAuth configured
  - ✅ Login page (POS-style) created
  - ✅ Dashboard layout with dynamic role-based menu
  - ✅ Route protection middleware
  - ✅ Audit logging system
  - ✅ Default admin user seeded
- ⏳ **Module 2 (Products & Prices)**: NOT STARTED
- ⏳ **All business modules**: Not started
- No **business logic** for POS, stock movements, loyalty, losses, dashboards yet
- No **printing** logic or POS UI design implemented yet

> **LAST STOP POINT (2026-01-14):**  
> **Module 1 COMPLETE** ✅  
> - Login works with admin@mellia.pos / Admin123!  
> - Dashboard loads with role-based dynamic menu  
> - Routes protected by middleware  
> - Audit logging ready  
> **Next step**: Start **Module 2 – Products, Sale Spaces & Pricing**
