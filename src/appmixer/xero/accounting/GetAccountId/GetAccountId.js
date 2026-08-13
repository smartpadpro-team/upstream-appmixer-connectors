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
            account
        } = context.messages.in.content;

        requireInput(context, tenantId, 'Tenant ID');
        requireInput(context, account, 'Account');

        const selectedAccount = parseAccount(account);
        context.log(selectedAccount);
        const accountId = selectedAccount.accountId;
        const accountCode = selectedAccount.accountCode;

        requireInput(context, accountId, 'Account ID');
        requireInput(context, accountCode, 'Account Code');

        return context.sendJson({
            accountId,
            accountCode
        }, 'out');
    }
};
