import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BatchService } from '../../core/services/batch.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { InvalidRecord } from '../../core/models/batch.model';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-invalid-records',
  standalone: true,
  imports: [ConfirmDialog],
  templateUrl: './invalid-records.html',
  styleUrl: './invalid-records.css',
})
export class InvalidRecords implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly batchService = inject(BatchService);

  readonly batchId = signal<number | null>(null);
  readonly records = signal<InvalidRecord[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly confirmOpen = signal(false);
  readonly clearing = signal(false);
  readonly clearError = signal<string | null>(null);
  readonly clearSuccess = signal(false);

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('batchId');
    if (!param) {
      this.loadError.set('No batch id was provided.');
      return;
    }
    const id = Number(param);
    if (Number.isNaN(id)) {
      this.loadError.set('Invalid batch id.');
      return;
    }
    this.batchId.set(id);
    this.load();
  }

  load(): void {
    const batchId = this.batchId();
    if (batchId === null) {
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    this.batchService.getInvalidRecords(batchId).subscribe({
      next: (records) => {
        this.loading.set(false);
        this.records.set(records);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(extractErrorMessage(error));
      },
    });
  }

  openConfirm(): void {
    this.confirmOpen.set(true);
  }

  cancelConfirm(): void {
    this.confirmOpen.set(false);
  }

  confirmClearAll(): void {
    const batchId = this.batchId();
    if (batchId === null) {
      return;
    }
    this.confirmOpen.set(false);
    this.clearing.set(true);
    this.clearError.set(null);
    this.clearSuccess.set(false);
    this.batchService.clearInvalidRecords(batchId).subscribe({
      next: () => {
        this.clearing.set(false);
        this.clearSuccess.set(true);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.clearing.set(false);
        this.clearError.set(extractErrorMessage(error));
      },
    });
  }

  backToBatchSummary(): void {
    this.router.navigate(['/batch-summary']);
  }
}
