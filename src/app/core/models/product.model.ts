/**
 * Product and function master data.
 *
 * The API does not yet expose a `GET /api/products` (or functions) endpoint,
 * so these are hardcoded from the seeded `product_master` / `function_master`
 * rows (confirmed via direct DB query against SGInsuranceDB). If the API
 * later exposes these as endpoints, replace this file with a service call.
 */
export interface Product {
  productId: number;
  code: string;
  name: string;
}

export const PRODUCTS: Product[] = [
  { productId: 1, code: 'CLASS_E', name: 'Motor Class-E' },
  { productId: 2, code: 'CLASS_F', name: 'Motor Class-F' },
  { productId: 3, code: 'EICHER', name: 'Eicher Motor' },
];

export interface ProcessOption {
  functionId: number;
  code: string;
  name: string;
  route: string;
}

export const PROCESS_OPTIONS: ProcessOption[] = [
  { functionId: 1, code: 'EXCEL_UPLOAD', name: 'Motor Excel Upload', route: '/excel-upload' },
  { functionId: 5, code: 'BATCH_SUMMARY', name: 'Motor Batch Summary', route: '/batch-summary' },
  { functionId: 2, code: 'REPORT', name: 'Motor Report', route: '/reports' },
  { functionId: 4, code: 'SEARCH_PRINT', name: 'Search & Print Policy', route: '/policy-search' },
  { functionId: 3, code: 'POLICY_CANCEL', name: 'Policy Cancel Upload', route: '/policy-cancel' },
];
