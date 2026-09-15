import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PolicyService } from '../../core/services/policy.service';
import { extractErrorMessage } from '../../core/services/api-error.util';
import { PolicyCancelUploadResult } from '../../core/models/policy.model';

@Component({
  selector: 'app-policy-cancel',
  standalone: true,
  imports: [],
  templateUrl: './policy-cancel.html',
  styleUrl: './policy-cancel.css',
})
export class PolicyCancel {
  private readonly policyService = inject(PolicyService);

  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly result = signal<PolicyCancelUploadResult | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadError.set(null);
    this.result.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Please select an Excel file with a POLICY_NO column.');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);
    this.result.set(null);

    this.policyService.cancelUpload(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.result.set(result);
      },
      error: (error: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadError.set(extractErrorMessage(error));
      },
    });
  }

  reset(): void {
    this.selectedFile.set(null);
    this.uploadError.set(null);
    this.result.set(null);
  }
}
