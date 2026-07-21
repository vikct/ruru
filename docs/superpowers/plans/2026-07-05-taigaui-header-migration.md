# Taiga UI v5 Header Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `AppHeaderComponent` to Taiga UI v5 using `provideTaiga()` in `ThemeModule`, wrapping `AppComponent` template in `<tui-root>` (via `CoreModule`), and removing `header.component.scss` in favor of inline Tailwind classes.

---

### Task 1: Package Installation and Configuration Reversion

- [ ] **Step 1: Install Taiga UI packages using schematic**
  Run: `npx -y ng add taiga-ui --skip-confirmation` (or similar command) in `angular/`
- [ ] **Step 2: Revert automated configuration edits**
  Check `git diff` for changes in `app.config.ts`, `app.component.ts`, or any other root files modified by `ng add`.
  Revert any automated injection of `provideTaiga()` in `app.config.ts` and ensure it is NOT added there. Ensure no unwanted root tags are added by schematic in `app.component.ts`.
- [ ] **Step 3: Verify base configuration compiles**
  Run: `npm run build` in `angular/` to ensure packages are installed and baseline builds without errors.

---

### Task 2: Provider and Module Configuration

- [ ] **Step 1: Register `provideTaiga()` in `ThemeModule`**
  Modify: `angular/src/app/core/theme/theme.module.ts`
  Import `provideTaiga` from `@taiga-ui/core` and add it to `providers` array.
- [ ] **Step 2: Import and Export `TuiRoot` in `CoreModule`**
  Modify: `angular/src/app/core/core.module.ts`
  Import `TuiRoot` from `@taiga-ui/core` and add it to both `imports` and `exports` arrays.
- [ ] **Step 3: Wrap `AppComponent` template with `<tui-root>`**
  Modify: `angular/src/app/app.component.ts`
  Wrap the template layout with `<tui-root>`:
  ```html
  <tui-root>
    <app-layout>
      <router-outlet />
    </app-layout>
  </tui-root>
  ```
- [ ] **Step 4: Verify build compiles**
  Run: `npm run build` in `angular/` to ensure provider injection compiles successfully.

---

### Task 3: Component and Template Migration

- [ ] **Step 1: Update Header TypeScript Component imports**
  Modify: `angular/src/app/core/layout/header/header.component.ts`
  - Remove imports of PrimeNG modules (`TooltipModule`, `BadgeModule`, `AvatarModule`).
  - Import Taiga UI v5 components: `TuiButton` (for button directive), `TuiIcon`, `TuiHint`, `TuiTextfield` (from `@taiga-ui/core`), `TuiAvatar`, `TuiBadge` (from `@taiga-ui/kit`), and `RouterLink` (from `@angular/router`).
  - Add these to the component `imports` array.
  - Delete `styleUrl: './header.component.scss'` reference.
- [ ] **Step 2: Update Header HTML Template**
  Modify: `angular/src/app/core/layout/header/header.component.html`
  - Re-write layout markup to use Tailwind utility classes directly.
  - Swap out `<button pTooltip...>` toggle buttons with `<button tuiIconButton tuiHint="..." appearance="ghost">` using `<tui-icon icon="@tui.panel-left">` or equivalent icons.
  - Swap out `<p-avatar>` with `<tui-avatar text="VT" size="s">`.
  - Swap out notifications button with `<button tuiIconButton appearance="ghost">` containing `<tui-icon icon="@tui.bell">` and overlaid with `<tui-badge appearance="destructive" size="xs" class="absolute top-1 right-1 pointer-events-none">3</tui-badge>`.
  - Swap out search with `<tui-textfield><tui-icon tuiTextfieldIcon icon="@tui.search"/><input tuiInput placeholder="Quick search… ⌘K"/></tui-textfield>`.
- [ ] **Step 3: Remove custom styles**
  Delete: `angular/src/app/core/layout/header/header.component.scss`
- [ ] **Step 4: Verify compilation and tests**
  Run: `npm run build` and `npm test` in `angular/` to verify success.
