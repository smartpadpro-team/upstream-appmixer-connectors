'use strict';
const ZohoClient = require('../../ZohoClient');
const FormData = require('form-data');

/**
 * Create contact attachment in Zoho.
 */
module.exports = {

    async receive(context) {
        const { dealId, file,customFilename } = context.messages.deal.content;

        if (!file) {
            throw new Error('file is required');
        }

        try {

            const fileInfo = await context.getFileInfo(file);
            const fileStream = await context.getFileReadStream(file);

            const form = new FormData();
            form.append('file', fileStream, {
                filename: customFilename || fileInfo.filename || 'appmixerUploaded.pdf',
                contentType: fileInfo.contentType || 'application/octet-stream'
            });

            const client = new ZohoClient(context);
            const response = await client.uploadAttachment(
                context,
                '/Deals/' + dealId + '/Attachments',
                form
            );

            return context.sendJson({ data: response.data }, 'out');
        } catch (e) {
            context.log({ error: e.message });
        }
    }
};
