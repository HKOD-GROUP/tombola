import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Building2, Gavel, HandHeart, LucideAngularModule } from 'lucide-angular';

import { GameService } from '../../core/services/game.service';
import { formatDateLong, formatDateTimeLong, formatEuros } from '../../core/utils/format';
import { TodoComponent } from '../../shared/components/todo.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game.component.html',
})
export class GameComponent {
  readonly game = inject(GameService);
  readonly icOrg = Building2;
  readonly icGavel = Gavel;
  readonly icHeart = HandHeart;
  readonly formatDateLong = formatDateLong;
  readonly formatDateTimeLong = formatDateTimeLong;
  readonly formatEuros = formatEuros;

  constructor() {
    this.game.loadGame().subscribe();
  }
}
