import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ReportService } from '../../core/services/report.service';
import { extractErrorMessage } from '../../core/services/api-error.util';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  private readonly reportService = inject(ReportService);

  /** Only one report type exists today; kept as a field for a future dropdown. */
  readonly reportType = 'Policy Issue Report';

  readonly fromDate = signal<string | null>(null);
  readonly toDate = signal<string | null>(null);

  readonly exporting = signal(false);
  readonly exportError = signal<string | null>(null);
  readonly exportSuccess = signal(false);

  onFromDateChange(value: string): void {
    this.fromDate.set(value || null);
    this.exportSuccess.set(false);
  }

  onToDateChange(value: string): void {
    this.toDate.set(value || null);
    this.exportSuccess.set(false);
  }

  export(): void {
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    this.exportError.set(null);
    this.exportSuccess.set(false);

    if (!fromDate || !toDate) {
      this.exportError.set('Please select both a From Date and a To Date.');
      return;
    }
    if (fromDate > toDate) {
      this.exportError.set('From Date must be on or before To Date.');
      return;
    }

    this.exporting.set(true);
    this.reportService.exportPolicyIssueReport({ fromDate, toDate }).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.exportSuccess.set(true);
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `policy-issue-report-${fromDate}-to-${toDate}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      },
      error: (error: HttpErrorResponse) => {
        this.exporting.set(false);
        this.exportError.set(extractErrorMessage(error));
      },
    });
  }
}
