/** Body of `POST /api/reports/policy-issue`. Dates are plain `yyyy-MM-dd` strings from a date input. */
export interface PolicyIssueReportRequest {
  fromDate: string;
  toDate: string;
}
