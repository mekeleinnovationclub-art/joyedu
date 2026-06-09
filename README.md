# JoyEdu - Modern Education Platform

A production-grade education platform combining the best of Udemy, Coursera, W3Schools, and Upwork-style dual-role accounts.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** + **shadcn/ui**
- **Zustand** (state) + **TanStack Query** (data fetching)
- **Framer Motion** (animations)

### Backend
- **NestJS** with modular architecture
- **PostgreSQL** + **Prisma ORM**
- **Redis** (caching, sessions)
- **JWT** auth with refresh tokens
- **WebSockets** (Socket.IO)
- **Stripe** (payments)

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** reverse proxy
- **GitHub Actions** CI/CD

## Features

- **Dual-Role Accounts**: Switch between Student/Teacher/Admin modes (Upwork-style)
- **Course Management**: Create, publish, and manage courses with chapters, lessons, quizzes
- **Interactive Playground**: W3Schools-style live code editor (HTML/CSS/JS/TS)
- **Coding Challenges**: Practice problems with test cases and submissions
- **Payments**: Stripe checkout, instructor payouts, coupons, subscriptions
- **Real-time**: WebSocket notifications, live chat, typing indicators
- **Certificates**: Auto-generated verifiable certificates
- **Admin Dashboard**: User management, analytics, audit logs, feature flags
- **Security**: 2FA, RBAC, rate limiting, CSRF/XSS protection

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Development Setup

```bash
# Clone the repo
git clone https://github.com/kapisera48-stack/joyedu.git
cd joyedu

# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker Setup

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, Backend (port 4000), Frontend (port 3000), and Nginx (port 80).

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name init    # Development
npx prisma migrate deploy             # Production
```

## Project Structure

```
joyedu/
├── backend/                 # NestJS API
│   ├── prisma/              # Prisma schema & migrations
│   ├── src/
│   │   ├── auth/            # Authentication & 2FA
│   │   ├── users/           # User management
│   │   ├── courses/         # Course CRUD
│   │   ├── chapters/        # Chapter management
│   │   ├── lessons/         # Lesson management
│   │   ├── quizzes/         # Quiz system
│   │   ├── enrollments/     # Enrollment & progress
│   │   ├── certificates/    # Certificate generation
│   │   ├── reviews/         # Course reviews
│   │   ├── payments/        # Stripe payments
│   │   ├── notifications/   # WebSocket notifications
│   │   ├── chat/            # Real-time chat
│   │   ├── coding/          # Coding challenges
│   │   ├── admin/           # Admin management
│   │   ├── uploads/         # File uploads
│   │   ├── categories/      # Course categories
│   │   ├── health/          # Health check
│   │   └── common/          # Shared utilities
│   └── test/                # E2E tests
├── frontend/                # Next.js App
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── hooks/           # Custom hooks
│       ├── lib/             # Utilities
│       ├── store/           # Zustand stores
│       └── types/           # TypeScript types
├── nginx/                   # Nginx config
├── docker-compose.yml
└── .github/workflows/       # CI/CD
```

## API Documentation

Start the backend and visit: `http://localhost:4000/api/docs`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configuration options.

## License

MIT
