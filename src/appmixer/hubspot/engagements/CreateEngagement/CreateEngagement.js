'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            objectType,
            objectId,
            fileId,
            engagementType,
            engagementBody
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {
            const newEngagement = {
                "engagement": {
                    "active": true,
                    "type": engagementType,
                },
                "associations": {
                    "contactIds": [],
                    "companyIds": [],
                    "dealIds": [],
                    "ownerIds": [],
                    "ticketIds":[]
                },
                "attachments": [],
                "metadata": {
                    "body": engagementBody
                }
            };

            switch (objectType){
                case 'contacts':
                    newEngagement.associations.contactIds.push(objectId);
                    break;
                case 'companies':
                    newEngagement.associations.companyIds.push(objectId);
                    break;
                case 'deals':
                    newEngagement.associations.dealIds.push(objectId);
                    break;
                default:
                    throw new Error(`Object type not handled yet: ${objectType}`);
            }

            //File ID in Hubspot
            if(fileId){
                newEngagement.attachments.push({"id": fileId});
            }

            const response = await hs.call('post', `engagements/v1/engagements`, newEngagement);

            const createdEngagement = {
                status: response.status
            };
            return context.sendJson(createdEngagement, 'out');
        } catch (err) {
            context.log({error:err});
            // You can log or inspect err.response?.data if hs.call gives detailed error info
            const errorMessage = err?.response?.data?.message || err.message || 'Unknown error';
            throw new context.CancelError(`Error creating the engagement in Hubspot: ${errorMessage}`);
        }


    }
};
