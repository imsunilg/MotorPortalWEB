// Development environment configuration, used automatically by `ng serve`.
// MotorPortalAPI (the companion .NET 8 Web API) runs via
// `dotnet run --project MotorPortal.API` from the MotorPortalAPI repo.
// Check that repo's Properties/launchSettings.json if the port below ever changes.
//
// The API host is derived from the browser's own location (window.location.hostname)
// rather than hardcoded to 'localhost', so the same build works whether it's opened
// as http://localhost:4795 on this machine or http://<lan-ip>:4795 from a phone/tablet
// on the same Wi-Fi — both the dev server and the API must be started bound to 0.0.0.0
// (`ng serve --host 0.0.0.0`, `dotnet run --urls http://0.0.0.0:5795`) for this to work.
export const environment = {
  production: false,
  apiBaseUrl: `http://${window.location.hostname}:5795/api`,
};
