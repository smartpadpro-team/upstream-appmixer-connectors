'use strict';
const ZohoClient = require('../../ZohoClient');


/**
 * Update contact in Zoho.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {
        const { contactPayload  } = context.messages.contact.content;

        try {
            const client = new ZohoClient(context);
            const { details } = await client.executeRecordsRequest('PUT', 'Contacts', [contactPayload]);
            const contactDetails = await client.getRecord('Contacts', details.id);
            return context.sendJson({ contact:contactDetails }, 'success');
        } catch (err) {
            return context.sendJson({ message:err.message,error:err }, 'error');
        }

    }
};
