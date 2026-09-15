/** Result of a successful `POST /api/batches/upload`. */
export interface BatchUploadResult {
  batchId: number;
  totalRecords: number;
}

/** One row-level error inside a validation-failure upload response. */
export interface ExcelRowError {
  row: number;
  reason: string;
}

/** Body of a 400 validation-failure response from `POST /api/batches/upload`. */
export interface BatchUploadValidationError {
  message: string;
  errors: ExcelRowError[];
}

/** Response of `POST /api/batches/{id}/process`. */
export interface BatchProcessSummary {
  batchId: number;
  validCount: number;
  invalidCount: number;
  premiumCalculated: number;
  proposalsCreated: number;
  status: string;
}

/** Response of `GET /api/batches/{id}/status`. */
export interface BatchStatus {
  batchId: number;
  fileName: string;
  status: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  createdOn: string;
  premiumCalculatedCount: number;
  gstCalculatedCount: number;
  proposalsCreatedCount: number;
  paymentsProcessedCount: number;
  policiesCreatedCount: number;
}

/** One row of `GET /api/batches/{id}/invalid-records`. */
export interface InvalidRecord {
  transitDate: string | null;
  invoiceNo: string | null;
  engineNo: string | null;
  chassisNo: string | null;
  errorRemarks: string;
}

/**
 * One row of `GET /api/batches?fromDate=&toDate=`.
 *
 * NOTE: this endpoint is now live and verified. However, passing fromDate
 * / toDate query params currently triggers a 400 from a backend bug
 * ("Cannot write DateTime with Kind=Unspecified to PostgreSQL type
 * 'timestamp with time zone'") - calling with no params works fine. This is
 * a backend issue outside this repo's scope; the frontend only sends these
 * params when the user picks a date.
 */
export interface BatchSummaryRow {
  batchId: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  pendingProcessing: number;
  paymentPending: number;
  paymentProcessed: number;
  status: string;
  createdOn: string;
}

/**
 * `GET /api/batches/summary-counters?fromDate=&toDate=`.
 *
 * NOTE: verified live against the running API — the field is named
 * `pendingBatchProcessing` here (unlike `pendingProcessing` on
 * `BatchSummaryRow` from the plain `/batches` list); this is a real,
 * confirmed inconsistency in the API's two response shapes, not a typo.
 */
export interface BatchSummaryCounters {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  pendingBatchProcessing: number;
  paymentPending: number;
  paymentProcessed: number;
}

/** One entry of `POST /api/batches/{id}/payments` results. */
export interface PaymentResult {
  proposalId: number;
  success: boolean;
  message: string;
}

/** Response of `POST /api/batches/{id}/payments`. */
export interface PaymentBatchResult {
  batchId: number;
  results: PaymentResult[];
  succeededCount: number;
  failedCount: number;
  policiesCreated: number;
  batchStatus: string;
}

/** One certificate of `POST /api/batches/{id}/bulk-print` results. */
export interface BulkPrintCertificate {
  policyId: number;
  policyNo: string;
  certPath: string;
}

/** Response of `POST /api/batches/{id}/bulk-print`. */
export interface BulkPrintResult {
  batchId: number;
  status: string;
  certificates: BulkPrintCertificate[];
}
