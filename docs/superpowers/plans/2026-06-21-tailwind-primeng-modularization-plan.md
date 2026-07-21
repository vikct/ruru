# Tailwind CSS v4 & PrimeNG Style Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up component-specific stylesheets and modularize PrimeNG style overrides into separate global CSS files imported via Tailwind CSS v4.

**Architecture:** Use Tailwind v4's `@theme` directive to map custom CSS color properties to Tailwind color utilities, write component-level overrides in modular CSS files using `@apply`, import them into the main `tailwind.css` file, and remove component-scoped overrides.

**Tech Stack:** Angular 18+, Tailwind CSS v4, PrimeNG 18+

## Global Constraints
- Do not modify adjacent component layout or logic.
- Keep CSS theme variable values intact (e.g. `--bg-base`, `--border`) so dark/light mode remains functional.
- Maintain consistent padding, colors, and layout configurations.

---

### Task 1: Set up Tailwind v4 theme colors

**Files:**
- Modify: `angular/src/tailwind.css`

**Interfaces:**
- Produces: Tailwind color utilities (e.g., `bg-base`, `border-border`, `text-primary`, `bg-hover`, `bg-active`) to be used in `@apply` statements.

- [ ] **Step 1: Add `@theme` mappings to `tailwind.css`**
  Modify `angular/src/tailwind.css` to add the `@theme` block mapping our CSS variables to Tailwind color classes:
  ```css
  @import "tailwindcss";

  @theme {
    --color-base: var(--bg-base);
    --color-sidebar: var(--bg-sidebar);
    --color-topbar: var(--bg-topbar);
    --color-border: var(--border);
    --color-primary: var(--text-primary);
    --color-muted: var(--text-muted);
    --color-dim: var(--text-dim);
    --color-accent: var(--accent);
    --color-accent-light: var(--accent-light);
    --color-accent-glow: var(--accent-glow);
    --color-hover: var(--bg-item-hover);
    --color-active: var(--bg-item-active);
  }

  @custom-variant dark (&:where(.ruru-dark, .ruru-dark *));
  ```

- [ ] **Step 2: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation without PostCSS warnings/errors.

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: configure Tailwind v4 theme with theme variables"`

---

### Task 2: Modularize Toolbar Styling

**Files:**
- Create: `angular/src/app/core/theme/ui/toolbar.css`
- Modify: `angular/src/tailwind.css`

**Interfaces:**
- Consumes: Tailwind v4 theme variables defined in Task 1.
- Produces: Global styles for `.p-toolbar` matching the Sakai-NG toolbar specifications.

- [ ] **Step 1: Create `toolbar.css` file**
  Create `angular/src/app/core/theme/ui/toolbar.css` with the following content:
  ```css
  .p-toolbar {
    @apply bg-base border border-border p-4 rounded-[3rem] mb-6 flex items-center justify-between flex-wrap gap-4;
  }
  .p-toolbar-group-start,
  .p-toolbar-group-end {
    @apply flex items-center gap-2 flex-wrap;
  }
  ```

- [ ] **Step 2: Import `toolbar.css` in `tailwind.css`**
  Modify `angular/src/tailwind.css` to append:
  ```css
  @import "./app/core/theme/ui/toolbar.css";
  ```

- [ ] **Step 3: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation.

- [ ] **Step 4: Commit**
  Run: `git add angular/src/app/core/theme/ui/toolbar.css angular/src/tailwind.css`
  Run: `git commit -m "style: modularize global toolbar styles"`

---

### Task 3: Modularize Data Table Styling

**Files:**
- Create: `angular/src/app/core/theme/ui/table.css`
- Modify: `angular/src/tailwind.css`

**Interfaces:**
- Consumes: Tailwind v4 theme variables defined in Task 1.
- Produces: Global styles for `.p-datatable` matching the Sakai-NG table design.

- [ ] **Step 1: Create `table.css` file**
  Create `angular/src/app/core/theme/ui/table.css` with the following content:
  ```css
  .p-datatable {
    .p-datatable-header {
      @apply bg-transparent border-none pb-4;
    }

    .p-datatable-thead > tr > th {
      @apply bg-base text-primary font-semibold border-b border-border px-4 py-3 text-sm transition-colors duration-200;
    }

    .p-datatable-tbody > tr {
      @apply bg-sidebar text-primary border-b border-border transition-colors duration-200;

      &:hover {
        @apply bg-hover !important;
      }

      &.p-highlight {
        @apply bg-active text-accent !important;
      }
    }

    .p-datatable-tbody > tr > td {
      @apply px-4 py-3.5 text-sm border-none;
    }
  }
  ```

- [ ] **Step 2: Import `table.css` in `tailwind.css`**
  Modify `angular/src/tailwind.css` to append:
  ```css
  @import "./app/core/theme/ui/table.css";
  ```

- [ ] **Step 3: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation.

- [ ] **Step 4: Commit**
  Run: `git add angular/src/app/core/theme/ui/table.css angular/src/tailwind.css`
  Run: `git commit -m "style: modularize global datatable styles"`

---

### Task 4: Modularize Dialog Styling

**Files:**
- Create: `angular/src/app/core/theme/ui/dialog.css`
- Modify: `angular/src/tailwind.css`

**Interfaces:**
- Consumes: Tailwind v4 theme variables defined in Task 1.
- Produces: Global styles for `.p-dialog` overrides.

- [ ] **Step 1: Create `dialog.css` file**
  Create `angular/src/app/core/theme/ui/dialog.css` with the following content:
  ```css
  .p-dialog {
    @apply rounded-xl overflow-hidden border border-border shadow-2xl;

    .p-dialog-header {
      @apply bg-sidebar text-primary border-b border-border px-6 py-5 font-bold;

      .p-dialog-title {
        @apply text-lg;
      }
    }

    .p-dialog-content {
      @apply bg-sidebar text-primary p-6;
    }

    .p-dialog-footer {
      @apply bg-sidebar border-t border-border px-6 py-4;
    }
  }
  ```

- [ ] **Step 2: Import `dialog.css` in `tailwind.css`**
  Modify `angular/src/tailwind.css` to append:
  ```css
  @import "./app/core/theme/ui/dialog.css";
  ```

- [ ] **Step 3: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation.

- [ ] **Step 4: Commit**
  Run: `git add angular/src/app/core/theme/ui/dialog.css angular/src/tailwind.css`
  Run: `git commit -m "style: modularize global dialog styles"`

---

### Task 5: Modularize Inputs & Controls Styling

**Files:**
- Create: `angular/src/app/core/theme/ui/inputs.css`
- Modify: `angular/src/tailwind.css`

**Interfaces:**
- Consumes: Tailwind v4 theme variables defined in Task 1.
- Produces: Global overrides for `.p-inputtext`, `.p-inputnumber-input`, `.p-select`, and dropdown panels.

- [ ] **Step 1: Create `inputs.css` file**
  Create `angular/src/app/core/theme/ui/inputs.css` with the following content:
  ```css
  .p-inputtext,
  .p-inputnumber-input,
  .p-select {
    @apply bg-base! border border-border! text-primary! rounded-md px-3 py-2 text-sm transition-all duration-150;

    &:focus,
    &:focus-within {
      @apply border-accent! ring-2 ring-accent-glow! outline-none;
    }
  }

  .p-select {
    @apply p-0! inline-flex items-center;

    .p-select-label {
      @apply px-3 py-2! text-primary!;
    }

    .p-select-dropdown {
      @apply text-muted pr-3;
    }
  }

  .p-select-overlay {
    @apply bg-sidebar! border border-border! shadow-lg!;

    .p-select-list-container {
      @apply bg-sidebar;
    }

    .p-select-item {
      @apply text-primary! px-3 py-2! text-sm;

      &:hover {
        @apply bg-hover! !important;
      }

      &.p-highlight {
        @apply bg-active! text-accent! font-medium;
      }
    }
  }
  ```

- [ ] **Step 2: Import `inputs.css` in `tailwind.css`**
  Modify `angular/src/tailwind.css` to append:
  ```css
  @import "./app/core/theme/ui/inputs.css";
  ```

- [ ] **Step 3: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation.

- [ ] **Step 4: Commit**
  Run: `git add angular/src/app/core/theme/ui/inputs.css angular/src/tailwind.css`
  Run: `git commit -m "style: modularize global input & select dropdown styles"`

---

### Task 6: Clean Up Local Component Styles

**Files:**
- Modify: `angular/src/app/features/inventory/inventory.component.scss`

**Interfaces:**
- Consumes: Global PrimeNG classes and Tailwind v4 variables applied globally.

- [ ] **Step 1: Clean overrides from `inventory.component.scss`**
  Remove all the `:host ::ng-deep` PrimeNG rules from `angular/src/app/features/inventory/inventory.component.scss`, as they are now globalized in Task 2 to Task 5. Keep only component-specific styles that are not globalized (if any exist).
  Wait, let's look at `inventory.component.scss`. Lines 1 to 167 were all `:host ::ng-deep` overrides. We can replace the file contents to empty or keep the bare minimum styles.
  Let's verify lines 1-167 are indeed only the overrides we modularized. Yes, we saw that:
  - Lines 1-22: `.p-toolbar`
  - Lines 24-63: `.p-datatable`
  - Lines 65-95: `.p-dialog`
  - Lines 97-117: `.p-inputtext, .p-inputnumber-input, .p-select`
  - Lines 119-134: `.p-select`
  - Lines 136-161: `.p-select-overlay`
  - Lines 163-167: `.mr-2`
  We can replace all of it!

- [ ] **Step 2: Run build to verify compilation**
  Run: `npm run build` in `angular/`
  Expected: Successful compilation.

- [ ] **Step 3: Commit**
  Run: `git add angular/src/app/features/inventory/inventory.component.scss`
  Run: `git commit -m "style: clean up local component style overrides from inventory"`
