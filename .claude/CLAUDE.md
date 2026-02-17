# AI Engineering Guidelines
## Angular 21+ Enterprise Projects (Reusable Baseline)

This file defines the default engineering rules for AI agents working on Angular 21+ projects.
It is designed to be reusable across future repositories.

## 1. Purpose and Scope

Use these rules when generating, refactoring, or reviewing code to ensure:

- architectural consistency
- strict typing and maintainability
- production-grade quality
- predictable behavior in zoneless Angular apps
- scalable project structure

If a repository has stricter local rules, local rules take precedence.

## 2. Core Principles

Agents must:

1. Prefer modern Angular patterns (standalone, signals, lazy routes, `inject()` DI).
2. Enforce strict typing and avoid unsafe patterns.
3. Keep business logic out of templates.
4. Minimize coupling and preserve separation of concerns.
5. Avoid overengineering while keeping solutions extensible.
6. Write code safe for production and future maintenance.

## 3. TypeScript Standards

## 3.1 Typing rules

- Use strict types everywhere.
- Avoid `any`.
- If `unknown` is used, narrow it before usage.
- Add explicit return types for non-trivial methods.
- Add explicit generic types for signals, observables, and forms.
- Prefer model types/interfaces in shared model folders.

## 3.2 Class member conventions

- Every class member must include visibility (`public`/`private`/`protected`).
- Prefix private members with `_`.
- Keep naming consistent and intention-revealing.

## 4. Angular Architecture Standards

## 4.1 Standalone and control flow

- Use standalone components by default.
- Do not add `standalone: true` unless the repository/tooling explicitly requires it.
- Use Angular built-in control flow (`@if`, `@for`, `@switch`) in new code.
- Do not introduce new `*ngIf` / `*ngFor` / `*ngSwitch` patterns.
- Import only what the template actually uses.

## 4.2 Zoneless-compatible state

Angular 21+ is zoneless-first. If state is rendered in template:

- it must be signal-driven (`signal`, `computed`, derived signals), or
- managed through explicit reactive flow compatible with zoneless updates.

Do not rely on plain mutable class fields to update UI.

## 4.3 Signals-first UI state

- Use signals for local UI state.
- Use `computed()` for derived values.
- Prefer pure and predictable state transitions (`set`, `update`).
- Avoid signal mutation anti-patterns.

## 4.4 Dependency Injection

- Prefer functional DI with `inject()`.
- Keep constructor lightweight (no heavy side effects).
- Design services with single responsibility.

## 4.5 Component boundaries

- Smart components: orchestration, data loading, page-level state.
- Presentational components: render-only, inputs/outputs, no business services.
- Keep components focused and reasonably small.

## 4.6 Change detection and rendering

- Default new components to `ChangeDetectionStrategy.OnPush` unless repository policy differs.
- Use `@for (...; track ...)` for list rendering.

## 5. Template Rules

- Keep templates declarative and simple.
- Avoid heavy expressions and nested ternaries.
- Do not write arrow functions in templates.
- Do not assume global constructors/functions in templates.
- Precompute non-trivial UI values in component state.
- Prefer class/style bindings over imperative DOM manipulation.

## 6. Services and Data Access

- Use `@Injectable({ providedIn: 'root' })` for app-wide singleton services.
- Keep HTTP contracts strongly typed.
- Map API payloads to internal models before exposing to UI.
- Handle error branches explicitly.
- Avoid leaking raw transport models into components.

## 7. Error Handling and UX Consistency

- Never swallow errors silently.
- Normalize and centralize UI feedback.
- Prefer centralized toast/notification services.
- Avoid direct `window.alert`/`window.confirm` in app flows.
- Prefer reusable dialog patterns for confirmations and critical actions.

## 8. UI System Consistency (Recommended)

For multi-page enterprise apps:

- centralize visual tokens (colors, spacing, semantic states)
- keep form controls stylistically consistent
- use one consistent dialog system and keyboard behavior (ESC/ENTER)
- apply consistent interaction cues (`cursor-pointer` for clickable elements)
- keep accessibility and color contrast compliant (WCAG AA minimum)

## 9. Security and Production Safety

Agents must not:

- hardcode secrets
- bypass sanitization/security controls
- disable CSP-related protections without explicit requirement

Agents should:

- validate external input boundaries
- keep auth/session handling aligned with backend policy
- avoid storing sensitive tokens in insecure storage unless explicitly required

## 10. Performance and Scalability

- Lazy-load feature routes.
- Avoid redundant reactive computations.
- Avoid unnecessary subscriptions.
- Keep state updates minimal and immutable-friendly.
- Prevent circular dependencies.

## 11. Anti-Patterns to Avoid

- `any` proliferation
- business logic in templates
- monolithic components with mixed concerns
- side effects inside getters
- direct DOM querying (`document.querySelector`) unless explicitly justified
- introducing legacy Angular patterns in new code

## 12. Delivery Checklist

Before completing a task, verify:

- no `any` introduced
- no unused imports/dead code
- all critical flows have explicit error handling
- template state is zoneless-safe
- list rendering includes tracking
- accessibility basics are preserved
- UX remains consistent with project design system

## 13. Repository Pattern Addendum (Current Project Experience)

When working on admin/security-heavy Angular apps like this one, prefer:

- page-scoped dialog folders (`<page>/dialogs/*`)
- one component per dialog use case
- dialog-internal operation logic
- host-driven open/close orchestration and result handling
- centralized toast service for success/error/warning/info

These patterns are strongly recommended as a baseline for future projects.

## 14. Project Structure Conventions (Reusable)

Use these conventions as default for Angular enterprise projects unless repo-specific rules override them:

- Documentation must use project-relative paths (repo root based), never local machine absolute paths.
- Keep feature-specific services inside the feature page domain (`src/app/pages/<feature>/...`), not in `common`.
- Keep `common` only for truly cross-feature reusable utilities/services.
- If a service performs HTTP requests with `HttpClient`, place it under a feature `http/` folder and name it with `HttpService` suffix (example: `admin-http.service.ts`, class `AdminHttpService`).
- For pages with one root page component plus subviews (example: todos), keep only the main page component at `pages/<feature>/` root and move sub-components under `pages/<feature>/components/`.
