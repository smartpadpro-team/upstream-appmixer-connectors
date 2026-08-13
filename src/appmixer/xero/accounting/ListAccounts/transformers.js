'use strict';

function mapAccountsIdValue(accounts) {

    const transformed = [];

    if (Array.isArray(accounts?.items)) {
        accounts.items.forEach(account => {
            transformed.push({
                label: account['Code'] ? `${account['Code']} - ${account['Name']}` : account['Name'],
                value: account['AccountID']
            });
        });
    }

    return transformed;
}

function mapAccountsIdCodeValue(accounts) {

    const transformed = [];

    if (Array.isArray(accounts?.items)) {
        accounts.items.forEach(account => {
            transformed.push({
                label: account['Code'] ? `${account['Code']} - ${account['Name']}` : account['Name'],
                value: JSON.stringify({
                    accountId: account['AccountID'],
                    accountCode: account['Code']
                })
            });
        });
    }

    return transformed;
}

module.exports = {
    /**
     * @param {Object|string} accounts
     */
    accountsToSelectArray(accounts) {

        return mapAccountsIdValue(accounts);
    },

    accountsToIdCodeSelectArray(accounts) {

        return mapAccountsIdCodeValue(accounts);
    }
};
