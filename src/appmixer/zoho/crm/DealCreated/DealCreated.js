'use strict';
const ZohoNotifiable = require('../../ZohoNotifiable');

class DealCreated extends ZohoNotifiable {

    async receive(context) {

        let { ids } = context.messages.webhook.content.data;
        ids = ids.join(',');
        const moduleName = 'Deals';
        const allAtOnce = true;
        const { records } = await context.componentStaticCall(
            'appmixer.zoho.crm.ListRecords',
            'out',
            {
                messages: { in: { moduleName, allAtOnce, ids } }
            }
        );
        for (const deal of records) {
            await context.sendJson(deal, 'deal');
        }

    }
}

const events = [
    'Deals.create'
];

/**
 * Component which triggers whenever new deal is created
 */
module.exports = new DealCreated(events);
