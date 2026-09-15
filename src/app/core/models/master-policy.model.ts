/** `GET /api/master-policies` and `GET /api/master-policies/{id}/cd-balance` — verified live. */
export interface MasterPolicy {
  masterPolicyId: number;
  masterPolicyNo: string;
  customerNo: string;
  cdbgNo: string;
  productId: number;
}

export interface CdBalance {
  masterPolicyId: number;
  masterPolicyNo: string;
  cdBalance: number;
}
