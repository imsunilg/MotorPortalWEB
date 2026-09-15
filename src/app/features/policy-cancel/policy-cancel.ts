import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-policy-cancel',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './policy-cancel.html',
  styleUrl: './policy-cancel.css',
})
export class PolicyCancel {
  readonly title = 'Policy Cancel';
}
