'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            objectType,
            objectId
        } = context.messages.in.content;

        const {auth} = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        try {
            let propertyName = '';

            switch (objectType){
                case 'contacts':
                    propertyName = 'associations.contact'
                    break;
                case 'companies':
                    propertyName = 'associations.company'
                    break;
                case 'deals':
                    propertyName = 'associations.deal'
                    break;
                default:
                    throw new Error(`Object type not handled yet: ${objectType}`);
            }


            const queryNotes = {
                "filterGroups": [
                    {
                        "filters": [
                            { "propertyName": propertyName, "operator": "EQ", "value": objectId }
                        ]
                    }
                ],
                "properties": ["hs_note_body", "hs_timestamp", "hubspot_owner_id"],
                "limit": 100,
                "sorts": ["-hs_timestamp"]
            };

            const {data} = await hs.call('post', `crm/v3/objects/notes/search`, queryNotes);

            const fetchedNotes = {
                total: data.total,
                results: data.results,
            };

            return context.sendJson(fetchedNotes, 'out');
        } catch (err) {
            context.log({error:err});
            // You can log or inspect err.response?.data if hs.call gives detailed error info
            const errorMessage = err?.response?.data?.message || err.message || 'Unknown error';
            throw new context.CancelError(`Error creating the engagement in Hubspot: ${errorMessage}`);
        }


    }
};
