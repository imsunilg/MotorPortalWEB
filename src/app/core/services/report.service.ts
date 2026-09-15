import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PolicyIssueReportRequest } from '../models/report.model';

/** Talks to the `/api/reports` endpoints on MotorPortalAPI. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports`;

  /**
   * Downloads the Policy Issue Report as an .xlsx Blob. Verified live: the
   * API always returns 200 with a workbook (header row only when no
   * policies were issued in the range) — it never returns a "no data"
   * error — so callers should always trigger the download on success and
   * only surface an error for real transport/HTTP failures.
   */
  exportPolicyIssueReport(request: PolicyIssueReportRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/policy-issue`, request, { responseType: 'blob' });
  }
}
