# Header Styling Cleanup & Light-Theme Icon Color Fix

## Overview

Tidy up `AppHeaderComponent` by removing redundant/over-complex SCSS rules, eliminate the dual `@apply` + plain-CSS pattern, and fix the light-theme icon color regression introduced when the header migrated to Taiga UI's `flat-grayscale` icon buttons. Scope is strictly the header component and its stylesheet.

## Problem Statement

1. **Light-theme icon color bug** — `flat-grayscale` icon buttons render using Taiga's `--tui-text-tertiary`. In `_tokens.scss` this is mapped to `--text-muted` (`#475569` light / `#64748b` dark). On the off-white topbar the icons look washed-out and low-contrast in light mode. Dark mode is fine because the muted gray reads against the dark topbar.
2. **Mixed styling systems** — `header.component.scss` uses `@apply` for top-level classes (`.layout-topbar`, `.layout-topbar-logo`, etc.) but plain CSS for the profile dropdown (`.profile-dropdown`, `.user-dropdown-details`, `.user-dropdown-name`, `.user-dropdown-role`, `.dropdown-divider`, `.sign-out-btn`). The two patterns coexist for no reason.
3. **Broken Tailwind utility** — `transition-all duration-250` uses `duration-250` which is not a valid Tailwind class. The transition duration silently no-ops (no compile error, no runtime error).
4. **Inline Tailwind in HTML** — `text-xl`, `relative inline-flex`, `absolute top-1 right-1 pointer-events-none`, `p-0 overflow-hidden` are sprinkled in the template. They should live in the stylesheet with the other positioning concerns.
5. **Hard-coded theme-incompatible values** — `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)` on the profile dropdown is not theme-aware; in dark mode it shows up as a faint shadow on dark surface.
6. **Redundant selector nesting** — `.logo-icon-wrapper`, `.user-dropdown-details`, `.user-dropdown-name`, `.user-dropdown-role` can collapse into flatter selectors.

## Approach

### A. Icon color fix (scoped to header)

Inside `header.component.scss`, override the icon button color tokens only within the topbar. Do not touch `_tokens.scss` since scope is header-only.

```scss
.layout-topbar [tuiIconButton] {
  --tui-text-tertiary: var(--text-primary);
  color: var(--tui-text-tertiary);
}
```

Rationale: `--tui-text-primary` already flips correctly between light/dark because it is mapped to `var(--text-primary)` in `_tokens.scss`. By remapping `--tui-text-tertiary` to `--text-primary` only inside the topbar, the `flat-grayscale` appearance keeps its muted look elsewhere but renders with full-contrast text color in the header. No theme token changes leak to other components.

### B. SCSS rewrite — plain CSS, no `@apply`

Drop `@reference "tailwindcss"` and all `@apply` directives. Write the topbar styles in plain CSS using the existing design tokens in `_tokens.scss`. Translate Tailwind utilities to plain CSS:

| Current (Tailwind / `@apply`)            | Plain CSS                                    |
| ----------------------------------------- | -------------------------------------------- |
| `fixed h-[var(--topbar-height)] z-[997]`  | `position: fixed; height: var(--topbar-height); z-index: 997;` |
| `flex items-center justify-between`       | `display: flex; align-items: center; justify-content: space-between;` |
| `bg-[var(--bg-topbar)] backdrop-blur-md`  | `background: var(--bg-topbar); backdrop-filter: blur(8px);` |
| `border-b border-[var(--border)]`         | `border-bottom: 1px solid var(--border);`    |
| `transition-all duration-250` (broken)    | `transition: background-color 250ms ease, border-color 250ms ease, color 250ms ease;` |
| `gap-3 no-underline font-bold text-xl`    | `gap: 0.75rem; text-decoration: none; font-weight: 700; font-size: 1.25rem; line-height: 1.75rem;` |
| `w-[38px] h-[38px] rounded-[10px]`        | `width: 38px; height: 38px; border-radius: 10px;` |
| `ml-8 mr-auto`                            | `margin-left: 2rem; margin-right: auto;`     |
| `w-[240px] focus-within:w-[280px]`        | `width: 240px; transition: width 200ms ease; &:focus-within { width: 280px; }` |
| `hidden sm:flex`                          | `display: none; @media (min-width: 640px) { display: flex; }` |
| `max-[991px]:px-4`                        | `@media (max-width: 991px) { padding-left: 1rem; padding-right: 1rem; }` |

### C. HTML cleanup

- Remove `class="text-xl"` from `<tui-icon icon="@tui.receipt" />` — set via `.logo-icon-wrapper` SCSS.
- Replace `<span class="relative inline-flex">` wrapper around the bell button with `<span class="notification-wrapper">`. Move `position: relative; display: inline-flex;` to that class in SCSS.
- Remove `class="absolute top-1 right-1 pointer-events-none"` from the badge — move to `.notification-badge` SCSS class using `position: absolute; top: 0.25rem; right: 0.25rem; pointer-events: none;`.
- Remove `class="p-0 overflow-hidden"` from the avatar button — move to `.profile-button` SCSS class.

### D. Profile dropdown consolidation

Collapse `.user-dropdown-details`, `.user-dropdown-name`, `.user-dropdown-role`, `.dropdown-divider` into flatter selectors under `.profile-dropdown`:

```scss
.profile-dropdown {
  min-width: 180px;
  padding: 1rem;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);

  .profile-user {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
  }

  .profile-name { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
  .profile-role { font-size: 0.75rem; color: var(--text-muted); }

  .profile-divider {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 0.5rem 0;
  }

  button { width: 100%; }
}
```

The hard-coded `rgba(0, 0, 0, 0.1)` shadow is acceptable for the dropdown because the dropdown background is always `--bg-sidebar` (white-ish in light, dark-blue in dark) and the shadow simply gives elevation. If we want a fully token-driven shadow later, we add `--shadow-dropdown` in `_tokens.scss` — but that is out of scope here.

## Files Affected

- [angular/src/app/core/layout/header/header.component.html](angular/src/app/core/layout/header/header.component.html) — strip inline Tailwind utility classes; add semantic class names (`notification-badge`, `profile-button`).
- [angular/src/app/core/layout/header/header.component.scss](angular/src/app/core/layout/header/header.component.scss) — full rewrite: plain CSS, theme-aware icon color override, no `@apply`, no `@reference`.

## Out of Scope

- `_tokens.scss` — left untouched (scope is header-only per user decision).
- Sidebar component and `layout.component.scss`.
- `header.component.ts` — no logic changes.
- Adding new theme tokens (`--shadow-dropdown`, etc.).

## Verification

1. `npm run build` from `angular/` exits 0.
2. `ng lint` (if configured) passes for the two files.
3. Manual visual check in browser:
   - Light theme: all four header icon buttons (menu, bell, theme toggle, avatar) render with full-contrast text color against the off-white topbar.
   - Dark theme: icons remain readable on the dark topbar (regression check).
   - Notification badge "3" still sits in the top-right corner of the bell button.
   - Avatar button no longer shows a square padding around the circular avatar.
   - Hover states on icon buttons still show the circular background.
   - Logo icon-wrapper still shows the bordered, rounded square with accent color.
4. Profile dropdown opens, shows user name/role, divider, and full-width sign-out button. Visual unchanged from current behavior.

## Trade-offs

- **Plain CSS over `@apply`** — slightly more verbose at the rule level but eliminates the dual-pattern confusion and the broken `duration-250` class. Future contributors can read the SCSS without knowing Tailwind internals.
- **Scoped icon-color override** — choosing this over editing `_tokens.scss` means the fix lives next to the component, which is the right locality for a header-specific visual concern. If other components later want the same override, it should be promoted to a token at that point.
- **`flat-grayscale` retained** — keeps the muted, professional look the rest of the team established in the prior spec (`2026-07-05-header-styling-simplification-design.md`). Only the color resolution changes.