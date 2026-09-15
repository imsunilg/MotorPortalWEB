import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { BatchService } from '../../core/services/batch.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import {
  BatchSummaryCounters,
  BatchSummaryRow,
  BulkPrintCertificate,
} from '../../core/models/batch.model';

@Component({
  selector: 'app-batch-summary',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './batch-summary.html',
  styleUrl: './batch-summary.css',
})
export class BatchSummary implements OnInit {
  private readonly batchService = inject(BatchService);
  private readonly router = inject(Router);

  readonly fromDate = signal<string | null>(null);
  readonly toDate = signal<string | null>(null);

  readonly counters = signal<BatchSummaryCounters | null>(null);
  readonly countersLoading = signal(false);
  readonly countersError = signal<string | null>(null);

  readonly rows = signal<BatchSummaryRow[]>([]);
  readonly rowsLoading = signal(false);
  readonly rowsError = signal<string | null>(null);

  readonly rowActionMessage = signal<string | null>(null);
  readonly rowActionError = signal<string | null>(null);
  readonly rowActionBusy = signal<number | null>(null);

  readonly bulkPrintResult = signal<{ batchId: number; certificates: BulkPrintCertificate[] } | null>(
    null,
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loadCounters();
    this.loadRows();
  }

  loadCounters(): void {
    this.countersLoading.set(true);
    this.countersError.set(null);
    this.batchService.getSummaryCounters(this.fromDate(), this.toDate()).subscribe({
      next: (counters) => {
        this.countersLoading.set(false);
        this.counters.set(counters);
      },
      error: (error: HttpErrorResponse) => {
        this.countersLoading.set(false);
        this.countersError.set(extractErrorMessage(error));
      },
    });
  }

  loadRows(): void {
    this.rowsLoading.set(true);
    this.rowsError.set(null);
    this.batchService.list(this.fromDate(), this.toDate()).subscribe({
      next: (rows) => {
        this.rowsLoading.set(false);
        this.rows.set(rows);
      },
      error: (error: HttpErrorResponse) => {
        this.rowsLoading.set(false);
        this.rowsError.set(extractErrorMessage(error));
      },
    });
  }

  onFromDateChange(value: string): void {
    this.fromDate.set(value || null);
  }

  onToDateChange(value: string): void {
    this.toDate.set(value || null);
  }

  statusBadgeClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized.includes('processed')) {
      return 'mp-badge-success';
    }
    if (normalized.includes('invalid') || normalized.includes('fail') || normalized.includes('error')) {
      return 'mp-badge-error';
    }
    return 'mp-badge-warning';
  }

  goToInvalidRecords(batchId: number): void {
    this.router.navigate(['/invalid-records', batchId]);
  }

  goToBatchProcessing(batchId: number): void {
    this.router.navigate(['/batch-processing', batchId]);
  }

  goToCertificate(cert: BulkPrintCertificate): void {
    this.router.navigate(['/policy-certificate', cert.policyId], {
      queryParams: { policyNo: cert.policyNo },
    });
  }

  processBatch(row: BatchSummaryRow): void {
    this.rowActionBusy.set(row.batchId);
    this.rowActionMessage.set(null);
    this.rowActionError.set(null);
    this.batchService.process(row.batchId).subscribe({
      next: (summary) => {
        this.rowActionBusy.set(null);
        this.rowActionMessage.set(
          `Batch ${summary.batchId} processed. Status: ${summary.status}.`,
        );
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.rowActionBusy.set(null);
        this.rowActionError.set(extractErrorMessage(error));
      },
    });
  }

  processPayments(row: BatchSummaryRow): void {
    this.rowActionBusy.set(row.batchId);
    this.rowActionMessage.set(null);
    this.rowActionError.set(null);
    this.batchService.processPayments(row.batchId).subscribe({
      next: (result) => {
        this.rowActionBusy.set(null);
        this.rowActionMessage.set(
          `Payments processed for batch ${result.batchId}: ${result.succeededCount} succeeded, ${result.failedCount} failed.`,
        );
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.rowActionBusy.set(null);
        this.rowActionError.set(extractErrorMessage(error));
      },
    });
  }

  bulkPrint(row: BatchSummaryRow): void {
    this.rowActionBusy.set(row.batchId);
    this.rowActionMessage.set(null);
    this.rowActionError.set(null);
    this.bulkPrintResult.set(null);
    this.batchService.bulkPrint(row.batchId).subscribe({
      next: (result) => {
        this.rowActionBusy.set(null);
        this.rowActionMessage.set(
          `Bulk print completed for batch ${result.batchId}: ${result.certificates.length} certificate(s).`,
        );
        this.bulkPrintResult.set({ batchId: result.batchId, certificates: result.certificates });
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.rowActionBusy.set(null);
        this.rowActionError.set(extractErrorMessage(error));
      },
    });
  }
}
