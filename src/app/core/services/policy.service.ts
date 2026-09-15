import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CertificateGenerateResult,
  PolicyCancelUploadResult,
  PolicySearchResult,
} from '../models/policy.model';

/** Talks to the `/api/policies` endpoints on MotorPortalAPI. */
@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/policies`;

  search(query: {
    engineNo?: string | null;
    chassisNo?: string | null;
    tcNo?: string | null;
    policyNo?: string | null;
  }): Observable<PolicySearchResult[]> {
    let params = new HttpParams();
    if (query.engineNo) params = params.set('engineNo', query.engineNo);
    if (query.chassisNo) params = params.set('chassisNo', query.chassisNo);
    if (query.tcNo) params = params.set('tcNo', query.tcNo);
    if (query.policyNo) params = params.set('policyNo', query.policyNo);
    return this.http.get<PolicySearchResult[]>(`${this.baseUrl}/search`, { params });
  }

  generateCertificate(policyId: number): Observable<CertificateGenerateResult> {
    return this.http.post<CertificateGenerateResult>(
      `${this.baseUrl}/${policyId}/certificate`,
      {},
    );
  }

  /**
   * Downloads the certificate PDF as a Blob. Uses HttpClient (which carries
   * the auth interceptor's Bearer token) rather than a plain `<a href>`,
   * since the endpoint is behind `[Authorize]` and a bare anchor tag can't
   * attach an Authorization header.
   */
  getCertificateBlob(policyId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${policyId}/certificate`, { responseType: 'blob' });
  }

  /**
   * Uploads a `POLICY_NO`-column Excel file to `POST /api/policies/cancel-upload`.
   * Every row is processed independently by the API — a row failing (e.g.
   * unknown policy number) never fails the whole request — so this only
   * rejects on transport-level errors (bad file type, network, auth, etc.).
   */
  cancelUpload(file: File): Observable<PolicyCancelUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PolicyCancelUploadResult>(`${this.baseUrl}/cancel-upload`, formData);
  }
}
