'use strict';
const XeroClient = require('../../XeroClient');

module.exports = {

    async receive(context) {

        const {
            tenantId,
            InvoiceID
        } = context.messages.in.content;

        try {
            const xc = new XeroClient(context, tenantId);
            const { Invoices } = await xc.request('POST', '/api.xro/2.0/Invoices/'+InvoiceID+'/Email', { });

            return context.sendJson(Invoices[0], 'out');
        } catch (e) {
            // If the value is not a valid JSON, throw an error.
            const errorMessage = e.message ?? 'Error encountered sending invoice email';
            return context.sendJson({
                message: errorMessage
            }, 'error');
        }
    }
};
