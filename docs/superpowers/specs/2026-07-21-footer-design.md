# Design Specification: Dynamic Translucent Layout Footer

This specification outlines the design and implementation details for adding a viewport-fixed, translucent footer to the RuRu POS application layout.

## Goals

1. **Footer Layout**: Add a centered, small-text footer at the bottom of the viewport: `"Powered by RuRu POS, [Year(s)] All Rights Reserved"`.
2. **Dynamic Year Range**: Display `2026` for the year 2026, and a range `2026-YYYY` (e.g., `2026-2027`) for any subsequent year `YYYY`.
3. **Visual Aesthetics**: Make the footer behave like the header, utilizing a progressive glassmorphism backdrop blur fading from transparent (top of footer) to opaque (bottom of viewport).
4. **Layout Safety**: Ensure page content is padded appropriately so that the footer does not overlap any interactive elements or text.

## Proposed Design

### 1. Theme Variables (`angular/src/app/core/theme/_tokens.scss`)
Introduce a new layout structural token:
```scss
--footer-height: 48px;
```

### 2. Footer Component (`angular/src/app/core/layout/footer/`)
Create a new standalone component structure:

#### `footer.component.ts`
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

#### `footer.component.html`
```html
<footer class="layout-footer">
  <div class="footer-bg-layer"></div>
  <span class="footer-text">
    Powered by RuRu POS, {{ yearRange }} All Rights Reserved
  </span>
</footer>
```

#### `footer.component.scss`
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
    top: -20px; // Extended area to allow smooth blur gradient transition
    z-index: -1;
    pointer-events: none;

    background: var(--bg-topbar);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);

    // Fade from transparent at top (-20px) to opaque at bottom
    mask-image: linear-gradient(to top, black var(--footer-height), transparent 100%);
    -webkit-mask-image: linear-gradient(to top, black var(--footer-height), transparent 100%);

    transition: background-color 250ms ease;
  }
}

// Adjust horizontal layout alignment in response to sidebar collapses
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

### 3. Layout Integration

#### `angular/src/app/core/layout/layout.component.ts`
Import `AppFooterComponent` and add it to `imports`:
```typescript
import { AppFooterComponent } from './footer/footer.component';

@Component({
  ...
  imports: [CommonModule, AppSidebarComponent, AppHeaderComponent, AppFooterComponent],
  ...
})
```

#### `angular/src/app/core/layout/layout.component.html`
Append the footer component at the bottom of the main layout structure:
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

#### `angular/src/app/core/layout/layout.component.scss`
Add `padding-bottom` to `.layout-main-container` to reserve space for the footer overlay:
```scss
.layout-main-container {
  // ...
  padding: calc(var(--topbar-height) + 1.5rem) 1.5rem calc(var(--footer-height) + 1.5rem) 1.5rem;
  // ...

  @media (max-width: 991px) {
    padding-top: calc(var(--topbar-height) + 1rem);
    padding-bottom: calc(var(--footer-height) + 1rem);
    // ...
  }
}
```

## Verification & Testing Plan

### Automated Tests
Create a unit test suite `footer.component.spec.ts` under `angular/src/app/core/layout/footer/` to verify:
1. **Default Year logic**: Verify that the component renders "2026" if the current year is 2026.
2. **Future Year logic**: Verify that the component renders a range (e.g. "2026-2027") if the current year is 2027.

### Manual Verification
1. Run `npm run dev` or `ng serve` and verify the footer layout in desktop and mobile viewport sizes.
2. Verify that the footer backdrop blur is functioning correctly and fades progressively from bottom to top.
3. Verify that the main content is fully scrollable and not permanently hidden behind the footer.
