import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  readonly title = 'Reports';
}
