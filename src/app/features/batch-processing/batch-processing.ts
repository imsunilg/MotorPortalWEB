import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-batch-processing',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './batch-processing.html',
  styleUrl: './batch-processing.css',
})
export class BatchProcessing {
  readonly title = 'Batch Processing';
}
