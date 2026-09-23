'use strict';

const XeroClient = require('../../XeroClient');

function requireInput(context, value, label) {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
}

module.exports = {

    async receive(context) {

        const {
            tenantId,
            prepaymentId,
            invoiceId,
            amount
        } = context.messages.in.content;

        requireInput(context, tenantId, 'Tenant ID');
        requireInput(context, prepaymentId, 'Prepayment ID');
        requireInput(context, invoiceId, 'Invoice ID');
        requireInput(context, amount, 'Amount');

        const xc = new XeroClient(context, tenantId);
        const allocationResponse = await xc.request(
            'PUT',
            `/api.xro/2.0/Prepayments/${encodeURIComponent(prepaymentId)}/Allocations`,
            {
                data: {
                    Amount: amount,
                    Invoice: {
                        InvoiceID: invoiceId
                    }
                }
            }
        );

        const allocation = allocationResponse?.Allocations?.[0] || allocationResponse?.Allocation || {};

        return context.sendJson({
            allocationId: allocation.AllocationID || null,
            prepaymentId,
            invoiceId,
            amount,
            result: allocationResponse
        }, 'out');
    }
};
