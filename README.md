# nRF Connect for Cloud Location Services tests

Provides test requests for

- [SCELL](https://api.feature.nrfcloud.com/v1#operation/GetSingleCellLocation)
- [MCELL](https://api.feature.nrfcloud.com/v1#operation/GetMultiCellLocations)
- [AGPS](https://api.feature.nrfcloud.com/v1#operation/GetAssistanceData)
- [PGPS](https://api.feature.nrfcloud.com/v1#operation/GetPredictedAssistanceData)

Configure the `API_KEY` environment variable.

    npm ci
    npm run test
