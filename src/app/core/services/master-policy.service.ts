import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CdBalance, MasterPolicy } from '../models/master-policy.model';

/** Talks to the `/api/master-policies` endpoints (verified live). */
@Injectable({ providedIn: 'root' })
export class MasterPolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/master-policies`;

  list(): Observable<MasterPolicy[]> {
    return this.http.get<MasterPolicy[]>(this.baseUrl);
  }

  getCdBalance(masterPolicyId: number): Observable<CdBalance> {
    return this.http.get<CdBalance>(`${this.baseUrl}/${masterPolicyId}/cd-balance`);
  }
}
