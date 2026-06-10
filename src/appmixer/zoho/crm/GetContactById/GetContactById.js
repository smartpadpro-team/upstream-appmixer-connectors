'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Find contact.
 */
module.exports = {

    async receive(context) {

        const { id } = context.messages.query.content;
        const client = new ZohoClient(context);
        const contact = await client.getRecord('Contacts', id);

        if (contact) {
            return context.sendJson(contact, 'contact');
        }
        return context.sendJson({ id }, 'notFound');

    }
};
