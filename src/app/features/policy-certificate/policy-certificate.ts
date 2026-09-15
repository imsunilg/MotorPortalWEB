import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { PolicyCertificateDisplay } from '../../core/models/policy.model';

/** Router state a caller can pass when navigating here, avoiding a re-fetch. */
export interface PolicyCertificateNavState {
  policyNo?: string;
  masterPolicyNo?: string;
  make?: string;
  model?: string;
  engineNo?: string;
  chassisNo?: string;
  premium?: number;
  issuedOn?: string;
}

@Component({
  selector: 'app-policy-certificate',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './policy-certificate.html',
  styleUrl: './policy-certificate.css',
})
export class PolicyCertificate implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly policyService = inject(PolicyService);

  readonly policyId = signal<number | null>(null);
  readonly policy = signal<PolicyCertificateDisplay | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly printBusy = signal(false);
  readonly printError = signal<string | null>(null);
  readonly downloadBusy = signal(false);
  readonly downloadError = signal<string | null>(null);
  readonly downloadSuccess = signal(false);

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('policyId');
    if (!param) {
      this.loadError.set('No policy id was provided.');
      return;
    }
    const id = Number(param);
    if (Number.isNaN(id)) {
      this.loadError.set('Invalid policy id.');
      return;
    }
    this.policyId.set(id);

    // Prefer router state (passed by the caller via `router.navigate(..., { state })`)
    // so we skip a network call when the previous screen already has the
    // display fields. Angular's Router persists navigation `state` onto
    // `history.state`, which is still readable here after the navigation
    // completes (unlike `getCurrentNavigation()`, which is already null by
    // the time a lazy-loaded routed component's `ngOnInit` runs).
    const state = window.history.state as PolicyCertificateNavState | undefined;

    if (state && state.policyNo && state.engineNo && state.chassisNo && state.issuedOn !== undefined) {
      this.policy.set({
        policyId: id,
        policyNo: state.policyNo,
        masterPolicyNo: state.masterPolicyNo ?? null,
        make: state.make ?? null,
        model: state.model ?? null,
        engineNo: state.engineNo,
        chassisNo: state.chassisNo,
        premium: state.premium ?? 0,
        issuedOn: state.issuedOn,
      });
      return;
    }

    // Fall back to a search call. We need some key to search by — prefer a
    // policyNo passed via query params (e.g. from a bulk-print results
    // list), otherwise there is no way to look up a policy by bare id since
    // the API's search endpoint only accepts engineNo/chassisNo/tcNo/policyNo.
    const policyNoParam = this.route.snapshot.queryParamMap.get('policyNo');
    if (!policyNoParam) {
      this.loadError.set(
        'No display details were passed for this policy and no policy number was provided to look it up.',
      );
      return;
    }
    this.loadByPolicyNo(id, policyNoParam);
  }

  private loadByPolicyNo(policyId: number, policyNo: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.policyService.search({ policyNo }).subscribe({
      next: (results) => {
        this.loading.set(false);
        const match = results.find((r) => r.policyId === policyId) ?? results[0];
        if (!match) {
          this.loadError.set(`No policy found for policy number ${policyNo}.`);
          return;
        }
        this.policy.set({
          policyId: match.policyId,
          policyNo: match.policyNo,
          masterPolicyNo: null,
          make: match.make,
          model: match.model,
          engineNo: match.engineNo,
          chassisNo: match.chassisNo,
          premium: match.premium,
          issuedOn: match.issuedOn,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(extractErrorMessage(error));
      },
    });
  }

  /** Fetches the PDF via HttpClient (auth header attached by the interceptor) and opens it in a new tab. */
  print(): void {
    const id = this.policyId();
    if (id === null) return;
    this.printBusy.set(true);
    this.printError.set(null);
    this.policyService.getCertificateBlob(id).subscribe({
      next: (blob) => {
        this.printBusy.set(false);
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
          this.printError.set('Pop-up blocked. Please allow pop-ups to view the certificate.');
        }
        // Revoke after a delay so the newly opened tab has time to load it.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error: HttpErrorResponse) => {
        this.printBusy.set(false);
        this.printError.set(extractErrorMessage(error));
      },
    });
  }

  /** Fetches the PDF via HttpClient and triggers a save-as download through an object URL anchor. */
  download(): void {
    const id = this.policyId();
    const policyNo = this.policy()?.policyNo ?? id;
    if (id === null) return;
    this.downloadBusy.set(true);
    this.downloadError.set(null);
    this.downloadSuccess.set(false);
    this.policyService.getCertificateBlob(id).subscribe({
      next: (blob) => {
        this.downloadBusy.set(false);
        this.downloadSuccess.set(true);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `policy-${policyNo}-certificate.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      },
      error: (error: HttpErrorResponse) => {
        this.downloadBusy.set(false);
        this.downloadError.set(extractErrorMessage(error));
      },
    });
  }

  backToBatchSummary(): void {
    this.router.navigate(['/batch-summary']);
  }
}
