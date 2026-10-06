import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AdminAuthService);
  if (auth.isLoggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/admin/connexion'], { queryParams: { retour: state.url } });
};
