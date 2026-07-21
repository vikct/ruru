# Header Styling Cleanup & Light-Theme Icon Color Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tidy up `AppHeaderComponent` SCSS (remove `@apply`, redundant selectors, broken Tailwind utility), fix the light-theme icon color regression for `flat-grayscale` icon buttons, and strip inline Tailwind utility classes from the template. Scope is strictly the header component and its stylesheet.

**Architecture:** Keep the existing template structure but replace every `@apply`-driven rule in `header.component.scss` with plain CSS that references the existing design tokens in `_tokens.scss`. Add a header-scoped override that remaps `--tui-text-tertiary` to `--text-primary` only inside `.layout-topbar` so `flat-grayscale` icon buttons render with full-contrast color in both themes without touching `_tokens.scss`.

**Tech Stack:** Angular 21 standalone components, Taiga UI v5 (`tuiIconButton`, `tuiIcon`, `tuiBadge`, `tuiAvatar`, `tuiDropdown`, `tuiTextfield`, `tuiInput`), SCSS, design tokens via CSS custom properties.

---

## File Structure

**Modify:**
- `angular/src/app/core/layout/header/header.component.html` — strip inline Tailwind utility classes (`text-xl`, `relative inline-flex`, `absolute top-1 right-1 pointer-events-none`, `p-0 overflow-hidden`); replace with semantic class names (`notification-wrapper`, `notification-badge`, `profile-button`).
- `angular/src/app/core/layout/header/header.component.scss` — full rewrite: drop `@reference "tailwindcss"` and all `@apply` directives; translate to plain CSS using existing tokens; collapse the 6 profile-dropdown selectors into 4; add `.layout-topbar [tuiIconButton]` color override.

**No other files are touched.** `_tokens.scss`, sidebar, `layout.component.scss`, and `header.component.ts` are out of scope per the user-confirmed "header only" scope.

---

## Task 1: Rewrite header SCSS to plain CSS with theme-aware icon color override

**Files:**
- Modify: `angular/src/app/core/layout/header/header.component.scss` (entire file rewrite)

- [ ] **Step 1: Replace the entire SCSS file**

Write to `angular/src/app/core/layout/header/header.component.scss`:

```scss
// ──────────────────────────────────────────────────────────
// AppHeaderComponent Styles
// ──────────────────────────────────────────────────────────

// Theme-aware icon color: remap --tui-text-tertiary to --text-primary
// only within the topbar so flat-grayscale icon buttons render with
// full-contrast color in both light and dark themes. Does not affect
// flat-grayscale buttons elsewhere in the app.
.layout-topbar [tuiIconButton] {
  --tui-text-tertiary: var(--text-primary);
  color: var(--tui-text-tertiary);
}

.layout-topbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 997;
  width: 100%;
  height: var(--topbar-height);
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-topbar);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  transition: background-color 250ms ease, border-color 250ms ease;
}

@media (max-width: 991px) {
  .layout-topbar {
    padding: 0 1rem;
  }
}

.layout-topbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.75rem;
  letter-spacing: -0.025em;
  color: var(--text-primary);

  .logo-icon-wrapper {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-item-active);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--accent);
    font-size: 1.25rem;
    line-height: 1.75rem;
    transition: background-color 200ms ease;
  }
}

.layout-topbar-logo:hover .logo-icon-wrapper {
  background: var(--accent-glow);
}

.layout-menu-button {
  margin-left: 2rem;
  margin-right: auto;
}

@media (max-width: 991px) {
  .layout-menu-button {
    margin-left: 1rem;
  }
}

.layout-topbar-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 991px) {
  .layout-topbar-menu {
    gap: 0.5rem;
  }
}

.layout-topbar-search {
  display: none;
  width: 240px;
  transition: width 200ms ease;
}

.layout-topbar-search:focus-within {
  width: 280px;
}

@media (min-width: 640px) {
  .layout-topbar-search {
    display: flex;
  }
}

// Notification bell wrapper: relative + inline-flex so the badge can be
// absolutely positioned in the top-right of the bell button.
.notification-wrapper {
  position: relative;
  display: inline-flex;
}

.notification-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  pointer-events: none;
}

// Avatar button: strip default button padding so the circular avatar
// fills the button cleanly.
.profile-button {
  padding: 0;
  overflow: hidden;
}

.profile-dropdown {
  min-width: 180px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

.profile-dropdown .profile-user {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.profile-dropdown .profile-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.profile-dropdown .profile-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.profile-dropdown .profile-divider {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 0.5rem 0;
}

.profile-dropdown button {
  width: 100%;
}
```

- [ ] **Step 2: Verify the file has no `@apply` or `@reference`**

Run from `angular/`:

```bash
grep -nE '@apply|@reference' src/app/core/layout/header/header.component.scss
```

Expected: no output (exit code 1 from grep).

- [ ] **Step 3: Build the app**

Run from `angular/`:

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes with no SCSS compilation errors. (Component-style budget warnings unrelated to header are acceptable; ignore them.)

- [ ] **Step 4: Commit**

```bash
git add angular/src/app/core/layout/header/header.component.scss
git commit -m "refactor(header): rewrite scss in plain css with theme-aware icon color override"
```

---

## Task 2: Strip inline Tailwind utilities from header template

**Files:**
- Modify: `angular/src/app/core/layout/header/header.component.html` (template)

- [ ] **Step 1: Replace the entire template**

Write to `angular/src/app/core/layout/header/header.component.html`:

```html
<header class="layout-topbar">
  <!-- Logo -->
  <a class="layout-topbar-logo" routerLink="/">
    <div class="logo-icon-wrapper">
      <tui-icon icon="@tui.receipt" />
    </div>
    <span>Ruru POS</span>
  </a>

  <!-- Sidebar toggle button -->
  <button
    tuiIconButton
    type="button"
    appearance="flat-grayscale"
    tuiHint="{{ collapsed() ? 'Expand sidebar' : 'Collapse sidebar' }}"
    tuiHintDirection="bottom"
    class="layout-menu-button"
    (click)="toggleMenu()"
  >
    <tui-icon icon="@tui.menu" />
  </button>

  <div class="layout-topbar-menu">
    <!-- Global search -->
    <tui-textfield tuiSize="m" class="layout-topbar-search">
      <tui-icon tuiTextfieldIcon icon="@tui.search" />
      <input tuiInput placeholder="Quick search… ⌘K" />
    </tui-textfield>

    <!-- Notifications -->
    <span class="notification-wrapper">
      <button
        tuiIconButton
        type="button"
        appearance="flat-grayscale"
      >
        <tui-icon icon="@tui.bell" />
      </button>
      <span
        tuiBadge
        size="s"
        appearance="destructive"
        class="notification-badge"
      >
        3
      </span>
    </span>

    <!-- Theme Toggle -->
    <button
      tuiIconButton
      type="button"
      appearance="flat-grayscale"
      tuiHint="{{ themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}"
      tuiHintDirection="bottom"
      (click)="themeService.toggleTheme()"
    >
      <tui-icon [icon]="themeService.isDarkMode() ? '@tui.sun' : '@tui.moon'" />
    </button>

    <!-- User profile avatar button with dropdown -->
    <button
      tuiIconButton
      type="button"
      appearance="flat-grayscale"
      class="profile-button"
      [tuiDropdown]="profileMenu"
      [(tuiDropdownOpen)]="open"
    >
      <span [tuiAvatar]="avatarLabel()" size="s"></span>
    </button>

    <ng-template #profileMenu>
      <div class="profile-dropdown">
        @if (currentUser(); as user) {
          <div class="profile-user">
            <span class="profile-name">{{ user.firstName }} {{ user.lastName }}</span>
            <span class="profile-role">{{ userRole() }}</span>
          </div>
          <hr class="profile-divider" />
        }
        <button
          tuiButton
          type="button"
          appearance="flat"
          size="s"
          (click)="signOut()"
        >
          Sign Out
        </button>
      </div>
    </ng-template>
  </div>
</header>
```

- [ ] **Step 2: Verify all the removed classes are gone and new ones present**

Run from `angular/`:

```bash
grep -nE 'text-xl|relative inline-flex|top-1 right-1|pointer-events-none|p-0 overflow-hidden|sign-out-btn|user-dropdown-details|user-dropdown-name|user-dropdown-role|dropdown-divider' src/app/core/layout/header/header.component.html
```

Expected: no output (exit code 1 from grep).

Then verify the new classes are present:

```bash
grep -nE 'notification-wrapper|notification-badge|profile-button|profile-dropdown|profile-user|profile-name|profile-role|profile-divider' src/app/core/layout/header/header.component.html
```

Expected: at least one line per class.

- [ ] **Step 3: Build the app**

Run from `angular/`:

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes with no template or SCSS errors.

- [ ] **Step 4: Commit**

```bash
git add angular/src/app/core/layout/header/header.component.html
git commit -m "refactor(header): strip inline tailwind classes from template"
```

---

## Task 3: Visual verification in browser

**Files:** none modified — this is a verification step.

- [ ] **Step 1: Start the dev server**

Run from `angular/`:

```bash
npm start 2>&1 | tail -20
```

Expected: dev server starts, app is reachable at `http://localhost:2510`.

- [ ] **Step 2: Light-theme icon color check**

Open `http://localhost:2510` in the browser (login if needed). With the app in light theme (default for new sessions is dark — click the theme toggle to switch to light if necessary), confirm:

- All four header icon buttons (sidebar toggle / bell / theme toggle / avatar) render their icons with full-contrast dark color against the off-white topbar.
- The icons are clearly readable, not washed-out gray.
- The logo receipt icon (in the bordered square on the left) is accent-colored indigo.
- The notification badge "3" sits in the top-right corner of the bell button.
- The avatar inside its button is flush (no extra padding around the circle).

- [ ] **Step 3: Dark-theme regression check**

Click the theme toggle to switch back to dark mode. Confirm:

- All four header icon buttons remain readable on the dark topbar (no regression).
- The notification badge still sits in the top-right corner of the bell button.
- The avatar button still shows the avatar flush with no extra padding.
- Hover states on the icon buttons still produce the circular grayscale background.

- [ ] **Step 4: Profile dropdown check**

Click the avatar button to open the dropdown. Confirm:

- Dropdown shows user name (bold) and role (small muted text).
- A horizontal divider sits between the user info and the "Sign Out" button.
- "Sign Out" button is full-width.
- Clicking "Sign Out" navigates to the login page (existing behavior — confirm unchanged).

- [ ] **Step 5: Stop the dev server**

Stop the background `npm start` process (Ctrl-C in its terminal).

- [ ] **Step 6: Commit (no-op — only commit if you discovered an issue and fixed it)**

If you needed to tweak anything during verification, commit the fix:

```bash
git add angular/src/app/core/layout/header/
git commit -m "fix(header): address visual issues from cleanup verification"
```

Otherwise skip this step — there is nothing new to commit.

---

## Self-Review

**1. Spec coverage:**
- Section A (icon color fix) → Task 1 Step 1 (`.layout-topbar [tuiIconButton]` block).
- Section B (SCSS rewrite, no `@apply`) → Task 1 Steps 1–2.
- Section C (HTML cleanup) → Task 2 Step 1.
- Section D (profile dropdown consolidation) → Task 1 Step 1 (`.profile-dropdown` block) + Task 2 Step 1 (renamed classes).
- Out-of-scope items (no `_tokens.scss` change, no sidebar change, no logic change) → confirmed; only the two header files are touched.
- Verification → Task 3.

**2. Placeholder scan:** No "TBD", "TODO", "fill in", or vague steps. Every code block contains the exact content to write.

**3. Type / class name consistency:**
- Classes introduced in Task 1 SCSS: `notification-wrapper`, `notification-badge`, `profile-button`, `profile-dropdown`, `profile-user`, `profile-name`, `profile-role`, `profile-divider`. All eight are referenced in Task 2's template and verified in Step 2.
- Classes removed from template: `text-xl`, `relative inline-flex`, `absolute top-1 right-1 pointer-events-none`, `p-0 overflow-hidden`, `sign-out-btn`, `user-dropdown-details`, `user-dropdown-name`, `user-dropdown-role`, `dropdown-divider`. All listed in Task 2 Step 2 grep check.

No inconsistencies found.