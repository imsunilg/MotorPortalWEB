import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './excel-upload.html',
  styleUrl: './excel-upload.css',
})
export class ExcelUpload {
  readonly title = 'Excel Upload';
}
