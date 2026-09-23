'use strict';


function requireInput(context, value, label) {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
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
            bankAccount,
            lineItemsAccount,
            paymentLineAccount
        } = context.messages.in.content;

        requireInput(context, tenantId, 'Tenant ID');
        requireInput(context, bankAccount, 'Bank Account');
        requireInput(context, lineItemsAccount, 'Line Items Account');
        requireInput(context, paymentLineAccount, 'Payment Line Account');

        const selectedBankAccount = parseAccount(bankAccount);
        const selectedLineItemsAccount = parseAccount(lineItemsAccount);
        const selectedPaymentLineAccount = parseAccount(paymentLineAccount);

        const bankAccountId = selectedBankAccount.accountId;
        const bankAccountCode = selectedBankAccount.accountCode;

        const lineItemAccountId = selectedLineItemsAccount.accountId;
        const lineItemAccountCode = selectedLineItemsAccount.accountCode;

        const paymentLineAccountId = selectedPaymentLineAccount.accountId;
        const paymentLineAccountCode = selectedPaymentLineAccount.accountCode;

        requireInput(context, bankAccountId, 'Bank Account ID');
        requireInput(context, lineItemAccountId, 'Line Items Account ID');
        requireInput(context, paymentLineAccountId, 'Payment Line Account ID');

        return context.sendJson({
            tenantId,
            bankAccountId,
            bankAccountCode,
            lineItemAccountId,
            lineItemAccountCode,
            paymentLineAccountId,
            paymentLineAccountCode
        }, 'out');
    }
};
