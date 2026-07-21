# Sidebar State Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the desktop sidebar collapsed state (`collapsed`) to be remembered across browser reloads using `localStorage`.

**Architecture:** We will initialize the `collapsed` signal in `AppLayoutComponent` by reading `'ruru-sidebar-collapsed'` from `localStorage`. We will add an Angular `effect` in the component's constructor to write the new collapsed state back to `localStorage` on change.

**Tech Stack:** Angular 21.

## Global Constraints
- Target Key: `'ruru-sidebar-collapsed'`.
- Default: Sidebar starts expanded (false) if the key is not set or not `'true'`.

---

### Task 1: Update Layout Component to Persist Sidebar State

**Files:**
- Modify: `angular/src/app/core/layout/layout.component.ts`

**Interfaces:**
- Produces: Persistent sidebar collapsed state in `localStorage`.

- [ ] **Step 1: Update imports and initialize collapsed state**

Modify `angular/src/app/core/layout/layout.component.ts` to import `effect` and initialize `collapsed` based on `localStorage`. Implement the constructor with an `effect` block to save the state on changes.

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

- [ ] **Step 2: Verify the compilation**

Run: `npm run build` in `angular/`
Expected: Compile succeeds with exit code 0.

- [ ] **Step 3: Commit changes**

```bash
git add angular/src/app/core/layout/layout.component.ts
git commit -m "feat: persist desktop sidebar collapsed state in localStorage"
```
