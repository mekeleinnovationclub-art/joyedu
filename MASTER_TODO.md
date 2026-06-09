# MASTER TODO — JoyEdu Platform

> Generated from comprehensive platform audit on June 8, 2026  
> **Overall Platform Score: 62/100** | Status: **MVP/Early Beta**

---

## Priority 1 — Critical Blockers 🔴

### 1.1 Fix Role Escalation Vulnerability
- **File:** `backend/src/auth/auth.service.ts` (lines 221-253)
- **Root cause:** `switchRole('TEACHER')` auto-grants TEACHER role to any user without admin approval, completely bypassing the TeacherApplication flow
- **Fix:** Remove the auto-grant logic in switchRole. Only allow switching between roles that already exist in `user.roles[]`. The TEACHER role should only be added after an admin approves a TeacherApplication.
- **Effort:** 1-2 hours

### 1.2 Secure WebSocket Gateways
- **Files:** `backend/src/notifications/gateway/notifications.gateway.ts`, `backend/src/chat/gateway/chat.gateway.ts`
- **Root cause:** No JWT verification on WebSocket connections. CORS set to `{ origin: '*' }`. Chat gateway trusts client-provided `userId` parameter.
- **Fix:** Add JWT middleware to socket handshake (`handleConnection`). Decode token and attach `userId` to socket. Extract `userId` from socket context, not from client payload. Restrict CORS to actual frontend origin.
- **Effort:** 4-6 hours

### 1.3 Implement Email Service
- **File:** NEW `backend/src/common/mail.service.ts` + `backend/src/common/mail.module.ts`
- **Root cause:** No mailer implementation exists. `MAIL_*` env vars are configured but unused. Email verification and password reset tokens are returned in API response (development workaround).
- **Fix:** Create MailService using Nodemailer with SMTP config from env. Wire into auth register (verification email), forgot-password (reset link), and create notification trigger emails.
- **Effort:** 4-6 hours

### 1.4 Add Prisma Migrations
- **File:** `backend/prisma/migrations/`
- **Root cause:** No migration history exists. Only schema.prisma + seed.ts. `prisma migrate dev` has never been run.
- **Fix:** Run `npx prisma migrate dev --name init` to create initial migration. Commit migration files.
- **Effort:** 30 minutes

### 1.5 Fix Certificate → Course Relation
- **File:** `backend/prisma/schema.prisma` (lines 498-510)
- **Root cause:** Certificate model has `courseId` field but no `@relation` to Course. Cannot join with Course data in queries.
- **Fix:** Add `course Course @relation(fields: [courseId], references: [id])` to Certificate. Add `certificates Certificate[]` to Course model.
- **Effort:** 30 minutes

### 1.6 Fix QuizAttempt → User Relation
- **File:** `backend/prisma/schema.prisma` (lines 439-454)
- **Root cause:** QuizAttempt has `userId` but no `@relation` to User. Cannot populate user data in quiz results.
- **Fix:** Add `user User @relation(fields: [userId], references: [id])` to QuizAttempt. Add `quizAttempts QuizAttempt[]` to User model.
- **Effort:** 30 minutes

### 1.7 Register Global Exception Filter + Transform Interceptor
- **File:** `backend/src/main.ts`
- **Root cause:** `HttpExceptionFilter` and `TransformInterceptor` exist in `common/filters/` and `common/interceptors/` but are never registered globally.
- **Fix:** Add `app.useGlobalFilters(new HttpExceptionFilter())` and `app.useGlobalInterceptors(new TransformInterceptor())` in bootstrap function.
- **Effort:** 15 minutes

---

## Priority 2 — Missing Core LMS Features 🟠

### 2.1 Build Lesson Viewer / Course Player Page
- **File:** NEW `frontend/src/app/courses/[slug]/learn/page.tsx`
- **Root cause:** No frontend page for students to view lesson content, watch videos, or read markdown. API endpoints work but there's no consumer UI.
- **Fix:** Create full course player with: chapter/lesson sidebar, markdown renderer, video player (HTML5), lesson completion buttons, progress bar, quiz integration. Must handle enrolled vs. free preview logic.
- **Effort:** 2-3 days

### 2.2 Build Certificate PDF/Image Generator
- **File:** `backend/src/certificates/certificates.service.ts`
- **Root cause:** Certificate is only a database record. No visual/downloadable output.
- **Fix:** Use puppeteer, PDFKit, or canvas to generate styled PDF certificates featuring: student name, course title, instructor name, date of completion, certificate number, and QR code linking to verification page.
- **Effort:** 1-2 days

### 2.3 Build Certificate Verification Frontend Page
- **File:** NEW `frontend/src/app/certificates/verify/[number]/page.tsx`
- **Root cause:** Backend `GET /certificates/verify/:number` endpoint exists but no frontend page.
- **Fix:** Create public page showing certificate details: holder name, course, date, and validity indicator.
- **Effort:** 3-4 hours

### 2.4 Build Quiz-Taking Frontend UI
- **File:** Component in course player page
- **Root cause:** Quiz CRUD and quiz submission API work, but no frontend for students to take quizzes.
- **Fix:** Create quiz component supporting: multiple choice, true/false, short answer question types. Include timer, answer selection, submission, results display, attempt history.
- **Effort:** 1-2 days

### 2.5 Implement Teacher Payout Request Endpoint
- **File:** `backend/src/payments/payments.controller.ts` + `payments.service.ts`
- **Root cause:** Teachers can view revenue but cannot request payouts. Only admin can create payouts.
- **Fix:** Add `POST /payments/payouts/request` for TEACHER role. Calculate available balance from completed transactions minus platform fee and previous payouts. Create Payout record with PENDING status.
- **Effort:** 3-4 hours

### 2.6 Build 2FA Setup Frontend Page
- **File:** Extend `frontend/src/app/(dashboard)/student/settings/` with security section
- **Root cause:** API supports 2FA (setup + verify) but no frontend to configure it.
- **Fix:** Add security settings with 2FA toggle, QR code display, verification code input, backup codes display.
- **Effort:** 4-6 hours

### 2.7 Implement Chapter-Level Progress Tracking
- **File:** `backend/src/enrollments/enrollments.service.ts`
- **Root cause:** Only lesson-level progress. No chapter-level completion indicator.
- **Fix:** Add derived chapter completion percentage calculation. When all lessons in a chapter are complete, mark chapter as complete. Return per-chapter progress in getCourseProgress.
- **Effort:** 2-3 hours

### 2.8 Build Course Builder Frontend (Enhanced)
- **File:** `frontend/src/app/(dashboard)/teacher/courses/[id]/edit/page.tsx`
- **Root cause:** Teachers need a drag-and-drop course builder for chapters, lessons, quizzes, and resources
- **Fix:** Create comprehensive course editor with: drag-and-drop chapter/lesson reordering, inline editing, lesson type selector, quiz builder, resource upload integration.
- **Effort:** 3-5 days

### 2.9 Add Admin Teacher Application Review
- **File:** `backend/src/admin/admin.service.ts` + admin frontend
- **Root cause:** TeacherApplication model and student-facing submission exist, but admin has no dedicated review/approve/reject workflow.
- **Fix:** Add admin endpoints for listing pending applications, viewing details, approving (grants TEACHER role), rejecting (with reason). Add frontend page at `/admin/teacher-applications`.
- **Effort:** 1 day

---

## Priority 3 — Marketplace Improvements 🟡

### 3.1 Implement Stripe Refund Flow
- **File:** `backend/src/payments/payments.service.ts`
- **Root cause:** No Stripe refund logic. `stripePaymentId` is stored but `stripe.refunds.create()` is never called.
- **Fix:** Add admin and user refund endpoints. Use `stripe.refunds.create({ payment_intent })`. Update transaction status to REFUNDED. Remove enrollment if full refund. Handle partial refunds.
- **Effort:** 4-6 hours

### 3.2 Activate Referral System
- **Files:** NEW `backend/src/referrals/` module
- **Root cause:** `ReferralCode` and `ReferralUse` models exist in schema but no controller or service.
- **Fix:** Create ReferralsModule with: generate referral code, apply during checkout (additional discount or credit), track usage, calculate commissions, display stats.
- **Effort:** 1 day

### 3.3 Implement Wallet System
- **Files:** NEW `backend/src/wallet/` module + Prisma schema changes
- **Root cause:** No wallet model or balance tracking exists.
- **Fix:** Create `Wallet` and `WalletTransaction` models. Service for: deposits, withdrawals, instructor earnings credit (via payment webhook), student refunds to wallet, transaction history, admin adjustments. Frontend wallet UI.
- **Effort:** 2-3 days

### 3.4 Build Revenue Analytics Dashboard
- **File:** `frontend/src/app/(dashboard)/teacher/revenue/page.tsx`
- **Root cause:** Revenue page exists but uses basic total calculations. No time-series charts or course-level breakdown.
- **Fix:** Add monthly/weekly revenue charts using recharts. Course-by-course earnings breakdown. Payout history. Revenue growth trends.
- **Effort:** 1 day

### 3.5 Implement Stripe Connect for Instructor Payouts
- **File:** `backend/src/payments/payments.service.ts`
- **Root cause:** `stripeAccountId` field exists on User but is unused. No Stripe Connect integration.
- **Fix:** Implement Stripe Connect onboarding flow (Express accounts), automated payouts via `stripe.transfers.create()`, dashboard links for instructors to view Stripe account.
- **Effort:** 2-3 days

### 3.6 Coupon Management Admin UI
- **File:** NEW `frontend/src/app/(dashboard)/admin/coupons/page.tsx`
- **Root cause:** Coupon model exists and is used in checkout, but no admin UI to create/manage coupons.
- **Fix:** Create admin coupon management page: create/edit/delete coupons, set discount %, max uses, per-course restriction, expiry date.
- **Effort:** 4-6 hours

---

## Priority 4 — School Management System 🔵

### 4.1 Implement Live Class System
- **Files:** NEW `backend/src/live-classes/` module + Prisma schema
- **Root cause:** No live class infrastructure at all.
- **Fix:** Schema: `LiveClass` model (title, instructor, scheduledAt, duration, joinUrl, platform enum, maxParticipants, status, recordingUrl). Backend: CRUD, scheduling, reminder notifications (1h before, 15min before), attendance tracking. Frontend: schedule page, join links, calendar view. Integration with Jitsi Meet (open source, no API key needed).
- **Effort:** 1-2 weeks

### 4.2 Implement Assignment System
- **Files:** NEW `backend/src/assignments/` module + Prisma schema
- **Root cause:** Frontend has `/teacher/assignments` page but no backend support.
- **Fix:** Schema: `Assignment` model (courseId, title, description, dueDate, maxScore, attachments). `AssignmentSubmission` model (studentId, assignmentId, content, files, grade, feedback, submittedAt, gradedAt). Backend: teacher creates assignments, students submit, teacher grades. Frontend: assignment list, submit page, grading UI.
- **Effort:** 1 week

### 4.3 Implement Cohort/Batch Management
- **Files:** NEW `backend/src/cohorts/` module + Prisma schema
- **Root cause:** No cohort model exists.
- **Fix:** Schema: `Cohort` model (name, courseId, startDate, endDate, maxStudents). Backend: CRUD, batch enrollment (enroll multiple students at once), progress tracking per cohort. Frontend: cohort management page for teachers/admin.
- **Effort:** 1 week

### 4.4 Implement Academic Calendar
- **Files:** NEW module + schema
- **Root cause:** No calendar or semester structure.
- **Fix:** Schema: `CalendarEvent` model (title, type, startDate, endDate, courseId, cohortId). `Semester` model (name, startDate, endDate). Backend: CRUD, calendar view API. Frontend: calendar widget showing classes, assignment due dates, exams.
- **Effort:** 1 week

### 4.5 Implement Grading System
- **Files:** Extension of assignment + quiz modules
- **Root cause:** No grade book or GPA calculation.
- **Fix:** Create `Grade` model combining quiz scores + assignment grades. Weighted average calculation per course. Student transcript/grade report. Teacher grade book view.
- **Effort:** 3-5 days

---

## Priority 5 — Nice-to-Have Features 🟢

### 5.1 Implement S3/MinIO File Storage
- **File:** `backend/src/uploads/uploads.service.ts`
- **Root cause:** Files stored on local disk via `writeFileSync`. Breaks in multi-container deployment. Blocks event loop.
- **Fix:** Add MinIO container to docker-compose. Use AWS S3 SDK. Generate pre-signed upload URLs. Serve via CDN or pre-signed download URLs.
- **Effort:** 1 day

### 5.2 Add Full-Text Search (MeiliSearch)
- **Root cause:** Course search uses Prisma `contains` (SQL LIKE). No relevance scoring, no typo tolerance.
- **Fix:** Add MeiliSearch container. Index courses on publish/update events. Search API middleware. Filterable by category, price, difficulty.
- **Effort:** 2-3 days

### 5.3 Add Redis Socket.IO Adapter
- **File:** `backend/src/chat/chat.module.ts`, `backend/src/notifications/notifications.module.ts`
- **Root cause:** WebSocket state is in-memory only. Cannot scale to multiple backend instances.
- **Fix:** Install `@socket.io/redis-adapter`. Configure in module setup with existing Redis connection.
- **Effort:** 2-3 hours

### 5.4 Implement Background Job Queue (BullMQ)
- **Root cause:** No async job processing for heavy tasks.
- **Fix:** Add BullMQ with Redis backend. Use for: email sending, certificate PDF generation, analytics aggregation, search index updates, notification broadcasting.
- **Effort:** 1-2 days

### 5.5 Add Redis Caching Layer for Courses
- **File:** `backend/src/courses/courses.service.ts`
- **Root cause:** Redis only used for auth tokens. No query caching.
- **Fix:** Cache course listings (30s TTL), featured courses (5min TTL), category tree (10min TTL). Invalidate on mutations. Use Redis pipeline for batch operations.
- **Effort:** 1 day

### 5.6 Add SSL/TLS to Nginx
- **File:** `nginx/nginx.conf`
- **Root cause:** Nginx serves HTTP only. No encryption in transit.
- **Fix:** Add SSL certificate configuration (Let's Encrypt/certbot). HTTPS redirect. HSTS header. Strong cipher configuration.
- **Effort:** 2-3 hours

### 5.7 Implement Cursor-Based Pagination
- **Root cause:** All pagination is offset-based. Performance degrades significantly at high page numbers.
- **Fix:** Create cursor-based pagination utility using Prisma cursor. Apply to high-volume endpoints: notifications, audit logs, transactions, messages.
- **Effort:** 1 day

### 5.8 Add Structured Logging
- **Root cause:** Default NestJS Logger. No structured JSON logs. No correlation IDs.
- **Fix:** Integrate Pino or Winston. JSON format with request ID, user ID, timestamp. Log levels per environment. Request/response logging middleware.
- **Effort:** 4-6 hours

### 5.9 Add User Public Profile Pages
- **File:** NEW `frontend/src/app/instructors/[username]/page.tsx`
- **Root cause:** No public pages showing instructor information.
- **Fix:** Create profile page with: bio, avatar, courses taught, average rating, student count, social links.
- **Effort:** 4-6 hours

### 5.10 Add Course Discussion Forum
- **Files:** NEW module
- **Root cause:** No discussion/Q&A system within courses.
- **Fix:** Create `Discussion` model (courseId, lessonId, userId, title, content, parentId for threading). CRUD endpoints. Frontend discussion panel in course player.
- **Effort:** 2-3 days

### 5.11 Add Error Tracking (Sentry)
- **Root cause:** No error tracking or monitoring.
- **Fix:** Install `@sentry/nestjs` (backend) and `@sentry/nextjs` (frontend). Configure DSN. Attach user context. Source maps for frontend.
- **Effort:** 2-3 hours

### 5.12 Add Database Backup Strategy
- **Root cause:** No backup mechanism. Data loss is one Docker volume deletion away.
- **Fix:** Add `pg_dump` cron job. S3 backup upload. Retention policy. Automated restore testing.
- **Effort:** 4-6 hours

### 5.13 Add Rate Limiting Per Endpoint
- **Root cause:** Global 100 req/min only. Login/register not specifically rate-limited.
- **Fix:** Add `@Throttle()` decorators on sensitive endpoints: login (5/min), register (3/min), forgot-password (3/min), file upload (10/min), webhook (100/min).
- **Effort:** 1-2 hours

### 5.14 Add Course Versioning UI
- **Root cause:** `CourseVersion` model exists but no service logic to create versions or view history.
- **Fix:** Auto-create CourseVersion snapshot before each publish. Display version history in teacher dashboard. Allow rollback.
- **Effort:** 1 day

### 5.15 Add Student Dashboard Enhancements
- **Root cause:** Student dashboard is basic.
- **Fix:** Add: recently accessed courses, recommended courses, achievement badges, learning streak tracker, study time statistics, upcoming deadlines.
- **Effort:** 2-3 days

---

## Summary

| Priority | Count | Estimated Effort |
|---|---|---|
| P1 — Critical Blockers | 7 items | ~2 days |
| P2 — Missing Core LMS | 9 items | ~2 weeks |
| P3 — Marketplace | 6 items | ~1 week |
| P4 — School Management | 5 items | ~4 weeks |
| P5 — Nice-to-Have | 15 items | ~3 weeks |
| **Total** | **42 items** | **~10 weeks** |
