'use strict';
const { makeRequest, sendArrayOutput, logDeprecatedMinorVersion } = require('../../commons');

/**
 * Component for retrieving active QuickBooks tax codes.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { minorVersion = 75, maxResults, outputType = 'items' } = context.messages.in.content || {};

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        await logDeprecatedMinorVersion(context, minorVersion);

        let query = 'select * from TaxCode';

        if (maxResults) {
            query += ` maxresults ${maxResults}`;
        }

        const options = {
            path: `v3/company/${context.profileInfo.companyId}/query?minorversion=${minorVersion}&query=${encodeURIComponent(query)}`,
            method: 'GET'
        };
        const response = await makeRequest({ context, options });
        const records = (response.data?.QueryResponse?.TaxCode || []).filter(taxCode => taxCode.Active === true);

        return sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType,
            records
        });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'item') {
            return context.sendJson([
                { label: 'Name', value: 'Name' },
                { label: 'Description', value: 'Description' },
                { label: 'Active', value: 'Active' },
                { label: 'Taxable', value: 'Taxable' },
                { label: 'TaxGroup', value: 'TaxGroup' },
                { label: 'Id', value: 'Id' },
                { label: 'SyncToken', value: 'SyncToken' },
                {
                    label: 'MetaData', value: 'MetaData',
                    schema: {
                        type: 'object',
                        properties: {
                            CreateTime: { label: 'CreateTime', value: 'CreateTime' },
                            LastUpdatedTime: { label: 'LastUpdatedTime', value: 'LastUpdatedTime' }
                        }
                    }
                }
            ], 'out');
        } else if (outputType === 'items') {
            return context.sendJson([{
                label: 'Items',
                value: 'items',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            Name: { type: 'string', title: 'Name' },
                            Description: { type: 'string', title: 'Description' },
                            Active: { type: 'boolean', title: 'Active' },
                            Taxable: { type: 'boolean', title: 'Taxable' },
                            TaxGroup: { type: 'boolean', title: 'TaxGroup' },
                            Id: { type: 'string', title: 'Id' },
                            SyncToken: { type: 'string', title: 'SyncToken' },
                            MetaData: {
                                type: 'object',
                                title: 'MetaData',
                                schema: {
                                    type: 'object',
                                    properties: {
                                        CreateTime: { label: 'CreateTime', value: 'CreateTime' },
                                        LastUpdatedTime: { label: 'LastUpdatedTime', value: 'LastUpdatedTime' }
                                    }
                                }
                            }
                        }
                    }
                }
            }], 'out');
        } else {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
