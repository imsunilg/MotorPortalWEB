import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PRODUCTS, PROCESS_OPTIONS, Product, ProcessOption } from '../../core/models/product.model';
import { MasterPolicy } from '../../core/models/master-policy.model';
import { MasterPolicyService } from '../../core/services/master-policy.service';
import { extractErrorMessage } from '../../core/services/api-error.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly masterPolicyService = inject(MasterPolicyService);

  readonly products = PRODUCTS;
  readonly processes = PROCESS_OPTIONS;

  readonly selectedProductId = signal<number | null>(null);
  readonly selectedFunctionId = signal<number | null>(null);
  readonly showValidation = signal(false);

  // CD balance drawer state.
  readonly drawerOpen = signal(false);
  readonly masterPolicies = signal<MasterPolicy[]>([]);
  readonly masterPoliciesLoading = signal(false);
  readonly masterPoliciesError = signal<string | null>(null);
  readonly selectedMasterPolicyId = signal<number | null>(null);
  readonly cdBalanceLoading = signal(false);
  readonly cdBalanceError = signal<string | null>(null);
  readonly cdBalance = signal<number | null>(null);

  get selectedMasterPolicy(): MasterPolicy | null {
    const id = this.selectedMasterPolicyId();
    return this.masterPolicies().find((p) => p.masterPolicyId === id) ?? null;
  }

  ngOnInit(): void {
    this.loadMasterPolicies();
  }

  selectProduct(productId: number): void {
    this.selectedProductId.set(productId);
  }

  selectProcess(functionId: number): void {
    this.selectedFunctionId.set(functionId);
  }

  submit(): void {
    const productId = this.selectedProductId();
    const functionId = this.selectedFunctionId();
    if (productId === null || functionId === null) {
      this.showValidation.set(true);
      return;
    }
    const process = this.processes.find((p) => p.functionId === functionId);
    if (!process) {
      return;
    }
    this.router.navigate([process.route], { queryParams: { productId } });
  }

  toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
    if (this.drawerOpen() && this.masterPolicies().length === 0) {
      this.loadMasterPolicies();
    }
  }

  loadMasterPolicies(): void {
    this.masterPoliciesLoading.set(true);
    this.masterPoliciesError.set(null);
    this.masterPolicyService.list().subscribe({
      next: (policies) => {
        this.masterPoliciesLoading.set(false);
        this.masterPolicies.set(policies);
      },
      error: (error: HttpErrorResponse) => {
        this.masterPoliciesLoading.set(false);
        this.masterPoliciesError.set(extractErrorMessage(error));
      },
    });
  }

  onMasterPolicyChange(masterPolicyId: string): void {
    this.selectedMasterPolicyId.set(masterPolicyId ? Number(masterPolicyId) : null);
    this.cdBalance.set(null);
    this.cdBalanceError.set(null);
  }

  submitCdBalance(): void {
    const masterPolicyId = this.selectedMasterPolicyId();
    if (masterPolicyId === null) {
      return;
    }
    this.cdBalanceLoading.set(true);
    this.cdBalanceError.set(null);
    this.cdBalance.set(null);
    this.masterPolicyService.getCdBalance(masterPolicyId).subscribe({
      next: (result) => {
        this.cdBalanceLoading.set(false);
        this.cdBalance.set(result.cdBalance);
      },
      error: (error: HttpErrorResponse) => {
        this.cdBalanceLoading.set(false);
        this.cdBalanceError.set(extractErrorMessage(error));
      },
    });
  }
}
