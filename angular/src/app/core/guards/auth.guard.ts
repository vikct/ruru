import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () =>
  inject(AuthService).currentUser() ? true : inject(Router).createUrlTree(['/auth/login']);

export const guestGuard: CanActivateFn = () =>
  inject(AuthService).currentUser() ? inject(Router).createUrlTree(['/']) : true;
