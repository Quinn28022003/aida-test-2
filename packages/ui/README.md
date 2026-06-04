# @aida/ui

Shared frontend UI for Aida.

## Styles

```ts
import '@aida/ui/styles/globals.css';
```

`globals.css` includes Aida tokens (`--aida-*`), Tailwind CSS v4, and semantic colours. Auth screens and forms use Tailwind utility classes from this package (no separate auth stylesheet).

## Exports

| Path | Contents |
|------|----------|
| `.` | Auth + core UI primitives, `cn()` className helper |
| `cn` | `clsx` + `tailwind-merge` utility (also exported from `.`) |
| `./auth` | Auth forms and session provider |
| `./ui` | shadcn-style primitives only (no legacy domain widgets) |
| `./styles/globals.css` | Tailwind + tokens (UI package / tests) |
| `./styles/aida-theme.css` | Design tokens + base styles (import from apps after `tailwindcss`) |

## UI primitives (kept)

Button, Input, Label, Form, Card, Dialog, Alert, Badge, Checkbox, Select, Textarea, Switch, Tabs, Tooltip, Toast, Table, and other layout/feedback primitives.

## Removed (legacy domain)

Sidebar layouts, logo/avatar upload widgets, charts, carousel, calendar, command palette, menubar, pagination kit, floating background, and old-project button extras (loading dots, Next.js link wrapper, custom tooltips).

## Internal imports

Package source uses **relative imports** so Next.js apps can consume workspace source without `@/` alias clashes. Apps should set `transpilePackages: ['@aida/ui']`.
