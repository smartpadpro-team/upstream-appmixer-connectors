'use strict';
const BaseSubscriptionComponent = require('../../BaseSubscriptionComponent');

const subscriptionType = 'contact.propertyChange';

class UpdatedContactProperty extends BaseSubscriptionComponent {

    async getSubscriptions(context) {
        const {
            propertyName
        } = context.properties;

        const subscriptions = [];
        subscriptions.push({
            enabled: true, subscriptionDetails: {
                subscriptionType: this.subscriptionType, propertyName: propertyName
            }
        });
        return subscriptions;
    }

    async receive(context) {

        this.configureHubspot(context);

        if (context.messages.webhook) {
            const { data } = context.messages.webhook.content;
            // Get the dynamic key
            const hsWebhookKey = Object.keys(data)[0];
            // Access the inner object using the dynamic key
            const hsWebhookData = data[hsWebhookKey];

            //Only output if matched portal id and deal stage if supplied
            const {
                portalId, propertyName
            } = context.properties;

            //this connector will only listen to specified property event
            if (hsWebhookData.propertyName === propertyName) {

                const webhookPortalId = hsWebhookData.portalId;

                //if webhook does not match portal id supplied, no need to output
                //ignore webhook events meant for other portals
                if (portalId === webhookPortalId) {
                    const webhookPropertyValue = hsWebhookData.propertyValue;
                    const webhookObjectId = hsWebhookData.objectId;

                    const contact = {
                        portalId: webhookPortalId,
                        contactId: webhookObjectId,
                        propertyName: hsWebhookData.propertyName,
                        propertyValue: webhookPropertyValue
                    };

                    return context.sendJson(contact, 'out');
                }


            }
        }

    }
}

module.exports = new UpdatedContactProperty(subscriptionType);
