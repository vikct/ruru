import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppFooterComponent } from './footer.component';
import { vi } from 'vitest';

describe('AppFooterComponent', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render correct copyright text for 2026', () => {
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026);
    fixture.detectChanges();

    expect(component.yearRange).toBe('2026');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.footer-text')?.textContent?.trim()).toBe('Powered by RuRu POS, 2026 All Rights Reserved');
  });

  it('should render correct copyright text for future years', () => {
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2027);
    fixture.detectChanges();

    expect(component.yearRange).toBe('2026-2027');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.footer-text')?.textContent?.trim()).toBe('Powered by RuRu POS, 2026-2027 All Rights Reserved');
  });
});
