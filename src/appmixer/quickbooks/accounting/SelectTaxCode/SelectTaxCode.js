'use strict';

/**
 * Component for selecting a QuickBooks tax code.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {
        const { taxCode } = context.messages.in.content || {};
        return context.sendJson({taxCodeId:taxCode}, 'out');
    },
};
