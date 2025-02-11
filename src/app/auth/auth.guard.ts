import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    map((user) => {
      if (!user) {
        router.navigate(['/login']); // Redirige al login si no hay usuario autenticado
        return false;
      }
      authService.setCurrentUser(user);
      return true;
    })
  );
};
