# Mobile Sidebar Drawer Design Spec

This document details the design and implementation for styling the sidebar as a full-height overlay drawer when the screen width goes below 992px.

## 1. Requirements & UX Behavior

- **Trigger Breakpoint**: Below 992px (`max-width: 991px`).
- **Sidebar Position**: Full-height drawer starting from the top-left of the viewport (`top: 0`, `height: 100vh`, `left: 0`).
- **Layering (z-index)**:
  - Mobile Sidebar: `z-index: 999` (above the backdrop mask).
  - Backdrop Mask (`.layout-mask`): `z-index: 998` (above the content and topbar).
  - Topbar (`.layout-topbar`): `z-index: 997`.
- **Auto-Close on Item Selection**: Clicking any navigation link in the sidebar on mobile will set `isMobileOpen` to `false`, closing the drawer.
- **Close on Backdrop Click**: Clicking the backdrop mask outside the sidebar will set `isMobileOpen` to `false`, closing the drawer.

## 2. Technical Architecture & Modifications

### A. Sidebar Component Style Changes
- **File**: `angular/src/app/core/layout/sidebar/sidebar.component.scss`
- **Changes**: Add a media query `max-width: 991px` for the `:host` selector:
  ```scss
  @media (max-width: 991px) {
    :host {
      top: 0;
      height: 100vh;
      z-index: 999;
    }
  }
  ```

### B. Sidebar Template Interactive Changes
- **File**: `angular/src/app/core/layout/sidebar/sidebar.component.html`
- **Changes**: Bind a click listener to the navigation items to auto-close the drawer on mobile:
  ```html
  <a
    [routerLink]="item.route"
    ...
    (click)="isMobileOpen.set(false)"
  >
  ```

### C. Layout Shell Styles Verification
- **File**: `angular/src/app/core/layout/layout.component.scss`
- **Verification**: Ensure the existing `transform: translateX(-100%)` (default hidden state) and `transform: translateX(0)` (when `.layout-mobile-active` is applied to wrapper) transitions work perfectly with the new z-index and top/height values.

## 3. Verification & Testing

### Automated Verification
- Verify the Angular application compiles without warnings:
  ```bash
  npm run build
  ```

### Manual Verification Checklist
1. **Desktop view (>= 992px)**:
   - Sidebar is docked on the left below the topbar (`top: var(--topbar-height)`).
   - Sidebar toggle collapses the sidebar (icon-only mode).
2. **Mobile view (< 992px)**:
   - Sidebar is hidden by default.
   - Clicking hamburger menu toggles the sidebar drawer open (sliding in from the left and overlaying the topbar).
   - Backdrop mask appears and dims the rest of the screen.
   - Links in the sidebar are interactive and clickable.
   - Clicking a link navigates to the page and automatically closes the sidebar.
   - Clicking the backdrop mask closes the sidebar.
