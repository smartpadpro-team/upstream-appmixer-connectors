'use strict';

module.exports = {

    async receive(context) {

        const {
            tenantId
        } = context.messages.in.content;

        return context.sendJson({tenantId}, 'out');
    }
};
