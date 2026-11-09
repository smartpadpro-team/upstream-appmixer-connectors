'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            ownerId
        } = context.messages.in.content;

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {
            const { data } = await hs.call(
                'get',
                `crm/v3/owners/${ownerId}`,
                {}
            );
            return context.sendJson(data, 'out');

        } catch (err) {
            if (err.status || (err.response && err.response.status) === 404) {
                return context.sendJson({  ownerId  }, 'notFound');
            }
            throw err;
        }
    }
};
