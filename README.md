# nRF Cloud Location Services tests

Provides test requests for

- [LOCATE](https://api.feature.nrfcloud.com/v1#operation/LocateDevice)
- [AGPS](https://api.feature.nrfcloud.com/v1#operation/GetAssistanceData)
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
