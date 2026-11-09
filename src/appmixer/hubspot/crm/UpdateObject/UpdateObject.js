'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {
        const {
            objectType,
            objectId,
            updateProperties
        } = context.messages.in.content;
        let payload = {
            properties: {}
        };
        let parsedArray;

        try {
            parsedArray = JSON.parse(updateProperties);
        } catch (parseErr) {
            throw new context.CancelError('Invalid JSON String for update properties');
        }

        parsedArray.forEach(item => {
            payload.properties[item.name] = item.value;
        });


        try {
            const {auth} = context;
            const hs = new Hubspot(auth.accessToken, context.config);

            const response = await hs.call('patch', `crm/v3/objects/${objectType}/${objectId}`, payload);

            if (response.status !== 200) {
                throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
            }

            const objectResult = {
                objectId: response.data.id,
                objectType: objectType
            };

            return context.sendJson(objectResult, 'out');

        } catch (err) {
            if (err.data.category === 'OBJECT_NOT_FOUND') {
                throw new context.CancelError(`Object not found in Hubspot`);
            }
            throw err;
        }
    }
};
