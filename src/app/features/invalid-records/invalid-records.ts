import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-invalid-records',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './invalid-records.html',
  styleUrl: './invalid-records.css',
})
export class InvalidRecords {
  readonly title = 'Invalid Records';
}
