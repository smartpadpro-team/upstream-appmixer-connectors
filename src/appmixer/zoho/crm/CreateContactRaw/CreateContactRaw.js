'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Create new contact in Zoho.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {
        const { contactPayload } = context.messages.contact.content;

        try {
            const client = new ZohoClient(context);
            const createdRecord = await client.executeRecordsRequest('POST', 'Contacts', [contactPayload]);
            const { details } = createdRecord;
            const contactDetails = await client.getRecord('Contacts', details.id);
            return context.sendJson({ contact:contactDetails }, 'success');
        } catch (err) {
            return context.sendJson({ message:err.message,error:err }, 'error');
        }

    }
};
