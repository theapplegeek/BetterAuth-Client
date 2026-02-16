# Better Auth Demo - Complete Technical Documentation

Last updated: **February 16, 2026**

## 1. Introduction

This software is a full-stack demo platform used to validate **Better Auth** features in a real-world-like setup:

- multi-method authentication (password, magic link, social, passkey)
- account security lifecycle (2FA, passkeys, sessions)
- administration of users, roles, and permissions (RBAC)
- a simple product module example (Todo App)

The solution is composed of:

- **Frontend** Angular 21 (`better-auth-client`) on `http://localhost:4200`
- **Backend** Hono + Better Auth (`better-auth-server`) on `http://localhost:3000`
- **Database** PostgreSQL (auth schema + custom RBAC schema)

## 2. Project Goals

1. Provide an enterprise-style frontend for the main Better Auth capabilities.
2. Demonstrate account lifecycle and security lifecycle integration.
3. Expose a complete admin console with CRUD and access management operations.
4. Provide an extensible technical baseline for production-oriented use cases.

## 3. Overall Architecture

## 3.1 High-level view

- Angular client sends credentialed requests (cookies/session) to the backend.
- Backend exposes:
  - Better Auth endpoints under `/api/auth/*`
  - custom Admin endpoints under `/api/admin/*`
- Better Auth uses Drizzle adapter with PostgreSQL.
- Custom RBAC tables (`role`, `permission`, `user_role`, `role_permission`) enrich both session and JWT with `roles` and `permissions`.

## 3.2 Repository layout

Main workspace:

- `.`
- `../better-auth-server`

Both projects are independent repositories.

## 4. Technology Stack

## 4.1 Frontend

- Angular 21 (standalone components)
- Angular CDK (dialog system)
- RxJS
- Tailwind CSS v4 + Iconify
- `better-auth` client + plugins (`admin`, `jwt`, `magic-link`, `two-factor`, `passkey`)

## 4.2 Backend

- Bun runtime
- Hono
- Better Auth
- Drizzle ORM + PostgreSQL
- Valibot (request validation)

## 5. Frontend - Functional and Technical Details

## 5.1 Application bootstrap

Key files:

- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/app/app.component.ts`

Characteristics:

- Router is configured with `withComponentInputBinding()`
- `ThemeService` is initialized globally at startup
- Global toast container (`<app-toast-container>`) is mounted in root

## 5.2 Routing and layouts

Available layouts:

- `empty` for auth area
- `sidebar` for authenticated area

Main routes:

- `/auth/*` (sign-in/sign-up/2FA/reset)
- `/home`
- `/todos`
- `/settings/*`
- `/admin/*`

Semantic redirect routes:

- `/redirect-to-sign-in`
- `/redirect-to-home`
- `/redirect-to-two-factor`
- `/redirect-to-enable-two-factor`
- `/redirect-to-reset-password`

## 5.3 Access guards

Implemented in `src/app/common/auth/guards`:

- `authGuard`: protects private area when no valid session exists
- `noAuthGuard`: prevents access to auth pages for already authenticated users
- `betterAuthAdminGuard`: blocks admin area if `user.role !== 'admin'`
- `hasRolesGuard(requiredRoles)`
- `hasPermissionsGuard(requiredPermissions)`

## 5.4 Sidebar and navigation

`src/app/layouts/sidebar/sidebar.component.ts`.

Current navigation:

- Dashboard
- My Tasks
- Completed
- Settings
- Admin (submenu)
  - Users
  - Roles
  - Permissions

Note: Admin submenu is implemented as open/close group behavior, without parent auto-navigation.

## 5.5 Auth module (end user)

Area: `src/app/pages/auth`.

Implemented screens:

- Sign In
  - magic link with cooldown
  - email/password
  - passkey (autofill + manual)
  - Google / Discord
- Sign Up
- Forgot Password
- Reset Password
- Two-Factor Verification
- Two-Factor Enable (QR + backup codes)

Main service:

- `src/app/common/auth/auth.service.ts`

Exposed operations:

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

## 5.6 Dashboard and Todo module

Pages:

- `Home`: quick KPIs (total/open/completed) + latest tasks
- `My Tasks`: create task, priority, notes, complete, delete
- `Completed`: completed task history, reopen, delete, clear-all via dialog

Persistence:

- `TodoService` stores data in `localStorage` using key `better-auth-demo.todos`

## 5.7 Settings

Sections:

- `My Account`
- `Security Settings`

## 5.7.1 My Account

Features:

- user overview (id, email verification status, roles, creation timestamp)
- update username
- update email (with email confirmation flow)
- danger zone: delete account (email verification flow)

Component:

- `src/app/pages/settings/components/account-settings/account-settings.component.ts`

## 5.7.2 Security Settings

Features:

- change password
- credentials prerequisite handling (for social-only users)
- enable/disable 2FA
- passkey management (add/remove)
- active sessions management (revoke others / revoke all)
- connected providers (credential, Google, Discord)

Component:

- `src/app/pages/settings/components/security-settings/security-settings.component.ts`

Dedicated service:

- `src/app/common/auth/account-security.service.ts`

## 5.8 Admin Center

Sections:

- Users
- Roles
- Permissions

Container component:

- `src/app/pages/admin/admin.component.ts`

### 5.8.1 Users Management

Table features:

- search (name/email)
- tri-state sort (asc/desc/none) on text columns
- full pagination (first/prev/next/last)
- page size selection

User actions:

- Detail
- Edit
- Set Password
- Ban / Unban
- Impersonate
- Sessions
- Delete

### 5.8.2 Roles Management

Features:

- search
- tri-state sort
- create/edit/delete role
- permission assignment via `permissionIds`

### 5.8.3 Permissions Management

Features:

- search
- tri-state sort
- create/edit/delete permission

## 5.9 Dialog system (Angular CDK)

The project uses a centralized open service:

- `src/app/common/services/app-dialog.service.ts`

Current implementation rules:

- **one dialog component per use case**
- dialogs are stored in local `dialogs/` folders within each page
- host opens dialog and passes required input data
- API/business logic is handled inside dialog components
- host reacts to outcomes through `closed.subscribe(...)`

Example dialog folders:

- `.../users-management/dialogs/*`
- `.../roles-management/dialogs/*`
- `.../permissions-management/dialogs/*`
- `.../security-settings/dialogs/*`
- `.../todos/dialogs/*`

Shared dialog UX:

- unified visual system (`app-modal-*`, `app-btn-*`)
- keyboard shortcuts support (ESC/ENTER)
- blur overlay + centered panel style aligned with the app theme

## 5.10 Centralized toast system

Service:

- `src/app/common/services/toast.service.ts`

Container:

- `src/app/common/components/toast-container/toast-container.component.*`

Characteristics:

- placement: bottom center
- supported types: `success`, `error`, `warning`, `info`
- auto-dismiss with configurable durations
- manual dismiss support
- light color tint + blur style aligned with theme

## 5.11 Theming and design system

Main styling points (`src/styles.scss`):

- custom color tokens (`primary`, `secondary`, `success`, `warning`, `error`)
- light/dark mode support via `data-theme`
- unified input/select/textarea styling
- shared utility classes for admin surface, dialogs, and toasts
- hidden scrollbars in selected areas while preserving scrolling behavior

Related services:

- `ThemeService`: user theme + system fallback handling
- `StorageService`: theme preference persistence

## 6. Backend - Functional and Technical Details

## 6.1 HTTP entry point

File:

- `src/index.ts`

Exposes:

- `GET/POST /api/auth/*` -> Better Auth handler
- `ALL /api/admin/*` -> custom admin controller
- `GET /health` -> health check

CORS:

- applied under `/api/*`
- `credentials: true`
- allowed origin from `TRUSTED_ORIGIN`

## 6.2 Better Auth configuration

Main file:

- `src/auth/auth.ts`

Integrated configs:

- Drizzle DB adapter (`src/auth/config/database.config.ts`)
- session (`src/auth/config/session.config.ts`)
- account linking (`src/auth/config/account.config.ts`)
- user lifecycle (`src/auth/config/user.config.ts`)
- email/password + email verification (`src/auth/config/email-and-password.config.ts`)
- social providers (`src/auth/config/social-providers.config.ts`)
- hooks (`src/auth/config/hooks.config.ts`)
- plugins (`src/auth/config/plugins.config.ts`)

Enabled plugins:

- Two Factor
- Passkey
- Magic Link
- JWT
- Admin
- customSession (injects RBAC roles/permissions into session user)

## 6.3 RBAC and permissions

Better Auth access control definition:

- `src/auth/permissions.ts`

Roles:

- `admin`: inherits admin plugin statements
- `user`: base user/session statements

Custom DB RBAC:

- app-specific roles and permissions in dedicated tables
- user-role and role-permission mapping
- session/JWT enrichment with DB-resolved authorities

## 6.4 Custom Admin API

Controller:

- `src/admin/controller/admin.controller.ts`

Middleware:

- `requireSession`
- `requireRole('admin')`

Endpoints:

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

Input validation:

- Valibot DTO schemas (`userCreationDtoSchema`, `roleCreationDtoSchema`, `permissionCreationDtoSchema`)

## 6.5 Data model

Auth schema (`src/db/schema/auth-schema.ts`):

- `user`
- `session`
- `account`
- `verification`
- `two_factor`
- `passkey`
- `jwks`

RBAC schema (`src/db/schema/rbac-schema.ts`):

- `role`
- `permission`
- `user_role`
- `role_permission`

## 6.6 Core backend services

- `listUsers`: fetch Better Auth users + RBAC authority enrichment
- `createUser`: create Better Auth user + assign `roleIds`
- `updateUser`: update Better Auth user + sync `user_role`
- `create/update/deleteRole`
- `create/update/deletePermission`
- `listRoles`, `listRolesWithPermissions`, `listPermissions`

## 7. Environment Variables (Backend)

Required by `src/config/app.config.ts`:

- `AUTH_SECRET`
- `TRUSTED_ORIGIN`
- `APP_NAME` (optional, has default)
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `RP_ID` (optional)
- `RP_NAME` (optional)
- `PORT` (optional, default 3000)

## 8. Local Setup

## 8.1 Backend

Directory: `../better-auth-server`

Commands:

```bash
bun install
bun run dev
```

Expected server URL: `http://localhost:3000`.

## 8.2 Frontend

Directory: `.`

Commands:

```bash
bun install
bun run start
```

or with npm:

```bash
npm install
npm run start
```

Expected client URL: `http://localhost:4200`.

Frontend endpoint configuration:

- `src/environments/environment.ts`
- `betterAuthBaseURL: 'http://localhost:3000'`

## 9. Main End-to-End Flows

## 9.1 Magic Link sign-in

1. User enters email on `/auth/sign-in`.
2. Frontend calls `authClient.signIn.magicLink(...)`.
3. Backend sends sign-in email through `sendEmail(...)`.
4. Callback completes session creation on client side.

## 9.2 Password sign-in with 2FA

1. User submits email/password.
2. Better Auth may trigger 2FA redirect flow.
3. User validates with TOTP or backup code.
4. Client obtains JWT token and navigates to home.

## 9.3 Credentials setup for social-only account

1. In `Settings > Security`, missing `credential` provider is detected.
2. User requests password setup link.
3. User receives reset/setup email.
4. After setup, password change and 2FA management are enabled.

## 9.4 Account security management

- Passkeys: add/remove
- Sessions: revoke others / revoke all
- Social providers: connect/disconnect (credential is protected)

## 9.5 Admin user lifecycle

- Admin searches/sorts/paginates users
- opens action menu
- runs action-specific dialogs
- list refreshes after dialog close result

## 10. Current State and Operational Notes

## 10.1 Functional state

The software currently covers:

- multi-provider end-user authentication
- complete user-side security management
- admin center for users/roles/permissions with core CRUD workflows
- Todo module aligned with navigation and app context
- unified dialog and toast UX system

## 10.2 Important technical notes

1. `sendEmail` is currently a stub (console logging only) in `src/utils/email.utils.ts`.
2. Minor TODO items are still present in auth area (for example clipboard success feedback in 2FA enable).
3. This repository does not yet include a full end-to-end automated test suite.
4. In backend middleware `requireRole`, role check uses string `includes`; for production, strict role matching or normalized role arrays are recommended.

## 11. Recommended Next Extensions

1. Integrate a real email provider (Resend, SES, SMTP) with HTML templates.
2. Add admin audit logging (ban/unban/delete/impersonate).
3. Add rate limiting to auth/admin endpoints.
4. Extend automated tests (unit, integration, e2e).
5. Add observability (structured logging, tracing, metrics).

## 12. Key File References

Frontend:

- `src/app/app.routes.ts`
- `src/app/common/auth/auth.service.ts`
- `src/app/common/auth/account-security.service.ts`
- `src/app/common/admin/admin.service.ts`
- `src/app/common/services/app-dialog.service.ts`
- `src/app/common/services/toast.service.ts`
- `src/app/layouts/sidebar/sidebar.component.ts`
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

