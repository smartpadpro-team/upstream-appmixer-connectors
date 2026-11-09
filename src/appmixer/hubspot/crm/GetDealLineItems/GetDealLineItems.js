'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    /**
     * Extracts field in object
     * @param data
     * @returns {BigInt64Array}
     */
    extractFieldValues(data,fieldKey){
        // Ensure that 'results' is an array
        if (!data || !Array.isArray(data.results)) {
            throw new Error('Invalid data structure');
        }

        return data.results.map(item => item[fieldKey]);
    },

    chunkArray(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    },

    async getFinalLineItemsId(ids,nameFilter,hs){

        const chunks = this.chunkArray(ids, 100);
        const allResults = [];

        for (const chunk of chunks) {
            let filterLineItems = {
                filterGroups: [
                    {
                        filters: [
                            {
                                propertyName: "id",
                                operator: "IN",
                                values: chunk
                            }
                        ]
                    }
                ],
                properties: ["name", "id"],
                limit: 100
            };

            // Add filter name if supplied
            if (nameFilter !== "") {
                const nameFilterRequest = {
                    propertyName: "name",
                    operator: "CONTAINS_TOKEN",
                    value: nameFilter
                };
                filterLineItems.filterGroups[0].filters.push(nameFilterRequest);
            }

            const response = await hs.call('post', `crm/v3/objects/line_items/search`, filterLineItems);

            if (response.status !== 200) {
                throw new Error('HubSpot API Error: ' + response.status);
            }

            const extracted = this.extractFieldValues(response.data, 'id');
            allResults.push(...extracted);
        }

        return allResults;
    },

    async receive(context) {

        const {
            dealId,
            lineItemNameFilter
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {
            //retrieve line items associated to the supplied Deal ID
            const response = await hs.call('get', `crm/v4/objects/deals/${dealId}/associations/line_items`);

            if(response.status === 200){
                let lineItemIds = this.extractFieldValues(response.data,'toObjectId');
                const nameFilter =  (lineItemNameFilter ?? "").trim() || "";
                let finalLineItemIds = [];

                //if there is a word filter, we filter the Line Item IDs name
                if (nameFilter !== "" && lineItemIds.length > 0) {
                    finalLineItemIds = await this.getFinalLineItemsId(lineItemIds,nameFilter,hs);
                }else{
                    finalLineItemIds = lineItemIds;
                }

                //if no filter, we just directly return lineItemIds
                const dealLineItemsResult = {
                    status: response.status,
                    lineItemIds: finalLineItemIds.join(',') //we return ids as a string separated by comma if multiple
                };

                return context.sendJson(dealLineItemsResult, 'out');
            }else{
                throw new Error('HubSpot API Error: ' + response.status);
            }

        } catch (err) {
            context.log(err);
            throw err;
        }


    }
};
