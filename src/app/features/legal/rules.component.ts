import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FileText, LucideAngularModule } from 'lucide-angular';

import { GameService } from '../../core/services/game.service';
import { formatDateLong, formatDateTimeLong, formatEuros, plural } from '../../core/utils/format';
import { TodoComponent } from '../../shared/components/todo.component';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rules.component.html',
})
export class RulesComponent {
  readonly game = inject(GameService);
  readonly icFile = FileText;
  readonly formatDateLong = formatDateLong;
  readonly formatDateTimeLong = formatDateTimeLong;
  readonly formatEuros = formatEuros;
  readonly plural = plural;

  constructor() {
    this.game.loadGame().subscribe();
    this.game.loadPacks().subscribe();
    this.game.loadPrizes().subscribe();
  }
}
