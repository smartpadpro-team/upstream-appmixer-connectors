'use strict';

const XeroClient = require('../../XeroClient');

function requireInput(context, value, label) {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
}

function parseAccountId(value) {

    if (typeof value !== 'string') {
        return value?.accountId || value?.AccountID;
    }

    try {
        const account = JSON.parse(value);
        return account.accountId || account.AccountID || value;
    } catch {
        return value;
    }
}

module.exports = {

    async receive(context) {

        const {
            tenantId,
            invoiceId,
            bankAccountId,
            amount,
            date,
            reference
        } = context.messages.in.content;

        requireInput(context, tenantId, 'Tenant ID');
        requireInput(context, invoiceId, 'Invoice ID');
        requireInput(context, bankAccountId, 'Bank Account ID');
        requireInput(context, amount, 'Amount');

        const selectedBankAccountId = parseAccountId(bankAccountId);
        requireInput(context, selectedBankAccountId, 'Bank Account ID');

        const xc = new XeroClient(context, tenantId);
        const paymentResponse = await xc.request('POST', '/api.xro/2.0/Payments', {
            data: {
                Payments: [
                    {
                        Invoice: {
                            InvoiceID: invoiceId
                        },
                        Account: {
                            AccountID: selectedBankAccountId
                        },
                        Date: date,
                        Amount: amount,
                        Reference: reference
                    }
                ]
            }
        });

        const payment = paymentResponse?.Payments?.[0] || {};

        return context.sendJson({
            paymentId: payment.PaymentID || null,
            invoiceId,
            result: paymentResponse
        }, 'out');
    }
};
