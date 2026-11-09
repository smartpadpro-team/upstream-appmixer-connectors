'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    isEmpty(value) {
        return value === undefined || value === null || value === '';
    },

    async receive(context) {

        const {
            isCustom,
            objectType,
            associateToId,
            associationCategory,
            associationTypeId,
            fieldProperties
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {

            let propertiesJsonObject;
            try {
                propertiesJsonObject = JSON.parse(fieldProperties);
            } catch (error) {
                throw new context.CancelError('CreateObject - Invalid JSON String for field properties');
                // Handle the error (e.g., set default value, notify the user, etc.)
            }

            //retrieve associated objects
            let payload = {
                properties: propertiesJsonObject
            };
            //if association properties are filled, we add in payload
            if (!this.isEmpty(associateToId) && !this.isEmpty(associationCategory) && !this.isEmpty(associationTypeId)){
                payload.associations = [{
                    types: [
                        {
                            associationCategory: associationCategory,
                            associationTypeId: associationTypeId
                        }
                    ],
                    to: {id: associateToId}
                }];
            }

            let objectTypeUrl = objectType;
            //if custom object in hubspot, they add "p_" in prefix of internal name
            if (isCustom) {
                objectTypeUrl = "p_" + objectType;
            }

            const response = await hs.call('post', `crm/v3/objects/${objectTypeUrl.toLowerCase()}`, payload);

            if (response.status === 201) {
                const {data} = response;

                const createdObject = {
                    status: response.status,
                    createdId: data.id,
                    createdProperties: data.properties
                };

                return context.sendJson(createdObject, 'out');
            } else {
                throw new Error('HubSpot API Error: CreateObject - ' + response.status);
            }

        } catch (err) {
            context.log(err);
            throw err;
        }


    }
};
