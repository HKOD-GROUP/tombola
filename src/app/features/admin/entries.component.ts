import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Download, Lock, LucideAngularModule, Search } from 'lucide-angular';
import { Subject, debounceTime } from 'rxjs';

import { AdminEntry, AdminSettings, DrawExport, Page } from '../../core/models/tombola.models';
import { AdminApiService, filenameFrom, saveBlob, sha256Hex } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatDateTimeShort } from '../../core/utils/format';
import { PagerComponent } from './pager.component';

@Component({
  selector: 'app-admin-entries',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entries.component.html',
})
export class AdminEntriesComponent {
  private readonly api = inject(AdminApiService);
  readonly icSearch = Search;
  readonly icLock = Lock;
  readonly icDownload = Download;
  readonly date = formatDateTimeShort;

  /* ---- Participations ---- */
  readonly size = 50;
  readonly q = signal('');
  readonly status = signal('');
  readonly page = signal(0);
  readonly result = signal<Page<AdminEntry> | null>(null);
  readonly search$ = new Subject<string>();
  readonly cancelling = signal<string | null>(null);
  readonly cancelReason = signal('');
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  /* ---- Tirage ---- */
  readonly settings = signal<AdminSettings | null>(null);
  readonly exports = signal<DrawExport[]>([]);
  readonly confirmClose = signal(false);
  readonly busy = signal(false);
  readonly drawError = signal<string | null>(null);
  readonly verified = signal<Record<string, 'ok' | 'ko'>>({});

  readonly ended = computed(() => {
    const s = this.settings();
    return !!s && Date.now() >= new Date(s.endAt).getTime();
  });
  readonly closed = computed(() => this.settings()?.status === 'CLOSED');

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((q) => {
      this.q.set(q);
      this.page.set(0);
      this.load();
    });
    this.load();
    this.loadDraw();
  }

  load(): void {
    this.api.entries({ q: this.q().trim(), status: this.status(), page: this.page(), size: this.size }).subscribe({
      next: (r) => this.result.set(r),
      error: (err: unknown) => this.error.set(parseApiError(err, 'Participations indisponibles.').message),
    });
  }

  loadDraw(): void {
    this.api.settings().subscribe({ next: (s) => this.settings.set(s), error: () => undefined });
    this.api.exports().subscribe({
      next: (list) => this.exports.set([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      error: () => undefined,
    });
  }

  startCancel(entry: AdminEntry): void {
    this.cancelling.set(entry.id);
    this.cancelReason.set('');
  }

  cancelEntry(entry: AdminEntry): void {
    const reason = this.cancelReason().trim();
    if (reason.length < 3) {
      return;
    }
    this.api.cancelEntry(entry.id, reason).subscribe({
      next: () => {
        this.cancelling.set(null);
        this.notice.set(`Participation ${entry.ticketNumber} annulée.`);
        this.load();
      },
      error: (err: unknown) => this.error.set(parseApiError(err, 'Annulation impossible.').message),
    });
  }

  close(): void {
    this.busy.set(true);
    this.drawError.set(null);
    this.api.closeDraw().subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmClose.set(false);
        this.notice.set('Jeu clôturé. Le premier export a été généré : téléchargez-le et transmettez-le au commissaire de justice avec son empreinte.');
        this.loadDraw();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.confirmClose.set(false);
        this.drawError.set(parseApiError(err, 'Clôture impossible.').message);
      },
    });
  }

  newExport(): void {
    this.busy.set(true);
    this.drawError.set(null);
    this.api.createExport().subscribe({
      next: () => {
        this.busy.set(false);
        this.loadDraw();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.drawError.set(parseApiError(err, 'Export impossible.').message);
      },
    });
  }

  download(exp: DrawExport): void {
    this.api.downloadExport(exp.id).subscribe({
      next: async (res) => {
        if (!res.body) {
          return;
        }
        saveBlob(res.body, filenameFrom(res, `participations-${exp.createdAt.slice(0, 10)}.csv`));
        try {
          const hash = await sha256Hex(res.body);
          const expected = (res.headers.get('X-Content-SHA256') ?? exp.sha256).toLowerCase();
          this.verified.update((m) => ({ ...m, [exp.id]: hash === expected ? 'ok' : 'ko' }));
        } catch {
          // crypto.subtle indisponible (contexte non securise) : pas de verification locale.
        }
      },
      error: (err: unknown) => this.drawError.set(parseApiError(err, 'Téléchargement impossible.').message),
    });
  }

  copy(text: string): void {
    void navigator.clipboard?.writeText(text);
  }
}
