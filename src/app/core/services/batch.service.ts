import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BatchProcessSummary,
  BatchStatus,
  BatchSummaryCounters,
  BatchSummaryRow,
  BatchUploadResult,
  BulkPrintResult,
  InvalidRecord,
  PaymentBatchResult,
} from '../models/batch.model';

/** Talks to the `/api/batches` endpoints on MotorPortalAPI. */
@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/batches`;

  upload(productId: number, functionId: number, file: File): Observable<BatchUploadResult> {
    const formData = new FormData();
    formData.append('productId', String(productId));
    formData.append('functionId', String(functionId));
    formData.append('file', file);
    return this.http.post<BatchUploadResult>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Downloads the sample upload template. The API accepts a batch id in the
   * route but does not use it (it always returns the same static template),
   * so this can be called before a batch exists.
   */
  downloadSampleTemplate(batchId: number | null = 0): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${batchId ?? 0}/sample-template`, {
      responseType: 'blob',
    });
  }

  process(batchId: number): Observable<BatchProcessSummary> {
    return this.http.post<BatchProcessSummary>(`${this.baseUrl}/${batchId}/process`, {});
  }

  getStatus(batchId: number): Observable<BatchStatus> {
    return this.http.get<BatchStatus>(`${this.baseUrl}/${batchId}/status`);
  }

  getInvalidRecords(batchId: number): Observable<InvalidRecord[]> {
    return this.http.get<InvalidRecord[]>(`${this.baseUrl}/${batchId}/invalid-records`);
  }

  clearInvalidRecords(batchId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${batchId}/invalid-records`);
  }

  /** NOTE: not yet implemented on the API as of this build — see batch.model.ts. */
  list(fromDate: string | null, toDate: string | null): Observable<BatchSummaryRow[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<BatchSummaryRow[]>(this.baseUrl, { params });
  }

  /** NOTE: not yet implemented on the API as of this build — see batch.model.ts. */
  getSummaryCounters(
    fromDate: string | null,
    toDate: string | null,
  ): Observable<BatchSummaryCounters> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<BatchSummaryCounters>(`${this.baseUrl}/summary-counters`, { params });
  }

  processPayments(batchId: number): Observable<PaymentBatchResult> {
    return this.http.post<PaymentBatchResult>(`${this.baseUrl}/${batchId}/payments`, {});
  }

  bulkPrint(batchId: number): Observable<BulkPrintResult> {
    return this.http.post<BulkPrintResult>(`${this.baseUrl}/${batchId}/bulk-print`, {});
  }
}
