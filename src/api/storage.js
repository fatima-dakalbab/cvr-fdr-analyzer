import request from './client';

export const createUploadTarget = async ({ caseNumber, attachmentType, fileName, contentType }) =>
  request('/storage/presign', {
    method: 'POST',
    body: JSON.stringify({ caseNumber, attachmentType, fileName, contentType }),
  });

export default {
  createUploadTarget,
};