'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    /**
     * Extracts field in object
     * @param data
     * @returns {BigInt64Array}
     */
    extractFieldValue(data, fieldKey) {
        // Ensure that 'results' is an array
        if (!data || !Array.isArray(data.results)) {
            throw new Error('Invalid data structure');
        }

        return data.results.flatMap(item => {
            if (Array.isArray(item.to)) {
                return item.to.map(toItem => toItem[fieldKey]);
            }
            return [];
        }).filter(Boolean);  // Filter out any undefined values
    },

    async receive(context) {

        const {
            fromObjectId,
            fromObjectType,
            toObjectType
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {
            //retrieve associated objects
            const retrieveRequest = { inputs: [{id:fromObjectId}] };
            const response = await hs.call('post', `crm/v4/associations/${fromObjectType}/${toObjectType}/batch/read`,retrieveRequest);
            let associatedIds = [];

            if(response.status === 200 || response.status === 207){

                associatedIds = this.extractFieldValue(response.data,'toObjectId');

                const associatedObjectsResult = {
                    status: response.status,
                    associatedIds: associatedIds.join(',') //we return ids as CSV string
                };

                return context.sendJson(associatedObjectsResult, 'out');
            }else{
                throw new Error('HubSpot API Error: ' + response.status);
            }

        } catch (err) {
            context.log(err);
            throw err;
        }


    }
};
