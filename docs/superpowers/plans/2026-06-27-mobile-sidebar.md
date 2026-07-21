# Mobile Sidebar Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the sidebar as a full-height overlay drawer when the screen width goes below 992px, fixing the z-index overlap issue and making it interactive.

**Architecture:** We will set the sidebar host component to `top: 0`, `height: 100vh`, and `z-index: 999` using a mobile media query in the sidebar stylesheet. Tapping the navigation links in the sidebar on mobile will auto-close the drawer by updating the two-way `isMobileOpen` model signal.

**Tech Stack:** Angular 21, Tailwind CSS v4, PrimeNG.

## Global Constraints
- Target Breakpoint: Below 992px (`max-width: 991px`).
- Sidebar Position on Mobile: `top: 0`, `height: 100vh`, `left: 0`, `z-index: 999`.
- Backdrop Mask: `z-index: 998`.
- Topbar: `z-index: 997`.

---

### Task 1: Mobile Sidebar Style Overrides

**Files:**
- Modify: `angular/src/app/core/layout/sidebar/sidebar.component.scss`

**Interfaces:**
- Produces: Sidebar layout overrides for viewports < 992px.

- [ ] **Step 1: Write host mobile overrides**

Add media query overrides to the bottom of the stylesheet.

```scss
@media (max-width: 991px) {
  :host {
    top: 0 !important;
    height: 100vh !important;
    z-index: 999 !important;
  }
}
```

- [ ] **Step 2: Verify the compilation**

Run: `npm run build` in `angular/`
Expected: Compile succeeds with exit code 0.

- [ ] **Step 3: Commit styling changes**

```bash
git add angular/src/app/core/layout/sidebar/sidebar.component.scss
git commit -m "style: apply full-height mobile overlay styles to sidebar component"
```

---

### Task 2: Auto-close Sidebar on Link Navigation

**Files:**
- Modify: `angular/src/app/core/layout/sidebar/sidebar.component.html`

**Interfaces:**
- Consumes: `isMobileOpen` two-way model signal.

- [ ] **Step 1: Add click handler to menu links**

Update the link (`<a>`) tag to set `isMobileOpen` to `false` when a menu item is clicked.

```html
        <a
          [routerLink]="item.route"
          routerLinkActive="active-route"
          [routerLinkActiveOptions]="{ exact: item.route === '/' }"
          class="layout-menuitem-root-action"
          [pTooltip]="collapsed() ? item.label : ''"
          tooltipPosition="right"
          (click)="isMobileOpen.set(false)"
        >
```

- [ ] **Step 2: Verify the compilation**

Run: `npm run build` in `angular/`
Expected: Compile succeeds with exit code 0.

- [ ] **Step 3: Commit interactive changes**

```bash
git add angular/src/app/core/layout/sidebar/sidebar.component.html
git commit -m "feat: close mobile sidebar drawer on navigation selection"
```
