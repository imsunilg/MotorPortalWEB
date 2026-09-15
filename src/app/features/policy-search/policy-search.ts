import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-policy-search',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './policy-search.html',
  styleUrl: './policy-search.css',
})
export class PolicySearch {
  readonly title = 'Policy Search & Print';
}
