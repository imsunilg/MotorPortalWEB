/** Shape of every non-2xx JSON error response from MotorPortalAPI. */
export interface ApiError {
  statusCode: number;
  message: string;
  traceId: string;
}
