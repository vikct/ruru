# Header User Dropdown & Sign Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user profile dropdown to the top bar header and connect the Sign Out action to AuthService.

**Architecture:** Inject `AuthService` and `Router` in `AppHeaderComponent`, use Taiga UI `tuiDropdown` directives for popover toggling, and render dynamic user initials/avatar in light/dark themes.

**Tech Stack:** Angular 21, Taiga UI v5, SCSS

## Global Constraints
- Do not commit changes to Git. Only stage them (`git add`) for user review.

---

### Task 1: Header Component Logic

**Files:**
- Modify: `angular/src/app/core/layout/header/header.component.ts`

**Interfaces:**
- Consumes: `AuthService`, `Router`
- Produces: `AppHeaderComponent` class exposing `currentUser`, `avatarLabel`, `userRole`, `open` signals and `signOut()` method.

- [ ] **Step 1: Update imports in header.component.ts**
  Open `angular/src/app/core/layout/header/header.component.ts` and add imports:
  ```typescript
  import { Router } from '@angular/router';
  import { TuiDropdown } from '@taiga-ui/core';
  import { AuthService } from '../../services/auth.service';
  ```

- [ ] **Step 2: Inject services and define signals**
  Inject `AuthService` and `Router`, and declare signals/computed values:
  ```typescript
  export class AppHeaderComponent {
    ...
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly currentUser = this.authService.currentUser;
    readonly open = signal(false);

    readonly userRole = computed(() => {
      const roles = this.authService.currentRoles();
      return roles.length > 0 ? roles[0] : 'Employee';
    });

    readonly avatarLabel = computed(() => {
      const user = this.currentUser();
      if (!user) return '??';
      const first = user.firstName ? user.firstName[0] : '';
      const last = user.lastName ? user.lastName[0] : '';
      return (first + last).toUpperCase() || 'EM';
    });

    signOut(): void {
      this.open.set(false);
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
  ```

- [ ] **Step 3: Stage changes**
  Run: `git add angular/src/app/core/layout/header/header.component.ts`

---

### Task 2: Header Component Template

**Files:**
- Modify: `angular/src/app/core/layout/header/header.component.html`

**Interfaces:**
- Consumes: `AppHeaderComponent` signal properties.
- Produces: Updated user avatar button template and dropdown panel markup.

- [ ] **Step 1: Update avatar button layout**
  Open `angular/src/app/core/layout/header/header.component.html` and replace lines 61-69 (Avatar button container) with the dropdown trigger:
  ```html
  <button
    tuiIconButton
    type="button"
    appearance="flat-grayscale"
    class="p-0 overflow-hidden"
    [tuiDropdown]="profileMenu"
    [(tuiDropdownOpen)]="open"
  >
    <span [tuiAvatar]="avatarLabel()" size="s"></span>
  </button>

  <ng-template #profileMenu>
    <div class="profile-dropdown">
      @if (currentUser(); as user) {
        <div class="user-dropdown-details">
          <span class="user-dropdown-name">{{ user.firstName }} {{ user.lastName }}</span>
          <span class="user-dropdown-role">{{ userRole() }}</span>
        </div>
        <hr class="dropdown-divider" />
      }
      <button
        tuiButton
        type="button"
        appearance="flat"
        size="s"
        (click)="signOut()"
        class="sign-out-btn"
      >
        Sign Out
      </button>
    </div>
  </ng-template>
  ```

- [ ] **Step 2: Stage changes**
  Run: `git add angular/src/app/core/layout/header/header.component.html`

---

### Task 3: Dropdown Styling

**Files:**
- Modify: `angular/src/app/core/layout/header/header.component.scss`

**Interfaces:**
- Consumes: CSS theme tokens
- Produces: CSS classes for profile dropdown popover layout.

- [ ] **Step 1: Add dropdown styles to header.component.scss**
  Append styles to the bottom of the file:
  ```scss
  .profile-dropdown {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 180px;
  }

  .user-dropdown-details {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
  }

  .user-dropdown-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .user-dropdown-role {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .dropdown-divider {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 0.5rem 0;
  }

  .sign-out-btn {
    width: 100%;
  }
  ```

- [ ] **Step 2: Stage changes**
  Run: `git add angular/src/app/core/layout/header/header.component.scss`

---

### Task 4: Compilation and Verification

**Files:**
- None (Verification task)

**Interfaces:**
- Consumes: None
- Produces: Verified Angular build and tests.

- [ ] **Step 1: Run frontend unit tests**
  Run: `npm run test --prefix angular -- --watch=false`
  Expected: PASS

- [ ] **Step 2: Run Angular compilation build**
  Run: `npm run build --prefix angular`
  Expected: Build succeeded with zero errors.
