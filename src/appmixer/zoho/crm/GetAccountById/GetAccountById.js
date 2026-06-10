'use strict';
const ZohoClient = require('../../ZohoClient');

/**
 * Find contact.
 */
module.exports = {

    async receive(context) {

        const { id } = context.messages.query.content;
        const client = new ZohoClient(context);

        try {
            const account = await client.getRecord('Accounts', id);
            if (account) {
                return context.sendJson({ account: account }, 'out');
            }
        } catch (err) {
            return context.sendJson({ message: err.message, error: err }, 'error');
        }

    }
};
