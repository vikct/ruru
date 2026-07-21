# Sidebar UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the sidebar UI to be a floating card with rounded rectangular edges, fitting the iOS liquid glass design language, with a shape-shifting collapsed desktop mode (vertical pill sidebar and circular highlights) and sticky translucent header/footer overlays.

**Architecture:** We wrap the sidebar template inside a `.layout-sidebar-container` glass shell. We implement custom scrollable zones with gradient translucent sticky masks, dynamic tooltip toggles in TS, and responsive media query SCSS styles to transition the layout sizes.

**Tech Stack:** Angular 21, SCSS, Taiga UI v5

## Global Constraints
- Avoid using TailwindCSS unless explicitly requested; style components using standard nested SCSS.
- Maintain existing codebase conventions and match Saka-NG styles.
- Ensure all automated tests compile and pass.

---

### Task 1: TypeScript Logic Updates and Unit Tests

**Files:**
- Modify: `angular/src/app/core/layout/sidebar/sidebar.component.ts`
- Create: `angular/src/app/core/layout/sidebar/sidebar.component.spec.ts`

**Interfaces:**
- Consumes: `AppSidebarComponent` collapsed and isMobileOpen signals.
- Produces: `showTooltip` computed signal that evaluates to `true` only when the sidebar is collapsed and not open in mobile drawer mode.

- [ ] **Step 1: Create the unit test file**

Write the spec file `angular/src/app/core/layout/sidebar/sidebar.component.spec.ts` with test cases verifying the tooltip behavior.

```typescript
import { TestBed } from '@angular/core/testing';
import { AppSidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

// Mock matchMedia for Taiga UI compatibility in testing environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe('AppSidebarComponent', () => {
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal({ firstName: 'Test', lastName: 'User' }),
      currentRoles: signal(['Employee']),
    };

    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the sidebar component', () => {
    const fixture = TestBed.createComponent(AppSidebarComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should only show tooltips when collapsed is true and isMobileOpen is false', () => {
    const fixture = TestBed.createComponent(AppSidebarComponent);
    const component = fixture.componentInstance;

    // Default signals set to required values
    fixture.componentRef.setInput('collapsed', true);
    fixture.componentRef.setInput('isMobileOpen', false);
    fixture.detectChanges();
    expect(component.showTooltip()).toBe(true);

    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    expect(component.showTooltip()).toBe(false);

    fixture.componentRef.setInput('collapsed', true);
    fixture.componentRef.setInput('isMobileOpen', true);
    fixture.detectChanges();
    expect(component.showTooltip()).toBe(false);
  });
});
```

- [ ] **Step 2: Add computed signal to sidebar.component.ts**

Modify `angular/src/app/core/layout/sidebar/sidebar.component.ts` to import `computed` (if not already imported) and declare the `showTooltip` computed property.

```typescript
import { Component, model, inject, computed } from '@angular/core';
// ... rest of imports unchanged

export class AppSidebarComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();

  // ... rest of injections and computed values

  readonly showTooltip = computed(() => this.collapsed() && !this.isMobileOpen());

  // ... rest of class remains unchanged
}
```

- [ ] **Step 3: Run the unit test to verify it passes**

Run: `npx vitest run angular/src/app/core/layout/sidebar/sidebar.component.spec.ts`
Expected: Test passes successfully.

- [ ] **Step 4: Commit**

```bash
git add angular/src/app/core/layout/sidebar/sidebar.component.ts angular/src/app/core/layout/sidebar/sidebar.component.spec.ts
git commit -m "feat(sidebar): add showTooltip computed logic and tests"
```

---

### Task 2: HTML Template Structure Redesign

**Files:**
- Modify: `angular/src/app/core/layout/sidebar/sidebar.component.html`

**Interfaces:**
- Consumes: `AppSidebarComponent` computed `showTooltip()`.
- Produces: Updated HTML structure with custom scroll container, translucent header/footer wrappers, and conditional tooltips.

- [ ] **Step 1: Replace template contents**

Overwrite the contents of `angular/src/app/core/layout/sidebar/sidebar.component.html` to align with the new structure:

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

- [ ] **Step 2: Commit**

```bash
git add angular/src/app/core/layout/sidebar/sidebar.component.html
git commit -m "feat(sidebar): update template layout with scroll containers and overlays"
```

---

### Task 3: Layout Spacing Adjustment

**Files:**
- Modify: `angular/src/app/core/layout/layout.component.scss`

**Interfaces:**
- Consumes: Global layout layout-wrapper class.
- Produces: CSS layout styles offset by the sidebar floating card + inset width.

- [ ] **Step 1: Update margin-left offsets in layout.component.scss**

Modify `angular/src/app/core/layout/layout.component.scss` around lines 21 and 39 to adjust the offsets for static and collapsed modes.

```scss
// Find:
.layout-main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: space-between;
  padding: calc(var(--topbar-height) + 1.5rem) 1.5rem 1.5rem 1.5rem;
  transition: margin-left var(--transition-duration) var(--transition-timing);
  margin-left: var(--sidebar-width); // Default to full sidebar offset on desktop
  
  @media (max-width: 991px) {
    margin-left: 0;
    padding-top: calc(var(--topbar-height) + 1rem);
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

// Replace with:
.layout-main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: space-between;
  padding: calc(var(--topbar-height) + 1.5rem) 1.5rem 1.5rem 1.5rem;
  transition: margin-left var(--transition-duration) var(--transition-timing);
  margin-left: calc(var(--sidebar-width) + 1.5rem); // Floating inset padding
  
  @media (max-width: 991px) {
    margin-left: 0;
    padding-top: calc(var(--topbar-height) + 1rem);
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

And update the collapsed sidebar margin-left:

```scss
// Find:
@media (min-width: 992px) {
  .layout-wrapper.layout-static-inactive {
    .layout-main-container {
      margin-left: var(--sidebar-collapsed-width);
    }
    app-sidebar {
      width: var(--sidebar-collapsed-width);
    }
  }
}

// Replace with:
@media (min-width: 992px) {
  .layout-wrapper.layout-static-inactive {
    .layout-main-container {
      margin-left: calc(var(--sidebar-collapsed-width) + 1.5rem); // Floating inset padding
    }
    app-sidebar {
      width: var(--sidebar-collapsed-width);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add angular/src/app/core/layout/layout.component.scss
git commit -m "style(layout): adjust main content margin-left for floating sidebar card"
```

---

### Task 4: SCSS Redesign for Liquid Glass Sidebar

**Files:**
- Modify: `angular/src/app/core/layout/sidebar/sidebar.component.scss`

**Interfaces:**
- Consumes: SCSS class configurations matching template redesign.
- Produces: Complete responsive styling for iOS liquid glass card, custom scroll, translucent footer/header, circular/pill highlights, and smooth hover/active transitions.

- [ ] **Step 1: Replace stylesheet content**

Overwrite the contents of `angular/src/app/core/layout/sidebar/sidebar.component.scss` to implement Approach 2:

```scss
// ──────────────────────────────────────────────────────────
// Sidebar Component Styles (iOS Liquid Glass Redesign)
// ──────────────────────────────────────────────────────────

:host {
  position: fixed;
  width: var(--sidebar-width);
  height: calc(100vh - var(--topbar-height));
  top: var(--topbar-height);
  left: 0;
  z-index: 996; // Just behind topbar (997)
  background: transparent;
  border-right: none;
  transition: width var(--transition-duration) var(--transition-timing),
              transform var(--transition-duration) var(--transition-timing);
  display: flex;
  flex-direction: column;
  pointer-events: none; // Allow clicks behind transparent host
}

// ── Floating Liquid Glass Card Container ─────────────────
.layout-sidebar-container {
  position: absolute;
  top: 1rem;
  left: 1rem;
  bottom: 1rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  pointer-events: auto; // Capture clicks inside card

  // iOS Glass Material
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(190%);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: 
    inset 0 1px 0 0 rgba(255, 255, 255, 0.35), // Top reflection highlight
    0 8px 32px 0 rgba(0, 0, 0, 0.08); // Diffused shadow

  // 3D Glass Sheen Gloss layer
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
    z-index: 10;
    transition: border-radius var(--transition-duration) var(--transition-timing);
  }

  transition: 
    width var(--transition-duration) var(--transition-timing),
    border-radius var(--transition-duration) var(--transition-timing),
    left var(--transition-duration) var(--transition-timing),
    right var(--transition-duration) var(--transition-timing);
}

// ── Scrollable Menu Area ──────────────────────────────────
.sidebar-menu-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 0.75rem;
  margin-top: 1rem;
  margin-bottom: 5.5rem; // Room for sticky footer

  // Scrollbar customization
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 99px;
    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

.layout-menu {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    margin: 0;
    padding: 0;
  }
}

.layout-menuitem-root-action {
  display: flex;
  align-items: center;
  gap: 1.25rem; // Space between icon and label
  padding: 0.85rem 1.25rem;
  border-radius: 9999px; // Pill shaped highlight
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  position: relative;
  transition: 
    background-color 0.2s, 
    color 0.2s, 
    gap 0.2s, 
    padding 0.2s, 
    border-radius var(--transition-duration) var(--transition-timing);

  .layout-menuitem-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s;
  }

  // Hover pill shaped liquid glass highlight
  &:hover {
    background-color: var(--glass-tint-hover);
    color: var(--text-primary);
    box-shadow: 
      inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
      0 4px 12px rgba(99, 102, 241, 0.08);

    .layout-menuitem-icon {
      transform: scale(1.05);
    }
  }

  // Selected pill shaped liquid glass highlight
  &.active-route {
    background-color: var(--glass-tint-active);
    color: var(--accent);
    font-weight: 600;
    box-shadow: 
      inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
      0 4px 16px var(--accent-glow);

    .layout-menuitem-icon {
      color: var(--accent);
    }
  }
}

// ── Sticky Header and Footer ──────────────────────────────
.sidebar-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1.5rem;
  z-index: 5;
  pointer-events: none;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background: linear-gradient(to bottom, var(--glass-bg) 0%, rgba(255, 255, 255, 0) 100%);
  transition: border-radius var(--transition-duration) var(--transition-timing);
}

.sidebar-footer-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  overflow: hidden;
  transition: border-radius var(--transition-duration) var(--transition-timing);
}

.sidebar-footer-bg {
  position: absolute;
  inset: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  mask-image: linear-gradient(to top, black 50%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 50%, transparent 100%);
  z-index: -1;
}

.sidebar-footer-content {
  border-top: 1px solid var(--glass-border);
  padding: 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: justify-content var(--transition-duration);

  .footer-avatar {
    background: var(--bg-item-active) !important;
    color: var(--accent) !important;
    font-weight: 600;
  }

  .user-details {
    display: flex;
    flex-direction: column;

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  }
}

.register-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: monospace;
  transition: justify-content var(--transition-duration);

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--status-open);
    box-shadow: 0 0 8px var(--status-open);
  }
}

// ── Collapsed Desktop Mode ────────────────────────────────
.layout-sidebar-collapsed {
  border-radius: 40px; // Vertical pill card
  right: 0.5rem;

  &::before {
    border-radius: 40px;
  }

  .sidebar-header-overlay {
    border-top-left-radius: 40px;
    border-top-right-radius: 40px;
  }

  .sidebar-footer-container {
    border-bottom-left-radius: 40px;
    border-bottom-right-radius: 40px;
  }

  .sidebar-menu-scroll-container {
    padding: 1.5rem 0.35rem;
  }

  // Circular menu highlights in collapsed mode
  .layout-menuitem-root-action {
    justify-content: center;
    padding: 0.85rem 0;
    gap: 0;
    border-radius: 50%; // Round shaped liquid glass
    width: 44px;
    height: 44px;
    margin: 0 auto;

    .layout-menuitem-icon {
      margin: 0;
    }
  }

  .user-profile {
    justify-content: center;
    gap: 0;
  }

  .register-status {
    justify-content: center;
    gap: 0;
  }
}

// ── Mobile Responsive Overrides ───────────────────────────
@media (max-width: 991px) {
  :host {
    top: 0 !important;
    height: 100vh !important;
    z-index: 999 !important;
    pointer-events: auto; // Allow full interaction
  }

  .layout-sidebar-container {
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 0; // Flush drawer on mobile
    border: none;
    border-right: 1px solid var(--border);
    box-shadow: none;

    &::before {
      border-radius: 0;
    }

    .sidebar-header-overlay {
      border-radius: 0;
    }

    .sidebar-footer-container {
      border-radius: 0;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add angular/src/app/core/layout/sidebar/sidebar.component.scss
git commit -m "style(sidebar): implement responsive liquid glass styles and transitions"
```

---

### Task 5: Build Verification

**Files:**
- None

**Interfaces:**
- None

- [ ] **Step 1: Build the Angular project to ensure there are no compilation errors**

Run: `npm run build --prefix angular`
Expected: Build succeeds with exit code 0.
