import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-batch-summary',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './batch-summary.html',
  styleUrl: './batch-summary.css',
})
export class BatchSummary {
  readonly title = 'Batch Summary';
}
