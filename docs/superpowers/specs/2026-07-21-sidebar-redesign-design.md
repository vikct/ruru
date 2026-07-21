# Sidebar UI Redesign Spec

## Overview
Redesign the sidebar to look like a floating glass card with rounded rectangular edges, conforming to the iOS liquid glass design language. In collapsed desktop mode, the sidebar transforms into a vertical pill shape, and its highlights transform into circles.

---

## Technical Architecture & Modifications

### 1. HTML Template Redesign
- **File**: [sidebar.component.html](file:///Users/victortan/Repos/ruru/angular/src/app/core/layout/sidebar/sidebar.component.html)
- **Changes**:
  - Restructure wrapper to `.layout-sidebar-container` (nested under the host, which is transparent).
  - Add `.sidebar-header-overlay` for top translucent gradient fade.
  - Wrap menu list in `.sidebar-menu-scroll-container` to enable scrolling.
  - Wrap footer in `.sidebar-footer-container` with `.sidebar-footer-bg` for translucent gradient blur.
  - Update `[tuiHint]` tooltips to condition on `showTooltip()`.

```html
<div class="layout-sidebar-container" [class.layout-sidebar-collapsed]="collapsed()">
  <!-- Sticky Header overlay (gradient translucent) -->
  <div class="sidebar-header-overlay"></div>

  <!-- Scrollable Menu container -->
  <div class="sidebar-menu-scroll-container">
    <ul class="layout-menu">
      @for (item of menuItems(); track item.route) {
        <li>
          <a
            [routerLink]="item.route"
            routerLinkActive="active-route"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="layout-menuitem-root-action"
            [tuiHint]="showTooltip() ? item.label : ''"
            tuiHintDirection="end"
            (click)="isMobileOpen.set(false)"
          >
            <tui-icon [icon]="item.icon" class="layout-menuitem-icon" />
            @if (!collapsed() || isMobileOpen()) {
              <span class="layout-menuitem-text">{{ item.label }}</span>
            }
          </a>
        </li>
      }
    </ul>
  </div>

  <!-- Sticky Footer overlay (gradient translucent) + Footer Content -->
  <div class="sidebar-footer-container">
    <div class="sidebar-footer-bg"></div>
    <div class="sidebar-footer-content">
      @if (currentUser(); as user) {
        <div class="user-profile" [tuiHint]="showTooltip() ? (user.firstName + ' (' + userRole() + ')') : ''" tuiHintDirection="end">
          <span [tuiAvatar]="avatarLabel()" size="s" class="footer-avatar"></span>
          @if (!collapsed() || isMobileOpen()) {
            <div class="user-details">
              <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
              <span class="user-role">{{ userRole() }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="user-profile" [routerLink]="['/auth/login']" style="cursor: pointer;" [tuiHint]="showTooltip() ? 'Sign In' : ''" tuiHintDirection="end">
          <span tuiAvatar size="s" class="footer-avatar">
            <tui-icon icon="@tui.user" />
          </span>
          @if (!collapsed() || isMobileOpen()) {
            <div class="user-details">
              <span class="user-name">Guest</span>
              <span class="user-role">Click to Sign In</span>
            </div>
          }
        </div>
      }
      <div class="register-status" [tuiHint]="showTooltip() ? 'Register Open · Shift 1' : ''" tuiHintDirection="end">
        <span class="status-dot"></span>
        @if (!collapsed() || isMobileOpen()) {
          <span class="status-text">Register Open · Shift 1</span>
        }
      </div>
    </div>
  </div>
</div>
```

---

## Technical Details

### 2. SCSS Stylesheet Redesign
- **File**: [sidebar.component.scss](file:///Users/victortan/Repos/ruru/angular/src/app/core/layout/sidebar/sidebar.component.scss)
- **Changes**:
  - Make `:host` transparent, sizing it to match the layout grid.
  - Position `.layout-sidebar-container` with `1rem` inset from top/left/bottom and `0.5rem` inset from the right.
  - Implement 3D iOS Liquid Glass properties on `.layout-sidebar-container` (backdrop filter with blur + saturation boost, dual borders via `box-shadow` inset, outer diffused shadow, glare gradient via `::before`).
  - Style scrollable content area (`.sidebar-menu-scroll-container`) with custom WebKit scrollbar and margins/paddings.
  - Left-align active menu highlights with `border-radius: 9999px` (pill) and extra spacing between icon and text (`gap: 1.25rem`).
  - Implement sticky header/footer gradient translucency.
  - Add transition rules for collapsed state (`border-radius: 40px` for card, circular `border-radius: 50%` highlights).

---

### 3. Layout Styles Adjustment
- **File**: [layout.component.scss](file:///Users/victortan/Repos/ruru/angular/src/app/core/layout/layout.component.scss)
- **Changes**:
  - Adjust `.layout-main-container` margin-left to `calc(var(--sidebar-width) + 1.5rem)` in expanded desktop mode, to account for the inset card.
  - Adjust `.layout-main-container` margin-left in collapsed desktop mode to `calc(var(--sidebar-collapsed-width) + 1.5rem)`.

---

### 4. TypeScript Logic Updates
- **File**: [sidebar.component.ts](file:///Users/victortan/Repos/ruru/angular/src/app/core/layout/sidebar/sidebar.component.ts)
- **Changes**:
  - Add a computed `showTooltip` property:
    ```typescript
    readonly showTooltip = computed(() => this.collapsed() && !this.isMobileOpen());
    ```

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no compilation or template errors.

### Manual Verification
- Resize the browser window between mobile and desktop widths.
- Verify that the expanded desktop sidebar displays as a beautiful floating glass card inset from the edges.
- Verify that hovering and selecting menu items shows a pill-shaped liquid glass overlay.
- Collapse the sidebar on desktop: verify that it transitions to a vertical pill shape, and that menu hovers/selections are perfect circles.
- Hover over items in expanded and collapsed mode, verifying that tooltips only appear in collapsed desktop mode.
- Scroll through the menu list to confirm it scroll-overflows, with items sliding underneath the translucent header/footer overlays.
