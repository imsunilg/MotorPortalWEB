// Development environment configuration, used automatically by `ng serve`.
// MotorPortalAPI (the companion .NET 8 Web API) runs via
// `dotnet run --project MotorPortal.API` from the MotorPortalAPI repo.
// Check that repo's Properties/launchSettings.json if the port below ever changes.
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5795/api',
};
