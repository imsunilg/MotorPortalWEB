import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PRODUCTS } from '../../core/models/product.model';
import { BatchService } from '../../core/services/batch.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { BatchProcessSummary, BatchUploadResult, ExcelRowError } from '../../core/models/batch.model';

const EXCEL_UPLOAD_FUNCTION_ID = 1;

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [],
  templateUrl: './excel-upload.html',
  styleUrl: './excel-upload.css',
})
export class ExcelUpload implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly batchService = inject(BatchService);

  readonly products = PRODUCTS;
  readonly selectedProductId = signal<number | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly uploading = signal(false);
  readonly uploadResult = signal<BatchUploadResult | null>(null);
  readonly uploadErrorMessage = signal<string | null>(null);
  readonly uploadRowErrors = signal<ExcelRowError[]>([]);

  readonly processing = signal(false);
  readonly processError = signal<string | null>(null);
  readonly processSummary = signal<BatchProcessSummary | null>(null);

  readonly downloadingTemplate = signal(false);
  readonly templateError = signal<string | null>(null);

  ngOnInit(): void {
    const queryProductId = this.route.snapshot.queryParamMap.get('productId');
    if (queryProductId) {
      const parsed = Number(queryProductId);
      if (!Number.isNaN(parsed)) {
        this.selectedProductId.set(parsed);
      }
    }
  }

  selectProduct(productId: number): void {
    this.selectedProductId.set(productId);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadResult.set(null);
    this.uploadErrorMessage.set(null);
    this.uploadRowErrors.set([]);
    this.processSummary.set(null);
    this.processError.set(null);
    // Clear the native input value so selecting the exact same file again
    // (e.g. after a failed upload, to retry the same file) still fires 'change'.
    input.value = '';
  }

  downloadSampleTemplate(): void {
    this.downloadingTemplate.set(true);
    this.templateError.set(null);
    this.batchService.downloadSampleTemplate(this.uploadResult()?.batchId ?? 0).subscribe({
      next: (blob) => {
        this.downloadingTemplate.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'batch-upload-template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: HttpErrorResponse) => {
        this.downloadingTemplate.set(false);
        this.templateError.set(extractErrorMessage(error));
      },
    });
  }

  upload(): void {
    const productId = this.selectedProductId();
    const file = this.selectedFile();
    if (productId === null || !file) {
      this.uploadErrorMessage.set('Please select a product and a file to upload.');
      return;
    }

    this.uploading.set(true);
    this.uploadErrorMessage.set(null);
    this.uploadRowErrors.set([]);
    this.uploadResult.set(null);

    this.batchService.upload(productId, EXCEL_UPLOAD_FUNCTION_ID, file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.uploadResult.set(result);
      },
      error: (error: HttpErrorResponse) => {
        this.uploading.set(false);
        const body = error.error as { message?: string; errors?: ExcelRowError[] } | null;
        if (body?.errors?.length) {
          this.uploadErrorMessage.set(body.message ?? 'The uploaded file has validation errors.');
          this.uploadRowErrors.set(body.errors);
        } else {
          this.uploadErrorMessage.set(extractErrorMessage(error));
        }
      },
    });
  }

  processBatch(): void {
    const batchId = this.uploadResult()?.batchId;
    if (!batchId) {
      return;
    }
    this.processing.set(true);
    this.processError.set(null);
    this.batchService.process(batchId).subscribe({
      next: (summary) => {
        this.processing.set(false);
        this.processSummary.set(summary);
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.processError.set(extractErrorMessage(error));
      },
    });
  }

  goToBatchSummary(): void {
    this.router.navigate(['/batch-summary']);
  }
}
