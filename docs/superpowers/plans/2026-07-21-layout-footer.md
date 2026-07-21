# Layout Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a viewport-fixed, translucent footer below the layout displaying "Powered by RuRu POS, [Year(s)] All Rights Reserved" with dynamic copyright years.

**Architecture:** Create a standalone `AppFooterComponent` under `angular/src/app/core/layout/footer/`. The footer is fixed to the bottom of the viewport with a background layer using backdrop blur and a progressive mask. The layout container will adapt its bottom padding based on the footer's height.

**Tech Stack:** Angular v21, SCSS, Vitest (via Angular unit test builder)

## Global Constraints
- Target Year: start from 2026.
- Styling: Vanilla CSS/SCSS (no Tailwind additions, matching the Sakai-NG/Taiga UI style variables).
- Tests: Test first using Vitest unit tests, verify mock time dates for range correctness.

---

### Task 1: Create Footer Component Files

**Files:**
- Create: `angular/src/app/core/layout/footer/footer.component.ts`
- Create: `angular/src/app/core/layout/footer/footer.component.html`
- Create: `angular/src/app/core/layout/footer/footer.component.scss`
- Create: `angular/src/app/core/layout/footer/footer.component.spec.ts`

**Interfaces:**
- Consumes: None
- Produces: `AppFooterComponent` (standalone component)

- [ ] **Step 1: Write the failing test**
  Create `angular/src/app/core/layout/footer/footer.component.spec.ts` with the following content:
  ```typescript
  import { ComponentFixture, TestBed } from '@angular/core/testing';
  import { AppFooterComponent } from './footer.component';

  describe('AppFooterComponent', () => {
    let component: AppFooterComponent;
    let fixture: ComponentFixture<AppFooterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppFooterComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(AppFooterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render correct copyright text for 2026', () => {
      spyOn(Date.prototype, 'getFullYear').and.returnValue(2026);
      expect(component.yearRange).toBe('2026');

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.footer-text')?.textContent?.trim()).toBe('Powered by RuRu POS, 2026 All Rights Reserved');
    });

    it('should render correct copyright text for future years', () => {
      spyOn(Date.prototype, 'getFullYear').and.returnValue(2027);
      expect(component.yearRange).toBe('2026-2027');

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.footer-text')?.textContent?.trim()).toBe('Powered by RuRu POS, 2026-2027 All Rights Reserved');
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx ng test --include=src/app/core/layout/footer/footer.component.spec.ts`
  Expected: FAIL (or Compilation error since component and files do not exist yet)

- [ ] **Step 3: Write minimal implementation**
  Create the following three files under `angular/src/app/core/layout/footer/`:

  **`footer.component.ts`**:
  ```typescript
  import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';

  @Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
  })
  export class AppFooterComponent {
    get yearRange(): string {
      const startYear = 2026;
      const currentYear = new Date().getFullYear();
      return currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
    }
  }
  ```

  **`footer.component.html`**:
  ```html
  <footer class="layout-footer">
    <div class="footer-bg-layer"></div>
    <span class="footer-text">
      Powered by RuRu POS, {{ yearRange }} All Rights Reserved
    </span>
  </footer>
  ```

  **`footer.component.scss`**:
  ```scss
  .layout-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 997;
    height: var(--footer-height);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 500;
    pointer-events: none;

    .footer-text {
      pointer-events: auto;
    }

    .footer-bg-layer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: -20px;
      z-index: -1;
      pointer-events: none;

      background: var(--bg-topbar);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);

      mask-image: linear-gradient(to top, black var(--footer-height), transparent 100%);
      -webkit-mask-image: linear-gradient(to top, black var(--footer-height), transparent 100%);

      transition: background-color 250ms ease;
    }
  }

  .layout-wrapper {
    .layout-footer {
      transition: left var(--transition-duration) var(--transition-timing);
      left: calc(var(--sidebar-width));
    }

    &.layout-static-inactive .layout-footer {
      left: calc(var(--sidebar-collapsed-width));
    }
  }

  @media (max-width: 991px) {
    .layout-wrapper .layout-footer {
      left: 0;
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx ng test --include=src/app/core/layout/footer/footer.component.spec.ts`
  Expected: PASS (3 tests run successfully)

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add angular/src/app/core/layout/footer/
  git commit -m "feat: create FooterComponent with dynamic year range tests and styles"
  ```

---

### Task 2: Integrate Footer into App Layout

**Files:**
- Modify: `angular/src/app/core/theme/_tokens.scss:37-43`
- Modify: `angular/src/app/core/layout/layout.component.ts:1-12`
- Modify: `angular/src/app/core/layout/layout.component.html:1-17`
- Modify: `angular/src/app/core/layout/layout.component.scss:13-29`

**Interfaces:**
- Consumes: `AppFooterComponent`
- Produces: Integrated layout page containing the footer

- [ ] **Step 1: Declare the footer height token**
  Modify `angular/src/app/core/theme/_tokens.scss` around line 40 to add the `--footer-height` token:
  ```scss
    // 📐 Layout structural tokens
    --sidebar-width: 280px;
    --sidebar-collapsed-width: 72px;
    --topbar-height: 80px;
    --footer-height: 48px;
    --transition-duration: 0.2s;
  ```

- [ ] **Step 2: Modify layout container padding**
  Modify `angular/src/app/core/layout/layout.component.scss` around lines 13-29 to include the footer spacing in `padding-bottom`:
  ```scss
  // ── Main Content Container ─────────────────────────────────
  .layout-main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: calc(var(--topbar-height) + 1.5rem) 1.5rem calc(var(--footer-height) + 1.5rem) 1.5rem;
    transition: margin-left var(--transition-duration) var(--transition-timing);
    margin-left: calc(var(--sidebar-width) + 1.5rem); // Floating inset padding

    @media (max-width: 991px) {
      margin-left: 0;
      padding-top: calc(var(--topbar-height) + 1rem);
      padding-bottom: calc(var(--footer-height) + 1rem);
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
  ```

- [ ] **Step 3: Import AppFooterComponent in Layout Component**
  Modify `angular/src/app/core/layout/layout.component.ts` to import `AppFooterComponent` and declare it in the `imports` array:
  ```typescript
  import { Component, signal, computed, effect, HostListener } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { AppSidebarComponent } from './sidebar/sidebar.component';
  import { AppHeaderComponent } from './header/header.component';
  import { AppFooterComponent } from './footer/footer.component';

  @Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppSidebarComponent, AppHeaderComponent, AppFooterComponent],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
  })
  ```

- [ ] **Step 4: Add footer tag to layout template**
  Modify `angular/src/app/core/layout/layout.component.html` to add `<app-footer />` before the mobile layout mask:
  ```html
  <div class="layout-wrapper" [ngClass]="containerClass()">
    <app-header [(collapsed)]="collapsed" [(isMobileOpen)]="isMobileOpen" />
    <app-sidebar [(collapsed)]="collapsed" [(isMobileOpen)]="isMobileOpen" />

    <div class="layout-main-container">
      <div class="layout-main">
        <ng-content></ng-content>
      </div>
    </div>

    <app-footer />

    @if (isMobileOpen()) {
      <div class="layout-mask" (click)="isMobileOpen.set(false)"></div>
    }
  </div>
  ```

- [ ] **Step 5: Run all unit tests**
  Run: `npm run test`
  Expected: PASS (All 14 tests run successfully, including the footer and sidebar specs)

- [ ] **Step 6: Commit integration changes**
  Run:
  ```bash
  git add angular/src/app/core/theme/_tokens.scss angular/src/app/core/layout/layout.component.*
  git commit -m "feat: integrate FooterComponent into AppLayoutComponent with safe padding"
  ```
