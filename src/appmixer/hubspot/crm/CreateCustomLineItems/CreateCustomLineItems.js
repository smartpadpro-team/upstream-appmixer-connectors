'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    prepareLineItems(dealId, lineItemArrayJsonString, context) {
        try {
            const parsedArray = JSON.parse(lineItemArrayJsonString);
            let lineItems = [];

            parsedArray.forEach(item => {
                if (item.hasOwnProperty('name') && item.hasOwnProperty('quantity') && item.hasOwnProperty('price')) {
                    const lineItem = {
                        "associations": [{
                            "types": [{
                                "associationCategory": "HUBSPOT_DEFINED",
                                "associationTypeId": 20 //association ID for Deals - Line Items
                            }],
                            "to": {"id": dealId}
                        }],
                        "properties": {
                            "name": item.name,
                            "quantity": item.quantity,
                            "price": item.price
                        }
                    };

                    // Add discount property if it exists in item
                    if (item.hasOwnProperty('discount')) {
                        lineItem.properties.discount = item.discount;
                    }

                    lineItems.push(lineItem);
                } else {
                    throw new Error('Missing name/quantity/price in the JSON String');
                }
            });

            return lineItems;

        } catch (parseErr) {
            context.log(parseErr.message);
            throw new context.CancelError('Invalid JSON String');
        }

    },
    async receive(context) {

        const {
            dealId,
            lineItemJsonString
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        const lineItems = this.prepareLineItems(dealId, lineItemJsonString, context);

        const batchCreateLineItems = {
            inputs: lineItems
        };

        try {
            const response = await hs.call('post', 'crm/v3/objects/line_items/batch/create', batchCreateLineItems);
            const {results} = response.data;

            const createBatchResult = {
                status: response.status,
                results: results
            };
            return context.sendJson(createBatchResult, 'out');
        } catch (err) {
            context.log(err);
            throw err;
        }


    }
};
