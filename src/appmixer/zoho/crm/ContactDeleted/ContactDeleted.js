'use strict';
const ZohoNotifiable = require('../../ZohoNotifiable');

class ContactDeleted extends ZohoNotifiable {

    async receive(context) {
        let data = context.messages.webhook.content.data;
        const result = data.ids.map(id => ({ id }));
        await context.sendJson({data:result}, 'out');
    }
}

const events = [
    'Contacts.delete'
];

/**
 * Component which triggers whenever new contact is updated
 */
module.exports = new ContactDeleted(events);
