import request from './client';

export const createUploadTarget = async ({ caseNumber, attachmentType, fileName, contentType }) =>
  request('/storage/presign', {
    method: 'POST',
    body: JSON.stringify({ caseNumber, attachmentType, fileName, contentType }),
  });

export const createDownloadTarget = async ({ bucket, objectKey, fileName, contentType }) =>
  request('/storage/download', {
    method: 'POST',
    body: JSON.stringify({ bucket, objectKey, fileName, contentType }),
  });

export default {
  createUploadTarget,
  createDownloadTarget,
};