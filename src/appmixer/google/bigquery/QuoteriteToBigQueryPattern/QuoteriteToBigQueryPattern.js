'use strict';

const { BigQuery } = require('@google-cloud/bigquery');
const commons = require('../../google-commons');

module.exports = {

    async receive(context) {
        const input = context.messages.in.content;
        const items = Array.isArray(input.items) ? input.items : [];

        if (items.length === 0) {
            return context.sendJson({ status: 'success', message: 'No items to process.' }, 'out');
        }

        context.log({ level: 'info', message: `Beginning sequential-batch ingestion for ${items.length} items.` });

        // 1. Initialize BigQuery client
        const client = new BigQuery({
            authClient: commons.getAuthLibraryOAuth2Client(context.auth),
            projectId: input.projectId
        });

        const tableRef = client.dataset(input.datasetId).table(input.tableId);
        const [table] = await tableRef.get();
        const { schema } = table.metadata;

        // 2. Set up the BigQuery stream wrapper
        return new Promise((resolve, reject) => {
            const writeStream = tableRef.createWriteStream({
                sourceFormat: 'NEWLINE_DELIMITED_JSON',
                schema,
                writeDisposition: 'WRITE_APPEND'
            }).on('complete', (job) => {
                context.log({ level: 'info', message: `BigQuery successfully committed all records.` });
                context.sendJson({ status: 'success', totalProcessed: items.length }, 'out');
                resolve(job);
            }).on('error', (err) => {
                context.log({ level: 'error', message: `BigQuery Stream Error: ${err.message}` });
                reject(err);
            });

            // 3. Run an async execution block to process chunks strictly in order
            (async () => {
                try {
                    const concurrencyLimit = 20;
                    
                    // Standard chunking loop
                    for (let i = 0; i < items.length; i += concurrencyLimit) {
                        const batch = items.slice(i, i + concurrencyLimit);
                        
                        context.log({ level: 'info', message: `Downloading batch indices ${i} to ${i + batch.length}...` });

                        // Fire off 20 downloads simultaneously and wait for ALL 20 to complete
                        await Promise.all(batch.map(async (item) => {
                            try {
                                const response = await context.httpRequest({
                                    url: `https://dealers.quoterite.com/service/appmixer/lifecycle/${item.lifeCycleId}`,
                                    method: 'GET',
                                    headers: {
                                        'X-CLIENT-ID': input.client_id,
                                        'X-CLIENT-SECRET': input.client_secret,
                                        'Content-Type': 'application/json'
                                    }
                                });

                                const row = {
                                    lifecycle_id: item.lifeCycleId,
                                    snapshot_date: item.updated_at,
                                    ingested_at: input.ingested_at,
                                    snapshot_blob: JSON.stringify(response.data)
                                };

                                // Write instantly to the open pipeline
                                writeStream.write(JSON.stringify(row) + '\n');

                            } catch (fetchError) {
                                context.log({ level: 'error', message: `Skipped ID ${item.lifeCycleId}: ${fetchError.message}` });
                            }
                        }));
                    }

                    // 4. CRITICAL: This line is now only reached after the main 'for' loop finishes every item
                    context.log({ level: 'info', message: 'All batches downloaded. Closing BigQuery upload stream...' });
                    writeStream.end();

                } catch (loopError) {
                    writeStream.destroy();
                    reject(loopError);
                }
            })();
        });
    }
};