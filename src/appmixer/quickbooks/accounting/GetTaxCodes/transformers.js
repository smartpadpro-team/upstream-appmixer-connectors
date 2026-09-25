'use strict';

function mapTaxCodesIdValue(taxCodes) {

    const transformed = [];

    if (Array.isArray(taxCodes?.items)) {
        taxCodes.items.forEach(taxCode => {
            transformed.push({
                label: taxCode['Name'],
                value: taxCode['Id']
            });
        });
    }

    return transformed;
}

module.exports = {
    /**
     * @param {Object|string} taxCodes
     */
    taxCodesToSelectArray(taxCodes) {

        return mapTaxCodesIdValue(taxCodes);
    }
};
