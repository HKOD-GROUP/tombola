import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Loader2, Lock, LucideAngularModule } from 'lucide-angular';

import { AdminAuthService } from '../../core/services/admin-auth.service';
import { parseApiError } from '../../core/utils/api-error';
import { BrandMarkComponent } from '../../shared/components/brand-mark.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, BrandMarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-page px-4">
      <form class="card w-full max-w-sm p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="mb-5 flex items-center gap-2">
          <app-brand-mark [size]="28" />
          <span class="font-display text-lg font-semibold">Back-office</span>
        </div>
        <h1 class="mb-4 text-xl">Connexion</h1>
        <label class="label" for="password">Mot de passe</label>
        <input id="password" type="password" class="input" formControlName="password" autocomplete="current-password" autofocus />
        @if (error()) {
          <p class="alert-error mt-3" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn-primary mt-5 w-full" [disabled]="loading() || form.invalid">
          <lucide-icon [img]="loading() ? icLoader : icLock" [size]="17" [class.spin]="loading()" aria-hidden="true" />
          Se connecter
        </button>
      </form>
    </div>
  `,
})
export class AdminLoginComponent {
  readonly retour = input<string | undefined>(undefined);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  readonly form = inject(FormBuilder).nonNullable.group({ password: ['', Validators.required] });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly icLock = Lock;
  readonly icLoader = Loader2;

  constructor() {
    if (this.auth.isLoggedIn()) {
      void this.router.navigateByUrl('/admin');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue().password).subscribe({
      next: () => {
        const target = this.retour();
        void this.router.navigateByUrl(target && target.startsWith('/admin') ? target : '/admin');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const e = parseApiError(err, 'Connexion impossible.');
        this.error.set(e.status === 401 && !e.code ? 'Mot de passe incorrect.' : e.message);
      },
    });
  }
}
