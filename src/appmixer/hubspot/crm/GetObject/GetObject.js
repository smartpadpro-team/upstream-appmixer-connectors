'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            objectId,
            objectType,
            objectProperties
        } = context.messages.in.content;

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);
        const opts = objectProperties ? {
            query: `properties=${objectProperties}`
        } : {};

        try {
            const { data } = await hs.call(
                'get',
                `crm/v3/objects/${objectType}/${objectId}`,
                {},
                opts
            );

            const result = {
                id:data.id,
                properties:data.properties,
            };

            return context.sendJson(result, 'out');

        } catch (err) {
            if (err.status || (err.response && err.response.status) === 404) {
                return context.sendJson({  objectId  }, 'notFound');
            }
            throw err;
        }
    }
};
