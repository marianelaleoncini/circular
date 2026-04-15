import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs'; // <-- Importamos from y of
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/auth']);
        return of(false);
      }

      if (authService.checkIfAdmin(user.email)) {
        router.navigate(['/admin-dashboard']);
        return of(false);
      }

      return from(authService.isUserBanned(user.uid)).pipe(
        map((isBanned) => {
          if (isBanned) {
            authService.logout();
            router.navigate(['/auth']);
            return false;
          }

          authService.setCurrentUser(user);
          return true;
        }),
      );
    }),
  );
};
