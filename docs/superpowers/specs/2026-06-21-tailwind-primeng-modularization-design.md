# Design Spec: Tailwind CSS v4 & PrimeNG Style Modularization

This document outlines the architecture and plan for migrating the local PrimeNG style overrides from a component-specific stylesheet to modular global styles using Tailwind CSS v4's theme system and `@apply` directive.

## Goals

1. **Reduce Style Complexity**: Simplify components by offloading custom PrimeNG styling selectors to global rules.
2. **Promote Uniformity**: Ensure that components like tables (`p-table`), toolbars (`p-toolbar`), dialogs (`p-dialog`), and input fields render consistently across the entire application without repeating styling rules.
3. **Keep Code Modular**: Split the overrides into distinct CSS files based on component type and compile them under Tailwind's central build pipeline.
4. **Preserve Current Color Palette**: Keep the existing Sakai-NG design token values (e.g. `--bg-base`, `--border`) by exposing them as Tailwind v4 theme variables.

## Architectural Changes

We will register our existing theme variables as native Tailwind colors and import component-specific overrides into the main `tailwind.css` file.

### 1. Tailwind Color Palette Mapping
We map the custom CSS properties to Tailwind tokens inside the `@theme` block:

```css
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
```

### 2. File Organization
We will create four modular stylesheet files in `src/app/core/theme/ui/`:

* **`toolbar.css`**: Overrides for `p-toolbar`
* **`table.css`**: Overrides for `p-table` and pagination elements
* **`dialog.css`**: Overrides for `p-dialog`
* **`inputs.css`**: Overrides for inputs (`p-inputtext`, `p-inputnumber`), and dropdowns (`p-select`)

They will be imported in `src/tailwind.css` like so:

```css
@import "tailwindcss";

@theme { ... }

@custom-variant dark (&:where(.ruru-dark, .ruru-dark *));

@import "./app/core/theme/ui/toolbar.css";
@import "./app/core/theme/ui/table.css";
@import "./app/core/theme/ui/dialog.css";
@import "./app/core/theme/ui/inputs.css";
```

### 3. Cleaning Local Component Styles
We will clean up the overrides in `src/app/features/inventory/inventory.component.scss`, as they will now be applied globally.

---

## Verification Plan

### Automated Verifications
* Run `npm run build` inside `angular/` to ensure no PostCSS compilation or build-time syntax errors are introduced.

### Manual Verifications
* Navigate to the inventory page (`http://localhost:2510/inventory`).
* Verify that the tables, toolbars, dialogs, and input styling match the layout and design precisely.
* Check dark/light mode toggling to ensure the mapped colors transition correctly.
