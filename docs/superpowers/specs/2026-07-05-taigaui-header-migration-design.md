# Taiga UI v5 Header Migration — Design Spec

## Overview

Migrate the `AppHeaderComponent` from PrimeNG to **Taiga UI v5**, keeping all existing PrimeNG usage in other components intact. The header is the first component in a phased replacement.

The approach: install Taiga UI via `ng add taiga-ui`, register `provideTaiga()` inside `ThemeModule` (our central UI provider hub), import and export `<tui-root>` in `CoreModule` to wrap the app root, then replace every PrimeNG call in the header template with Taiga UI equivalents. The custom SCSS layout file is removed entirely — layout is done with Tailwind utility classes directly in the template.

---

## Scope

**In scope:**
- Installing `taiga-ui` and related `@taiga-ui/*` packages
- Registering `provideTaiga()` in `ThemeModule`
- Importing/exporting `TuiRoot` in `CoreModule` and wrapping `AppComponent` template in `<tui-root>`
- Migrating all 3 PrimeNG usages in the header (`pTooltip`, `pBadge`, `p-avatar`)
- Switching icons from PrimeIcons to Taiga UI icons (Material Symbols Outlined via `@taiga-ui/icons`)
- Replacing the decorative search `<input>` with `<tui-textfield>` + `tuiInput`
- Removing `header.component.scss` entirely, replacing with Tailwind `@apply`-less inline classes

**Out of scope:**
- Migrating any other component (sidebar, inventory list, dialogs, forms — all stay on PrimeNG)
- Removing PrimeNG packages
- Changing header behavior (toggle logic, theme toggle, signal bindings all stay identical)

---

## Package Installation

Run via Angular CLI schematic (handles CSS and `styles.scss` automatically):

```bash
ng add taiga-ui
```

This installs: `taiga-ui`, `@taiga-ui/core`, `@taiga-ui/kit`, `@taiga-ui/cdk`, `@taiga-ui/icons`.

> **Review after `ng add`:** The schematic may modify `angular.json` (add a Taiga UI stylesheet) and possibly `app.config.ts`. We will:
> - Accept the stylesheet addition to `angular.json` (needed for Taiga CSS custom properties)
> - **Revert any `provideTaiga()` injection into `app.config.ts`** — we handle it in `ThemeModule` instead
> - **Revert any `<tui-root>` the schematic adds** — we place it ourselves by importing/exporting in `CoreModule` and wrapping `AppComponent` template.

---

## Module / Provider Changes

### `theme.module.ts` — Add `provideTaiga()`

```typescript
import { provideTaiga } from '@taiga-ui/core';

@NgModule({
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({ ... }),  // existing — unchanged
    provideTaiga(),           // NEW
    MessageService,
  ],
})
export class ThemeModule {}
```

`provideTaiga()` registers Taiga's event plugins, dialog infrastructure, and DI tokens. It must be registered exactly once at app root level. `ThemeModule` is imported by `CoreModule` which is imported by `AppComponent` via `importProvidersFrom(CoreModule)` — so `ThemeModule` providers are root-level. ✅ Correct location.

### `core.module.ts` — Import & Export `TuiRoot`

To keep `AppComponent`'s imports clean, we will import and export `TuiRoot` in `CoreModule`:

```typescript
import { TuiRoot } from '@taiga-ui/core';

@NgModule({
  imports: [
    CommonModule,
    RouterOutlet,
    ThemeModule,
    AppLayoutComponent,
    TuiRoot                 // NEW
  ],
  exports: [
    ThemeModule,
    AppLayoutComponent,
    RouterOutlet,
    TuiRoot                 // NEW
  ]
})
export class CoreModule {}
```

---

## Template Changes

### `app.component.ts` — Wrap with `<tui-root>`

Since `AppComponent` imports `CoreModule`, it gets access to `TuiRoot` automatically:

```typescript
@Component({
  selector: 'app-root',
  imports: [CoreModule],    // Keeps CoreModule import only
  template: `
    <tui-root>
      <app-layout>
        <router-outlet />
      </app-layout>
    </tui-root>
  `,
})
export class AppComponent { ... }
```

---

### `header.component.html` — Full replacement

The entire template is rewritten using Taiga UI components for interactive elements and Tailwind classes for layout. No custom CSS class names.

**Component mapping:**

| Element | Old (PrimeNG) | New (Taiga UI v5) |
| :--- | :--- | :--- |
| Menu toggle button | `<button pTooltip="...">` + `<i class="pi pi-bars">` | `<button tuiIconButton tuiHint="..."><tui-icon icon="..."/></button>` |
| Search wrapper + input | `div.layout-topbar-search` + plain `<input>` | `<tui-textfield><input tuiInput placeholder="Quick search…"/><tui-icon tuiTextfieldIcon .../></tui-textfield>` |
| Notification button | `<button pBadge value="3" severity="danger">` | `<button tuiIconButton>` with `<tui-badge>3</tui-badge>` overlay |
| Theme toggle button | `<button pTooltip="...">` + conditional icon | `<button tuiIconButton tuiHint="..."><tui-icon [icon]="..."/></button>` |
| User avatar | `<p-avatar label="VT" shape="circle">` | `<tui-avatar text="VT" size="s">` |

**Layout skeleton (no SCSS classes):**

```html
<header class="fixed top-0 left-0 w-full h-[var(--topbar-height)] z-[997]
               flex items-center justify-between px-8 max-[991px]:px-4
               bg-[var(--bg-topbar)] backdrop-blur-md border-b border-[var(--border)]
               transition-all duration-250">

  <!-- Logo -->
  <a routerLink="/" class="flex items-center gap-3 no-underline text-[var(--text-primary)] font-bold text-xl tracking-tight">
    <span class="w-[38px] h-[38px] bg-[var(--bg-item-active)] flex items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--accent)]">
      <tui-icon icon="@tui.receipt" />
    </span>
    <span>Ruru POS</span>
  </a>

  <!-- Sidebar toggle -->
  <button tuiIconButton appearance="ghost"
          tuiHint="{{ collapsed() ? 'Expand sidebar' : 'Collapse sidebar' }}"
          class="ml-8 mr-auto max-[991px]:ml-4"
          (click)="toggleMenu()">
    <tui-icon icon="@tui.panel-left" />
  </button>

  <!-- Right-side actions -->
  <div class="flex items-center gap-3 max-[991px]:gap-2">

    <!-- Search -->
    <tui-textfield class="hidden sm:flex w-[240px] focus-within:w-[280px] transition-all duration-200">
      <tui-icon tuiTextfieldIcon icon="@tui.search" />
      <input tuiInput placeholder="Quick search… ⌘K" />
    </tui-textfield>

    <!-- Notifications -->
    <span class="relative">
      <button tuiIconButton appearance="ghost">
        <tui-icon icon="@tui.bell" />
      </button>
      <tui-badge appearance="destructive" size="xs"
                 class="absolute top-1 right-1 pointer-events-none">3</tui-badge>
    </span>

    <!-- Theme toggle -->
    <button tuiIconButton appearance="ghost"
            tuiHint="{{ themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}"
            (click)="themeService.toggleTheme()">
      <tui-icon [icon]="themeService.isDarkMode() ? '@tui.sun' : '@tui.moon'" />
    </button>

    <!-- User avatar -->
    <tui-avatar text="VT" size="s" />
  </div>
</header>
```

> **Note:** Exact Taiga UI icon names (`@tui.receipt`, `@tui.panel-left`, `@tui.search`, `@tui.bell`, `@tui.sun`, `@tui.moon`) must be confirmed against the installed `@taiga-ui/icons` package. Fallback: use Material Symbols names or SVG imports.

---

### `header.component.ts` — Updated imports

```typescript
import { Component, model, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiHint, TuiTextfield, TuiRoot } from '@taiga-ui/core';
import { TuiAvatar, TuiBadge } from '@taiga-ui/kit';
import { TuiIconsModule } from '@taiga-ui/icons'; // or specific icon set
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, TuiButton, TuiIcon, TuiHint, TuiTextfield, TuiAvatar, TuiBadge],
  templateUrl: './header.component.html',
  // no styleUrl — SCSS file deleted
})
export class AppHeaderComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();
  readonly themeService = inject(ThemeService);

  toggleMenu(): void {
    if (window.innerWidth >= 992) {
      this.collapsed.update(v => !v);
    } else {
      this.isMobileOpen.update(v => !v);
    }
  }
}
```

---

### `header.component.scss` — Deleted

The file is deleted. All layout and styling moves into Tailwind utility classes inline in the template. The PrimeNG badge `::ng-deep` override is no longer needed.

---

## CSS / Theme Considerations

- Taiga UI's CSS custom properties (e.g. `--tui-background-base`) are separate from our existing design tokens (`--bg-topbar`, `--border`, `--accent`). We continue using our own tokens for the topbar layout; only Taiga UI components (badge, avatar, hint) use Taiga's internal CSS vars.
- The `ng add taiga-ui` schematic typically adds a `@taiga-ui/core/styles/taiga-ui-global.css` import to `angular.json`. This must remain — it provides Taiga's CSS custom properties.
- Dark mode: Taiga UI's dark mode is driven by `color-scheme: dark` on `<html>`. Our existing dark mode sets the class `.ruru-dark` on `<html>`. We need to verify that Taiga UI's dark mode tokens activate correctly; if not, we may need to tell Taiga UI about our `darkModeSelector` (documented as a `TuiThemeService` option in v5).

---

## Verification Plan

1. **Build passes** — `npm run build` exits 0, no TypeScript errors.
2. **Tests pass** — `npm test` exits 0.
3. **Visual verification** — Browser subagent confirms:
   - Header renders correctly in both light and dark mode.
   - Sidebar toggle works on desktop (collapse) and mobile (drawer open).
   - Tooltip appears on toggle and theme buttons.
   - Badge shows "3" on the bell icon.
   - Avatar shows "VT" initials.
   - Search input expands on focus.
   - No visual regressions on the inventory page below the header.
