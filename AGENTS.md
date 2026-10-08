<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-system-rules -->
# UI system (NextAdmin/TailGrids)

The UI foundation comes from NextAdmin v2 (TailGrids). It is being adopted in phases; the app's legacy tokens in `app/globals.css` (`ground`, `surface`, `line`, `text-*`, `cat-*`, `.vidrio`, ...) still exist until the migration finishes. **New code uses the TailGrids tokens and primitives only.**

## Structure (root layout, no `src/`)

```
app/
  css/            default.css, dark.css (raw token values), theme.css (Tailwind @theme map), calendars.css
  globals.css     imports the css/ files + legacy app tokens
  providers.tsx   next-themes ThemeProvider + sonner <Toaster /> (client)
components/
  tailgrids/core/ design-system primitives (Button, Card, Badge, Select, Tabs, Dialog, Table, Skeleton, ...)
hooks/  utils/  types/   cross-cutting hooks, `cn` and formatters, ambient type declarations
.agents/skills/react-aria/   React Aria docs; read SKILL.md before building interactive primitives
```

`chart`, `carousel` and `resizable` primitives are intentionally not ported yet (they need recharts, embla, react-resizable-panels). Ask before installing them.

## Styling rules

- Tailwind with the semantic tokens (`text-text-*`, `bg-card-*`, `border-base-*`, `bg-primary-*`, ...). Raw values live in `app/css/default.css` and `app/css/dark.css`; the Tailwind mapping lives in `app/css/theme.css`.
- Never hardcode hex colors. Reference tokens.
- Do NOT create new CSS utility classes.
- FullCalendar overrides belong in `app/css/calendars.css`.
- Fonts: Inter only, via `next/font` (`--font-inter`), exposed as Tailwind `font-sans`.
- Dark mode: `next-themes` writes `data-theme` on `<html>` (storage key `tema`). Never toggle it by hand; use `useTheme()`.

## Component rules

- Prefer primitives from `components/tailgrids/core/` over raw HTML or third-party equivalents. Don't overwrite them without asking.
- kebab-case file names, PascalCase component exports.
- Split complex UI into focused sub-components in separate files; compose with `children` instead of prop drilling; no inline `renderX()` helpers; type props explicitly.
- Add `"use client"` only when the component uses hooks, handlers or browser APIs.
- Use the `react-aria` skill (`.agents/skills/react-aria/SKILL.md`) for accessible interactive components.
- Icons: `@tailgrids/icons`. Never hand-write SVG icons.
- Feedback: sonner `toast.*` (`Toaster` is mounted in `app/providers.tsx`).
- Data tables: TanStack Table (`@tanstack/react-table`); keep columns, types and skeletons in separate files.
- Form validation: Zod, **inside server actions** (validate `FormData` before touching Supabase).

## Where this app DIFFERS from the NextAdmin template

- Data is fetched in **Server Components and server actions**, with Supabase **server-only** (`server-only`, `lib/` data access). There is no react-query, no `services/api` mocks, no client-side fetching layer. Don't add them.
- Auth is **Clerk** (`proxy.ts`, `accesoActual()`), not the template's mock auth.
- Loading states use **`loading.tsx` + the `Skeleton` primitives**, not react-query `isLoading`.
- Pages are not wrapped in a `(with-layouts)` group; the shell is `app/layout.tsx`.
- Template guidance to "prefer Client Components" does NOT apply: default to Server Components and push `"use client"` to the leaves.

## Don'ts

- Don't install new packages without asking the user.
- Don't touch business logic, server actions, `lib/` data access, Supabase or Clerk config when doing UI work.
- Don't use legacy tokens (`bg-surface`, `text-text-2`, `.vidrio`, ...) in new code.
<!-- END:ui-system-rules -->
