'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    // Function to parse and clean the input string
     parseCommaSeparatedString(inputString) {
        return inputString.split(',')
            .map(item => item.trim())  // Remove leading/trailing whitespace
            .filter(item => item)      // Remove any empty strings resulting from trailing commas
            .map(Number);              // Convert to numbers
    },

    async receive(context) {

        const {
            lineItemIds
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        const parsedIds = this.parseCommaSeparatedString(lineItemIds);
        let deleteInputs = [];
        parsedIds.forEach(item => {
            deleteInputs.push({"id":item});
        });

        const batchDeleteLineItems = {
            inputs: deleteInputs
        };

        try {
            const response = await hs.call('post', 'crm/v3/objects/line_items/batch/archive', batchDeleteLineItems);

            const deleteLineItemsBatchResult = {
                status: response.status
            };

            return context.sendJson(deleteLineItemsBatchResult, 'out');
        } catch (err) {
            context.log(err);
            throw err;
        }


    }
};
