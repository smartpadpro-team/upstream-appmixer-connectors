'use strict';
const BaseSubscriptionComponent = require('../../BaseSubscriptionComponent');

const subscriptionType = 'deal.propertyChange';

class UpdatedDealStage extends BaseSubscriptionComponent {

    async getSubscriptions() {
        const subscriptions = [];
        subscriptions.push({
            enabled: true,
            subscriptionDetails: {
                subscriptionType: this.subscriptionType,
                propertyName: "dealstage"
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

            //we only listen to dealstage events
            if (hsWebhookData.propertyName === 'dealstage') {

                //Only output if matched portal id and deal stage if supplied
                const {
                    portalId,
                    dealStageIds
                } = context.properties;

                const webhookPortalId = hsWebhookData.portalId;

                //if webhook does not match portal id supplied, no need to output
                //ignore webhook events meant for other portals
                if(portalId === webhookPortalId){
                    const filteredDealStageIds = (dealStageIds ?? '')
                        .split(',')
                        .map(id => id.trim())     // remove surrounding spaces
                        .filter(id => id !== ''); // remove empty/whitespace-only

                    const webhookDealStageId = hsWebhookData.propertyValue;
                    const webhookObjectId = hsWebhookData.objectId;

                    const deal = {
                        portalId:webhookPortalId,
                        dealId:webhookObjectId,
                        dealStage:webhookDealStageId,
                    };

                    const shouldSend =
                        filteredDealStageIds.length === 0 ||
                        filteredDealStageIds.includes(webhookDealStageId);

                    if (shouldSend) {
                        return context.sendJson(deal, 'out');
                    }
                }


            }
        }

    }
}

module.exports = new UpdatedDealStage(subscriptionType);
