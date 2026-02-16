# Better Auth Demo - Software Analysis & Implementation Plan

## 1) Goal

Create a complete frontend demo (Angular 21) for the Better Auth backend already running on `http://localhost:3000`, with:

- full **Settings** area for self-service account/security
- full **Admin** area for users/roles/permissions management
- coherent sidebar/navigation for a simple **Todo** app context

---

## 2) Current Project Analysis

### 2.1 Frontend (`better-auth-client`)

- Framework: Angular 21 standalone components.
- Styling: TailwindCSS v4 + Iconify.
- Auth client: Better Auth client with plugins:
  - `twoFactorClient`
  - `jwtClient`
  - `passkeyClient`
  - `magicLinkClient`
  - `adminClient`
- Existing pages:
  - `home` (placeholder)
  - `customer` (placeholder)
  - `wiki` (placeholder)
  - `settings` (draft UI with mocked data)
- Existing auth flow pages already implemented:
  - sign-in / sign-up
  - forgot/reset password
  - two factor verify/enable

### 2.2 Backend (`better-auth-server`)

- Runtime: Hono + Better Auth.
- Auth endpoint mounted at:
  - `GET/POST /api/auth/*`
- Admin custom endpoints mounted at:
  - `/api/admin/user` (GET/POST)
  - `/api/admin/user/:userId` (PUT)
  - `/api/admin/role` (GET/POST)
  - `/api/admin/role/permissions` (GET)
  - `/api/admin/role/:roleId` (PUT/DELETE)
  - `/api/admin/permission` (GET/POST)
  - `/api/admin/permission/:permissionId` (PUT/DELETE)
- Better Auth plugins enabled on server:
  - Two Factor
  - Passkey
  - Magic Link
  - JWT
  - Admin
- Account linking enabled (`account.accountLinking.enabled = true`).
- User features enabled:
  - change email
  - delete account

---

## 3) Functional Capability Map (Used for Frontend Integration)

### 3.1 Better Auth client features used

- Session/user:
  - `getSession`
  - `updateUser`
  - `changeEmail`
  - `deleteUser`
- Credentials/security:
  - `changePassword`
  - `setPassword` (for users without credential login)
  - `twoFactor.enable`
  - `twoFactor.disable`
- Passkeys:
  - `passkey.listUserPasskeys`
  - `passkey.addPasskey`
  - `passkey.deletePasskey`
- Linked accounts:
  - `listAccounts`
  - social linking through `signIn.social(...)`
  - `unlinkAccount`
- Sessions:
  - `listSessions`
  - `revokeSessions` (all)
  - `revokeOtherSessions` (all except current)
- Admin plugin:
  - `admin.listUsers`
  - `admin.impersonateUser`
  - `admin.setUserPassword`
  - `admin.banUser` / `admin.unbanUser`
  - `admin.removeUser`
  - `admin.listUserSessions`
  - `admin.revokeUserSession` / `admin.revokeUserSessions`

### 3.2 Custom admin HTTP endpoints used

- Users create/update with roleIds and validation.
- Roles create/update/delete and role-permission linking.
- Permissions create/update/delete.

---

## 4) Implementation Backlog

### Feature 1 - Settings (Account + Security)

- [ ] Improve Settings UI structure and visual quality.
- [ ] My Account:
  - [ ] show real user information
  - [ ] update username
  - [ ] update email
  - [ ] danger zone delete account
- [ ] Security:
  - [ ] change password
  - [ ] if no credential account: show set/link credentials first
  - [ ] 2FA enable/disable with credential prerequisite
  - [ ] passkey management (list/create/delete)
  - [ ] active sessions (revoke all / revoke others)
  - [ ] connected accounts (credential + google + discord) with proper constraints

### Feature 2 - Admin Area

- [ ] Add `/admin` section and nested routes.
- [ ] Users management:
  - [ ] table with search
  - [ ] text sort tri-state (asc/desc/none)
  - [ ] full pagination (first/prev/next/last + page size)
  - [ ] create user
  - [ ] actions: detail, edit, password, ban/unban, impersonate, sessions, delete
- [ ] Roles management:
  - [ ] search + create
  - [ ] text sort tri-state
  - [ ] edit + delete
- [ ] Permissions management:
  - [ ] search + create
  - [ ] text sort tri-state
  - [ ] edit + delete

### Feature 3 - Sidebar + Todo coherence

- [ ] Remove random placeholder navigation entries.
- [ ] Introduce coherent sections for a simple Todo app.
- [ ] Align routes/pages labels and sidebar hierarchy.

---

## 5) Delivery Strategy

- Commit 1: documentation (this file)
- Commit 2: Feature 1 (Settings)
- Commit 3: Feature 2 (Admin)
- Commit 4: Feature 3 (Sidebar/Todo coherence)

Each feature is implemented end-to-end before moving to the next one.

