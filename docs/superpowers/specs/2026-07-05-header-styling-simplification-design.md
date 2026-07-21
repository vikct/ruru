# Header Styling & Theme Simplification Design Spec

## Overview

Simplify the styling class lists used in `AppHeaderComponent` template by mapping Taiga UI v5 core CSS variables to our design tokens. This removes verbose Tailwind overrides and ensures that Taiga UI components respond automatically to the dark/light theme switch.

---

## Technical Architecture & Modifications

### 1. Global CSS Variable Mappings
- **File**: `angular/src/app/core/theme/_tokens.scss`
- **Changes**: Map Taiga UI's internal CSS variables to our existing responsive design tokens inside `:root`. Because these variables evaluate dynamically, any theme shift that toggles the `.ruru-dark` class will automatically update Taiga's theme variables.

```scss
:root {
  // ... existing tokens ...

  // Taiga UI v5 theme mappings
  --tui-text-primary: var(--text-primary);
  --tui-text-secondary: var(--text-muted);
  --tui-background-neutral-1-hover: var(--bg-item-hover);
  --tui-background-neutral-1-pressed: var(--bg-item-active);
}
```

---

### 2. Layout Integration / Dark Mode Bridging
- **File**: `angular/src/app/app.component.ts`
- **Changes**: Inject `ThemeService` and bind the `[attr.tuiTheme]` attribute to `<tui-root>`. This informs Taiga UI's root component about the active theme state.

```typescript
import { Component, inject } from '@angular/core';
import { CoreModule } from './core/core.module';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [CoreModule],
  template: `
    <tui-root [attr.tuiTheme]="themeService.isDarkMode() ? 'dark' : null">
      <app-layout>
        <router-outlet />
      </app-layout>
    </tui-root>
  `,
})
export class AppComponent {
  readonly themeService = inject(ThemeService);
}
```

---

### 3. Template & Stylesheet Simplification
- **HTML Template**: `angular/src/app/core/layout/header/header.component.html`
- **Stylesheet**: `angular/src/app/core/layout/header/header.component.scss`
- **Changes**:
  - Remove all verbose Tailwind utility classes from the template, keeping semantic class names (`layout-topbar`, `layout-topbar-logo`, `layout-menu-button`, `layout-topbar-search`, `layout-topbar-menu`).
  - Offload topbar, logo, search width transitions, and positioning styling to the `header.component.scss` stylesheet using Tailwind `@apply` directives.
  - Remove the inline override button classes (`!w-10 !h-10 !rounded-full text-[var(--text-muted)] ...`).
  - Use `appearance="flat-grayscale"` for standard buttons to utilize Taiga's native hover states and circular backgrounds.

#### Simplified Template Layout (`header.component.html`):
```html
<header class="layout-topbar">
  <!-- Logo -->
  <a class="layout-topbar-logo" routerLink="/">
    <div class="logo-icon-wrapper">
      <tui-icon icon="@tui.receipt" class="text-xl" />
    </div>
    <span>Ruru POS</span>
  </a>

  <!-- Sidebar toggle button -->
  <button
    tuiIconButton
    type="button"
    appearance="flat-grayscale"
    tuiHint="{{ collapsed() ? 'Expand sidebar' : 'Collapse sidebar' }}"
    tuiHintDirection="bottom"
    class="layout-menu-button"
    (click)="toggleMenu()"
  >
    <tui-icon icon="@tui.menu" />
  </button>

  <div class="layout-topbar-menu">
    <!-- Global search -->
    <tui-textfield tuiSize="m" class="layout-topbar-search">
      <tui-icon tuiTextfieldIcon icon="@tui.search" />
      <input tuiInput placeholder="Quick search… ⌘K" />
    </tui-textfield>

    <!-- Notifications -->
    <span class="relative inline-flex">
      <button
        tuiIconButton
        type="button"
        appearance="flat-grayscale"
      >
        <tui-icon icon="@tui.bell" />
      </button>
      <span
        tuiBadge
        size="s"
        appearance="destructive"
        class="absolute top-1 right-1 pointer-events-none"
      >
        3
      </span>
    </span>

    <!-- Theme Toggle -->
    <button
      tuiIconButton
      type="button"
      appearance="flat-grayscale"
      tuiHint="{{ themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}"
      tuiHintDirection="bottom"
      (click)="themeService.toggleTheme()"
    >
      <tui-icon [icon]="themeService.isDarkMode() ? '@tui.sun' : '@tui.moon'" />
    </button>

    <!-- User profile avatar button -->
    <button
      tuiIconButton
      type="button"
      appearance="flat-grayscale"
      class="p-0 overflow-hidden"
    >
      <span tuiAvatar="VT" size="s"></span>
    </button>
  </div>
</header>
```

#### Clean Component Stylesheet (`header.component.scss`):
```scss
@reference "tailwindcss";

.layout-topbar {
  @apply fixed h-[var(--topbar-height)] z-[997] left-0 top-0 w-full px-8 flex items-center justify-between bg-[var(--bg-topbar)] backdrop-blur-md border-b border-[var(--border)] transition-all duration-250 max-[991px]:px-4;
}

.layout-topbar-logo {
  @apply flex items-center gap-3 no-underline text-[var(--text-primary)] font-bold text-xl tracking-tight;

  .logo-icon-wrapper {
    @apply w-[38px] h-[38px] bg-[var(--bg-item-active)] flex items-center justify-center rounded-[10px] border border-[var(--border)] text-xl transition-colors duration-200 text-[var(--accent)];
  }

  &:hover {
    .logo-icon-wrapper {
      @apply bg-[var(--accent-glow)];
    }
  }
}

.layout-menu-button {
  @apply ml-8 mr-auto max-[991px]:ml-4;
}

.layout-topbar-menu {
  @apply flex items-center gap-3 max-[991px]:gap-2;
}

.layout-topbar-search {
  @apply hidden sm:flex w-[240px] focus-within:w-[280px] transition-all duration-200;
}
```

---

## Verification Plan

1. **Build passes** — `npm run build` exits 0.
2. **Tests pass** — `npm test` exits 0.
3. **Visual validation** — Browser subagent verifies:
   - Buttons render with native circular shape and correct dimensions.
   - Hover states show theme-compliant backgrounds and colors in both light and dark modes.
   - Global search, avatar, and badge remain aligned.
