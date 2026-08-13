'use strict';

const XeroClient = require('../../XeroClient');

function requireInput(context, value, label) {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
}

function normalizeDate(date) {

    if (!date) {
        return undefined;
    }
    return date;
}

function parseAccount(value) {

    if (typeof value !== 'string') {
        return {
            accountId: value?.accountId || value?.AccountID,
            accountCode: value?.accountCode || value?.Code
        };
    }

    try {
        const account = JSON.parse(value);
        return {
            accountId: account.accountId || account.AccountID || value,
            accountCode: account.accountCode || account.Code
        };
    } catch {
        return {
            accountId: value,
            accountCode: null
        };
    }
}

module.exports = {

    async receive(context) {

        const {
            tenantId,
            contactId,
            bankAccount,
            prepaymentLineAccount,
            amount,
            date,
            reference
        } = context.messages.in.content;

        requireInput(context, tenantId, 'Tenant ID');
        requireInput(context, contactId, 'Contact ID');
        requireInput(context, bankAccount, 'Bank Account');
        requireInput(context, prepaymentLineAccount, 'Prepayment Line Account');
        requireInput(context, amount, 'Amount');

        const selectedBankAccount = parseAccount(bankAccount);
        const selectedLineAccount = parseAccount(prepaymentLineAccount);
        const selectedBankAccountId = selectedBankAccount.accountId;
        const selectedLineAccountCode = selectedLineAccount.accountCode
            || (selectedLineAccount.accountId === prepaymentLineAccount ? prepaymentLineAccount : null);

        requireInput(context, selectedBankAccountId, 'Bank Account ID');
        requireInput(context, selectedLineAccountCode, 'Prepayment Line Account Code');

        const xc = new XeroClient(context, tenantId);
        const prepaymentResponse = await xc.request('POST', '/api.xro/2.0/BankTransactions', {
            data: {
                BankTransactions: [
                    {
                        Type: 'RECEIVE-PREPAYMENT',
                        Contact: {
                            ContactID: contactId
                        },
                        BankAccount: {
                            AccountID: selectedBankAccountId
                        },
                        Date: normalizeDate(date),
                        Reference: reference,
                        LineItems: [
                            {
                                Description: reference || 'Customer prepayment',
                                Quantity: 1,
                                UnitAmount: amount,
                                AccountCode: selectedLineAccountCode
                            }
                        ]
                    }
                ]
            }
        });

        const prepayment = prepaymentResponse?.BankTransactions?.[0] || {};
        const prepaymentId = prepayment.PrepaymentID || prepayment.Prepayment?.PrepaymentID || null;

        return context.sendJson({
            prepaymentId,
            bankTransactionId: prepayment.BankTransactionID || null,
            result: prepaymentResponse
        }, 'out');
    }
};
