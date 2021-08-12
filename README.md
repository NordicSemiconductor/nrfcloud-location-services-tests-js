# nRF Cloud Location Services tests

Tests the nRF Cloud Location services

- [LOCATE](https://api.feature.nrfcloud.com/v1#operation/LocateDevice)
- [AGPS](https://api.feature.nrfcloud.com/v1#operation/GetAssistanceData)
  (including message validation)
- [PGPS](https://api.feature.nrfcloud.com/v1#operation/GetPredictedAssistanceData)

Configure these environment variables:

- `API_HOST` (optional, endpoint to run the tests against)
- `TEAM_ID`
- `AGPS_SERVICE_KEY`
- `PGPS_SERVICE_KEY`
- `CELLGEO_SERVICE_KEY`

Then run:

    npm ci
    npm run test
