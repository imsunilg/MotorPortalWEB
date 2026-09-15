import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { PolicySearchResult } from '../../core/models/policy.model';
import { PolicyCertificateNavState } from '../policy-certificate/policy-certificate';

@Component({
  selector: 'app-policy-search',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './policy-search.html',
  styleUrl: './policy-search.css',
})
export class PolicySearch {
  private readonly policyService = inject(PolicyService);
  private readonly router = inject(Router);

  readonly engineNo = signal('');
  readonly chassisNo = signal('');
  readonly tcNo = signal('');
  readonly policyNo = signal('');

  readonly validationError = signal<string | null>(null);
  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly results = signal<PolicySearchResult[] | null>(null);

  search(): void {
    const engineNo = this.engineNo().trim();
    const chassisNo = this.chassisNo().trim();
    const tcNo = this.tcNo().trim();
    const policyNo = this.policyNo().trim();

    if (!engineNo && !chassisNo && !tcNo && !policyNo) {
      this.validationError.set(
        'Enter at least one of Engine Number, Chassis Number, TC Number or Policy Number.',
      );
      this.results.set(null);
      return;
    }

    this.validationError.set(null);
    this.searching.set(true);
    this.searchError.set(null);
    this.results.set(null);

    this.policyService.search({ engineNo, chassisNo, tcNo, policyNo }).subscribe({
      next: (results) => {
        this.searching.set(false);
        this.results.set(results);
      },
      error: (error: HttpErrorResponse) => {
        this.searching.set(false);
        this.searchError.set(extractErrorMessage(error));
      },
    });
  }

  reset(): void {
    this.engineNo.set('');
    this.chassisNo.set('');
    this.tcNo.set('');
    this.policyNo.set('');
    this.validationError.set(null);
    this.searchError.set(null);
    this.results.set(null);
  }

  print(result: PolicySearchResult): void {
    const state: PolicyCertificateNavState = {
      policyNo: result.policyNo,
      make: result.make ?? undefined,
      model: result.model ?? undefined,
      engineNo: result.engineNo,
      chassisNo: result.chassisNo,
      premium: result.premium,
      issuedOn: result.issuedOn,
    };
    this.router.navigate(['/policy-certificate', result.policyId], { state });
  }
}
