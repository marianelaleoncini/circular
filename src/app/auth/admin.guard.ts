import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),
    map((user) => {
      if (!user || !authService.checkIfAdmin(user.email)) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    }),
  );
};
