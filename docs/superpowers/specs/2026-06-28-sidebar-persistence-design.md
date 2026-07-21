# Sidebar State Persistence Design Spec

This document details the design and implementation for remembering the desktop sidebar collapsed state using browser `localStorage`.

## 1. Requirements & UX Behavior

- **State Persistence**: The desktop sidebar collapsed state (`collapsed`) will be saved in the browser's `localStorage` under the key `'ruru-sidebar-collapsed'`.
- **Initialization**: On page load/reload, the sidebar collapsed state will be initialized by reading `'ruru-sidebar-collapsed'`. If the value is `'true'`, the sidebar starts collapsed; otherwise, it starts expanded (default).
- **Auto-Sync**: Any toggling of the collapsed state (via the topbar toggle button) will automatically update the `localStorage` value.
- **Mobile Behavior**: The mobile open drawer state (`isMobileOpen`) is NOT persisted and always defaults to `false` on load/reload.

## 2. Technical Architecture & Modifications

### A. Layout Component Modifications
- **File**: `angular/src/app/core/layout/layout.component.ts`
- **Changes**:
  - Update imports to include `effect` from `@angular/core`.
  - Initialize the `collapsed` signal based on `localStorage` value.
  - Implement a `constructor()` with an Angular `effect` that writes the collapsed state to `localStorage` whenever the signal changes.

```typescript
import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from './sidebar/sidebar.component';
import { AppHeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AppSidebarComponent, AppHeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class AppLayoutComponent {
  readonly collapsed = signal<boolean>(
    localStorage.getItem('ruru-sidebar-collapsed') === 'true'
  );
  readonly isMobileOpen = signal(false);

  readonly containerClass = computed(() => ({
    'layout-static-inactive': this.collapsed(),
    'layout-mobile-active': this.isMobileOpen()
  }));

  constructor() {
    effect(() => {
      localStorage.setItem('ruru-sidebar-collapsed', String(this.collapsed()));
    });
  }
}
```

## 3. Verification & Testing

### Automated Verification
- Verify the Angular application compiles without warnings:
  ```bash
  npm run build
  ```

### Manual Verification Checklist
1. **Initial Load**:
   - Verify sidebar starts expanded on a fresh browser session (or after clearing `localStorage`).
2. **Persistence Test**:
   - Collapse the sidebar using the topbar toggle button.
   - Reload the page.
   - Verify that the sidebar starts collapsed.
   - Expand the sidebar.
   - Reload the page.
   - Verify that the sidebar starts expanded.
