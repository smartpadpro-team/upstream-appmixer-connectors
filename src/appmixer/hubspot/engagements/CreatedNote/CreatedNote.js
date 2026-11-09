'use strict';
const BaseSubscriptionComponent = require('../../BaseSubscriptionComponent');

const subscriptionType = 'object.creation';

class CreatedNote extends BaseSubscriptionComponent {

    getSubscriptions() {
        const subscriptions = [];
        subscriptions.push({
            enabled: true,
            subscriptionDetails: {
                subscriptionType: this.subscriptionType
            }
        });
        return subscriptions;
    }

    async receive(context) {

        this.configureHubspot(context);

        if (context.messages.webhook) {
            const { data } = context.messages.webhook.content;

            const {
                suppliedPortalId
            } = context.properties;

            const hsWebhookKey = Object.keys(data)[0];
            // Access the inner object using the dynamic key
            const hsWebhookData = data[hsWebhookKey];
            const objectId = hsWebhookData.objectId;
            const portalId = hsWebhookData.portalId;

            if (suppliedPortalId === portalId) {
                context.log('equals');
            }

            const noteEvent = {
                portalId: portalId,
                object: objectId
            };

            return context.sendJson(noteEvent, 'out');
        }

    }
}

module.exports = new CreatedNote(subscriptionType);
