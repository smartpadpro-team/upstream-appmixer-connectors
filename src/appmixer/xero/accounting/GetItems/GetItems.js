'use strict';
const XeroClient = require('../../XeroClient');

module.exports = {

    async receive(context) {

        const {
            tenantId,
            itemCode
        } = context.messages.in.content;

        if (!tenantId) {
            throw new context.CancelError('Tenant ID is required!');
        }

        const xc = new XeroClient(context, tenantId);

        const code = String(itemCode ?? '').trim();
        const path = code
            ? `/api.xro/2.0/Items?where=${encodeURIComponent(`Code=="${code}"`)}`
            : '/api.xro/2.0/Items';

        const { Items = [] } = await xc.request('GET', path, {});

        return context.sendJson({ items: Items }, 'out');
    }
};
