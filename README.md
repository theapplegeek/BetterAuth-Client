# Better Auth Demo - Complete Technical Documentation

Last updated: **February 16, 2026**

## 1. Overview

This repository contains the frontend application for a full-stack Better Auth demo.
The complete solution validates authentication, account security, RBAC administration, and a simple business module (Todo) in a realistic enterprise-style setup.

The full system is composed of:

- **Frontend** Angular 21 (`better-auth-client`) running on `http://localhost:4200`
- **Backend** Hono + Better Auth (`better-auth-server`) running on `http://localhost:3000`
- **Database** PostgreSQL (Better Auth schema + custom RBAC schema)

## 2. Project Goals

1. Deliver a production-style Angular frontend for Better Auth capabilities.
2. Cover complete account lifecycle and security lifecycle flows.
3. Provide an admin center for users, roles, and permissions.
4. Keep architecture maintainable, scalable, and reusable.

## 3. High-Level Architecture

- Angular client communicates with backend via credentialed HTTP requests.
- Backend exposes:
  - Better Auth under `/api/auth/*`
  - custom admin API under `/api/admin/*`
- Better Auth uses Drizzle with PostgreSQL.
- RBAC data from custom tables enriches user session/JWT with `roles` and `permissions`.

## 4. Technology Stack

## 4.1 Frontend

- Angular 21 (standalone components)
- Angular CDK (dialog system)
- RxJS
- Tailwind CSS v4 + Iconify
- Better Auth client + plugins (`admin`, `jwt`, `magic-link`, `two-factor`, `passkey`)

## 4.2 Backend (integrated project)

- Bun runtime
- Hono
- Better Auth
- Drizzle ORM + PostgreSQL
- Valibot

## 5. Frontend Functional Scope

## 5.1 Routing and Layout

Main app routes:

- `/auth/*`
- `/home`
- `/profile`
- `/todos`
- `/settings/*`
- `/admin/*`

Redirect helpers:

- `/redirect-to-sign-in`
- `/redirect-to-home`
- `/redirect-to-two-factor`
- `/redirect-to-enable-two-factor`
- `/redirect-to-reset-password`

Layouts:

- `empty` for authentication area
- `sidebar` for authenticated area

## 5.2 Authentication Flows

Implemented screens:

- Sign In
  - magic link with resend cooldown
  - email/password
  - passkey (autofill + manual)
  - Google / Discord
- Sign Up
- Forgot Password
- Reset Password
- Two-Factor Verification (TOTP / backup code)
- Two-Factor Enable (QR + backup codes)

Main auth service:

- `src/app/common/auth/auth.service.ts`

Core operations:

- `signUp`
- `signInWithPassword`
- `signInWithMagicLink`
- `signInWithPasskey`
- `signInWithGoogle`
- `signInWithDiscord`
- `requestResetPassword`
- `resetPassword`
- `enableTwoFactor`
- `verifyTwoFactorTOTP`
- `verifyTwoFactorBackupCode`
- `signOut`
- `getSession`
- `getJwtToken`

## 5.3 Settings Area

Sections:

- `My Account`
- `Security Settings`

### My Account

- profile overview (id, role, verification status, dates)
- update username
- update email (with verification)
- account deletion flow (danger zone)

Component:

- `src/app/pages/settings/components/account-settings/account-settings.component.ts`

### Security Settings

- change password
- credentials prerequisite handling for social-only users
- enable/disable 2FA
- passkey management (add/remove)
- active sessions handling (revoke others / revoke all)
- connected providers management (credential, Google, Discord)

Component:

- `src/app/pages/settings/components/security-settings/security-settings.component.ts`

Service:

- `src/app/pages/settings/services/account-security.service.ts`

## 5.4 Admin Center

Sections:

- Users
- Roles
- Permissions

Routes container:

- `src/app/pages/admin/admin.component.ts`

### Users Management

- search by name/email
- tri-state sorting (asc/desc/none)
- full pagination (first/prev/next/last)
- page size selection
- action menu per user

User actions:

- Detail
- Edit
- Set Password
- Ban / Unban
- Impersonate
- Sessions
- Delete

### Roles Management

- search
- tri-state sorting
- create/edit/delete
- permission assignments

### Permissions Management

- search
- tri-state sorting
- create/edit/delete

## 5.5 Dashboard + Todo Module

Pages:

- Home dashboard (quick counters + recent tasks)
- My Tasks (create/manage open tasks)
- Completed Tasks (archive + clear completed via dialog)

Persistence:

- localStorage (`better-auth-demo.todos`)

Service:

- `src/app/pages/todos/services/todo.service.ts`

## 5.6 Profile Page

Route:

- `/profile`

Features:

- user identity overview (name, email, initials avatar, role badges)
- account snapshot (user id, created/updated dates, roles)
- security posture score (email verification, 2FA, account status)
- productivity widgets based on todo data (open/completed/completion rate)
- recent completed tasks timeline
- quick actions to Account Settings, Security Settings, and Task Board

Files:

- `src/app/pages/profile/profile.component.ts`
- `src/app/pages/profile/profile.component.html`
- `src/app/pages/profile/profile.component.scss`
- `src/app/pages/profile/profile.routes.ts`

## 6. UI Infrastructure

## 6.1 Dialog System

Service:

- `src/app/common/services/app-dialog.service.ts`

Pattern used:

- one component per dialog use case
- dialogs live in local `dialogs/` folders per page
- host passes input data
- dialog contains operation logic
- host reacts with `closed.subscribe(...)`

Dialog folders examples:

- `src/app/pages/admin/components/users-management/dialogs/`
- `src/app/pages/admin/components/roles-management/dialogs/`
- `src/app/pages/admin/components/permissions-management/dialogs/`
- `src/app/pages/settings/components/security-settings/dialogs/`
- `src/app/pages/todos/components/completed-tasks/dialogs/`

## 6.2 Toast System

Service:

- `src/app/common/services/toast.service.ts`

Container:

- `src/app/common/components/toast-container/toast-container.component.*`

Features:

- centralized notifications
- `success`, `error`, `warning`, `info`
- auto-dismiss + manual close
- bottom-center position
- theme-coherent styling

## 6.3 Theme and Design Tokens

Defined in:

- `src/styles.scss`

Includes:

- custom semantic palettes (`primary`, `secondary`, `success`, `warning`, `error`)
- dark/light mode via `data-theme`
- shared classes for dialogs/toasts/admin surface
- controlled hidden scrollbars where required

Services:

- `ThemeService`
- `StorageService`

## 7. Access Control and Guards

Implemented guards:

- `authGuard`
- `noAuthGuard`
- `betterAuthAdminGuard`
- `hasRolesGuard(requiredRoles)`
- `hasPermissionsGuard(requiredPermissions)`

Auth user model includes:

- `role`
- `roles[]`
- `permissions[]`

## 8. Backend Integration Summary

Backend key entrypoints (from integrated server project):

- Better Auth handler: `/api/auth/*`
- Admin API: `/api/admin/*`
- Health check: `/health`

Admin endpoints consumed by frontend:

- `GET /api/admin/user`
- `POST /api/admin/user`
- `PUT /api/admin/user/:userId`
- `GET /api/admin/role`
- `GET /api/admin/role/permissions`
- `POST /api/admin/role`
- `PUT /api/admin/role/:roleId`
- `DELETE /api/admin/role/:roleId`
- `GET /api/admin/permission`
- `POST /api/admin/permission`
- `PUT /api/admin/permission/:permissionId`
- `DELETE /api/admin/permission/:permissionId`

## 9. Environment Configuration

Frontend environment:

- `src/environments/environment.ts`
- `betterAuthBaseURL: 'http://localhost:3000'`

Backend required env vars (reference):

- `AUTH_SECRET`
- `TRUSTED_ORIGIN`
- `APP_NAME` (optional)
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `RP_ID` (optional)
- `RP_NAME` (optional)
- `PORT` (optional)

## 10. Local Development

## 10.1 Run backend

Directory:

- `../better-auth-server`

Commands:

```bash
bun install
bun run dev
```

## 10.2 Run frontend

Directory:

- `.`

Commands:

```bash
bun install
bun run start
```

Alternative:

```bash
npm install
npm run start
```

## 11. Main End-to-End Workflows

## 11.1 Magic Link sign-in

1. User submits email on sign-in page.
2. Frontend calls Better Auth magic-link API.
3. Backend sends sign-in link email.
4. Callback finalizes session.

## 11.2 Password + 2FA sign-in

1. User submits email/password.
2. If needed, user is redirected to 2FA.
3. User validates TOTP or backup code.
4. Frontend gets JWT and navigates to home.

## 11.3 Credentials setup for social-only users

1. Security settings detect missing credential provider.
2. User requests setup link.
3. User completes password setup from email.
4. Password and 2FA management become available.

## 11.4 Security lifecycle

- Add/remove passkeys
- Revoke sessions (all / others)
- Connect/disconnect social providers (credential is protected)

## 11.5 Admin lifecycle

- search/sort/paginate users
- open action menu
- run operation-specific dialogs
- refresh list on dialog close result

## 12. Current Known Limitations

1. Email sending currently uses a stub logger (`src/utils/email.utils.ts`) in backend.
2. Some minor TODOs remain in auth UX feedback.
3. No complete e2e automation suite is currently included in this repository.
4. Backend `requireRole` logic should be hardened for strict production role checks.

## 13. Recommended Next Steps

1. Integrate real email provider (SMTP/Resend/SES).
2. Add admin audit logs.
3. Add API rate limiting and stronger hardening.
4. Expand unit/integration/e2e test coverage.
5. Add structured logging, metrics, and tracing.

## 14. Key File References

Frontend:

- `src/app/app.routes.ts`
- `src/app/common/auth/auth.service.ts`
- `src/app/pages/settings/services/account-security.service.ts`
- `src/app/pages/admin/http/admin.http.server.ts`
- `src/app/pages/admin/models/admin.model.ts`
- `src/app/common/services/app-dialog.service.ts`
- `src/app/common/services/toast.service.ts`
- `src/app/layouts/sidebar/sidebar.component.ts`
- `src/app/pages/profile/**`
- `src/app/pages/settings/**`
- `src/app/pages/admin/**`

Backend:

- `src/index.ts`
- `src/auth/auth.ts`
- `src/auth/config/*.ts`
- `src/admin/controller/admin.controller.ts`
- `src/admin/service/*.ts`
- `src/db/schema/auth-schema.ts`
- `src/db/schema/rbac-schema.ts`

## 15. Code Organization Conventions

- Feature-specific services and models live under `src/app/pages/<feature>/...`.
- `common` is reserved for truly shared cross-feature modules (example: user models).
- Services using `HttpClient` live under `http/` and use file naming `<feature>.http.server.ts`.
