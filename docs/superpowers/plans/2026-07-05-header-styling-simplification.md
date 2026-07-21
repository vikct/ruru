# Header Styling & Theme Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure CSS variable mapping for Taiga UI v5 to match our design tokens, simplify the header HTML template class list, recreate `header.component.scss` with semantic layout styles, and bind the active theme attribute to `<tui-root>`.

---

### Task 1: Global Token Configuration and Dark Mode Binding

- [ ] **Step 1: Update Global Tokens**
  Modify: `angular/src/app/core/theme/_tokens.scss`
  Add the Taiga UI v5 theme mappings under the `:root` selector:
  ```scss
  // Taiga UI v5 theme mappings
  --tui-text-primary: var(--text-primary);
  --tui-text-secondary: var(--text-muted);
  --tui-background-neutral-1-hover: var(--bg-item-hover);
  --tui-background-neutral-1-pressed: var(--bg-item-active);
  ```
- [ ] **Step 2: Bind theme to `<tui-root>` in `AppComponent`**
  Modify: `angular/src/app/app.component.ts`
  Inject `ThemeService` and bind `[attr.tuiTheme]="themeService.isDarkMode() ? 'dark' : null"` on `<tui-root>`.
- [ ] **Step 3: Verify build compiles**
  Run: `npm run build` in `angular/`

---

### Task 2: Component Stylesheet Creation and HTML Template Update

- [ ] **Step 1: Update Header TypeScript Component**
  Modify: `angular/src/app/core/layout/header/header.component.ts`
  Re-add reference to component stylesheet: `styleUrl: './header.component.scss'`.
- [ ] **Step 2: Recreate Header SCSS File**
  Create: `angular/src/app/core/layout/header/header.component.scss`
  Add BEM layout classes using Tailwind `@apply` directives:
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
- [ ] **Step 3: Update Header HTML Template**
  Modify: `angular/src/app/core/layout/header/header.component.html`
  - Re-write the layout tags to use the semantic BEM CSS classes.
  - Simplify button declarations by removing inline utility classes and setting `appearance="flat-grayscale"`.
- [ ] **Step 4: Verify build and tests**
  Run: `npm run build` and `npm test` in `angular/`
