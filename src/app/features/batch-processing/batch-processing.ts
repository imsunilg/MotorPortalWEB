import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { BatchService } from '../../core/services/batch.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { BatchStatus, PaymentBatchResult } from '../../core/models/batch.model';

/** Real batch_master lifecycle values, in order (see MotorPortalAPI's `BatchStatus` constants). */
const LIFECYCLE = [
  'UPLOADED',
  'VALIDATED',
  'PREMIUM_CALCULATED',
  'GST_CALCULATED',
  'PROPOSAL_CREATED',
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSED',
  'POLICY_CREATED',
  'PRINTED',
] as const;

/** Statuses at which the status polling stops — no further automatic progression happens. */
const TERMINAL_STATUSES = new Set(['PAYMENT_PROCESSED', 'POLICY_CREATED', 'PRINTED']);

type StageState = 'pending' | 'active' | 'done';

interface StageTile {
  label: string;
  /** Lifecycle status reached once this stage completes. */
  completesAt: (typeof LIFECYCLE)[number];
  countLabel: string;
  count: number;
}

@Component({
  selector: 'app-batch-processing',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './batch-processing.html',
  styleUrl: './batch-processing.css',
})
export class BatchProcessing implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly batchService = inject(BatchService);

  readonly batchId = signal<number | null>(null);
  readonly status = signal<BatchStatus | null>(null);
  readonly statusError = signal<string | null>(null);
  readonly polling = signal(false);

  readonly paymentBusy = signal(false);
  readonly paymentResult = signal<PaymentBatchResult | null>(null);
  readonly paymentError = signal<string | null>(null);

  private pollSubscription: Subscription | null = null;

  readonly currentLifecycleIndex = computed(() => {
    const s = this.status();
    if (!s) return -1;
    return LIFECYCLE.indexOf(s.status as (typeof LIFECYCLE)[number]);
  });

  readonly stages = computed<StageTile[]>(() => {
    const s = this.status();
    return [
      { label: 'Excel Upload', completesAt: 'UPLOADED', countLabel: 'Total Records', count: s?.totalRecords ?? 0 },
      { label: 'Validation', completesAt: 'VALIDATED', countLabel: 'Valid Records', count: s?.validRecords ?? 0 },
      {
        label: 'Premium Calculation',
        completesAt: 'PREMIUM_CALCULATED',
        countLabel: 'Premium Calculated',
        count: s?.premiumCalculatedCount ?? 0,
      },
      {
        label: 'GST Rate',
        completesAt: 'GST_CALCULATED',
        countLabel: 'GST Calculated',
        count: s?.gstCalculatedCount ?? 0,
      },
      {
        label: 'Proposal Tag',
        completesAt: 'PROPOSAL_CREATED',
        countLabel: 'Proposals Created',
        count: s?.proposalsCreatedCount ?? 0,
      },
      {
        label: 'Payment Tag',
        completesAt: 'PAYMENT_PROCESSED',
        countLabel: 'Payments Processed',
        count: s?.paymentsProcessedCount ?? 0,
      },
    ];
  });

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('batchId');
    if (!param) {
      this.statusError.set('No batch id was provided.');
      return;
    }
    const id = Number(param);
    if (Number.isNaN(id)) {
      this.statusError.set('Invalid batch id.');
      return;
    }
    this.batchId.set(id);
    this.startPolling(id);
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private startPolling(batchId: number): void {
    this.polling.set(true);
    this.pollSubscription = interval(2500)
      .pipe(
        startWith(0),
        switchMap(() => this.batchService.getStatus(batchId)),
      )
      .subscribe({
        next: (status) => {
          this.statusError.set(null);
          this.status.set(status);
          if (TERMINAL_STATUSES.has(status.status)) {
            this.polling.set(false);
            this.pollSubscription?.unsubscribe();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.polling.set(false);
          this.statusError.set(extractErrorMessage(error));
          this.pollSubscription?.unsubscribe();
        },
      });
  }

  stageState(stage: StageTile): StageState {
    const idx = this.currentLifecycleIndex();
    const stageIdx = LIFECYCLE.indexOf(stage.completesAt);
    if (idx < 0) return 'pending';
    if (idx >= stageIdx) return 'done';
    if (idx === stageIdx - 1) return 'active';
    return 'pending';
  }

  tagPayments(): void {
    const batchId = this.batchId();
    if (batchId === null) return;
    this.paymentBusy.set(true);
    this.paymentError.set(null);
    this.paymentResult.set(null);
    this.batchService.processPayments(batchId).subscribe({
      next: (result) => {
        this.paymentBusy.set(false);
        this.paymentResult.set(result);
        // Resume polling briefly so the pipeline reflects the just-tagged
        // payments/policies without waiting for the next scheduled tick.
        if (!this.polling()) {
          this.startPolling(batchId);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.paymentBusy.set(false);
        this.paymentError.set(extractErrorMessage(error));
      },
    });
  }

  goToBulkPrint(): void {
    const batchId = this.batchId();
    if (batchId === null) return;
    this.router.navigate(['/batch-summary'], { queryParams: { batchId } });
  }

  backToBatchSummary(): void {
    this.router.navigate(['/batch-summary']);
  }
}
