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
