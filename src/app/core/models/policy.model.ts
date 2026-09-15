/**
 * One row of `GET /api/policies/search?engineNo=&chassisNo=&tcNo=&policyNo=`.
 *
 * Verified live against `MotorPortal.Application/DTOs/PolicyDtos.cs`
 * (`PolicySearchResultDto`). Note there is no master-policy number/id on
 * this DTO — the search endpoint only returns per-policy fields.
 */
export interface PolicySearchResult {
  policyId: number;
  policyNo: string;
  make: string | null;
  model: string | null;
  engineNo: string;
  chassisNo: string;
  premium: number;
  status: string;
  issuedOn: string;
}

/**
 * Display model for the policy-certificate view. `masterPolicyNo` is not
 * available from any read endpoint keyed by policy id/no (the search DTO
 * doesn't carry it) — it is only ever populated when the caller happens to
 * know it and passes it through router state (e.g. a future screen that
 * already has both). When unknown it is left `null` and shown as "Not
 * available" rather than guessed.
 */
export interface PolicyCertificateDisplay {
  policyId: number;
  policyNo: string;
  masterPolicyNo: string | null;
  make: string | null;
  model: string | null;
  engineNo: string;
  chassisNo: string;
  premium: number;
  issuedOn: string;
}

/** Response of `POST /api/policies/{id}/certificate`. */
export interface CertificateGenerateResult {
  policyId: number;
  certPath: string;
  generatedFile: string;
}

/** One rejected row of `POST /api/policies/cancel-upload`. */
export interface PolicyCancelRejection {
  policyNo: string;
  reason: string;
}

/**
 * Response of `POST /api/policies/cancel-upload`.
 *
 * Verified live against the running API (`PolicyCancelUploadResultDto`):
 * `cancelled` holds the policy numbers that were cancelled by this upload,
 * `rejected` holds every row that couldn't be cancelled with a reason
 * (e.g. "Policy not found", "Policy already cancelled").
 */
export interface PolicyCancelUploadResult {
  cancelled: string[];
  rejected: PolicyCancelRejection[];
}
