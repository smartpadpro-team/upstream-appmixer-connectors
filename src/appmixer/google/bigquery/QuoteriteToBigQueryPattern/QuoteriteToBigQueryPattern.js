const { BigQuery } = require('@google-cloud/bigquery');
const https = require('https');
const commons = require('../../google-commons');

module.exports = {
    async receive(context) {
        const input = context.messages.in.content;
        const {
            projectId,
            datasetId,
            tableId,
            client_id,
            client_secret,
            lifecycle_id,
            snapshot_date,
            ingested_at
        } = input;

        const bigquery = new BigQuery({
            authClient: commons.getAuthLibraryOAuth2Client(context.auth),
            projectId
        });

        let rawJsonString;
        try {
            rawJsonString = await this.fetchRawPayload(lifecycle_id, client_id, client_secret);
        } catch (error) {
            throw new context.CancelError(`Quoterite API Fetch Failed: ${error.message}`);
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(rawJsonString);
        } catch (parseError) {
            throw new context.CancelError(`Failed to parse Quoterite response as JSON: ${parseError.message}`);
        }

        const rows = [
            {
                lifecycle_id,
                snapshot_date,
                ingested_at,
                snapshot_blob: bigquery.json(parsedPayload)
            }
        ];

        try {
            await bigquery.dataset(datasetId).table(tableId).insert(rows);
        } catch (bqError) {
            throw new context.CancelError(`BigQuery Streaming Error: ${JSON.stringify(bqError)}`);
        }

        return context.sendJson({ status: 'success' }, 'out');
    },

    fetchRawPayload(lifecycleId, clientId, clientSecret) {
        const options = {
            hostname: 'dealers.quoterite.com',
            path: `/service/appmixer/lifecycle/${lifecycleId}`,
            method: 'GET',
            headers: {
                'X-CLIENT-ID': clientId,
                'X-CLIENT-SECRET': clientSecret,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve, reject) => {
            https.get(options, (res) => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`Quoterite returned status code ${res.statusCode}`));
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => { resolve(data); });
            }).on('error', reject);
        });
    }
};
