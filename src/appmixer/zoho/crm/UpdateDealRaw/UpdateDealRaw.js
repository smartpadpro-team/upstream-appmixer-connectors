'use strict';
const ZohoClient = require('../../ZohoClient');


/**
 * Update contact in Zoho.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {
        const { dealPayload  } = context.messages.deal.content;

        try {
            const client = new ZohoClient(context);
            const { details } = await client.executeRecordsRequest('PUT', 'Deals', [dealPayload]);
            const dealDetails = await client.getRecord('Deals', details.id);
            return context.sendJson({ deal:dealDetails }, 'success');
        } catch (err) {
            return context.sendJson({ message:err.message,error:err }, 'error');
        }

    }
};
