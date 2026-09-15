// Production environment configuration.
// Override apiBaseUrl at build time (or via environment.development.ts for `ng serve`)
// to point at the correct MotorPortalAPI base URL for the target environment.
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.motorportal.example.com/api',
};
