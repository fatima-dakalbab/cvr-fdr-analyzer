import { createDownloadTarget, createUploadTarget } from '../api/storage';
import { inferContentType } from './files';

const buildUploadHeaders = (responseHeaders = {}, fallbackContentType) => {
  const normalized = { ...responseHeaders };
  const hasContentType = Object.keys(normalized).some(
    (key) => key.toLowerCase() === 'content-type',
  );

  if (!hasContentType && fallbackContentType) {
    normalized['Content-Type'] = fallbackContentType;
  }

  return normalized;
};

export const uploadAttachmentToObjectStore = async ({
  caseNumber,
  attachmentType,
  file,
  signal,
}) => {
  if (!file) {
    throw new Error('A file must be provided to upload to object storage.');
  }

  if (!caseNumber) {
    throw new Error('A case number is required before uploading attachments.');
  }

  const contentType = inferContentType(file);
  const uploadTarget = await createUploadTarget({
    caseNumber,
    attachmentType,
    fileName: file.name,
    contentType,
  });

  const headers = buildUploadHeaders(uploadTarget.headers || {}, contentType);

  const response = await fetch(uploadTarget.uploadUrl, {
    method: uploadTarget.method || 'PUT',
    headers,
    body: file,
    signal,
  });

  if (!response.ok) {
    const message = `Object storage upload failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return {
    storage: {
      provider: 'minio',
      bucket: uploadTarget.bucket,
      objectKey: uploadTarget.objectKey,
      endpoint: uploadTarget.storageEndpoint || null,
    },
    contentType,
    uploadedAt: new Date().toISOString(),
  };
};

export const fetchAttachmentFromObjectStore = async ({
  bucket,
  objectKey,
  fileName,
  contentType,
  signal,
}) => {
  if (!objectKey) {
    throw new Error('An objectKey is required to download from object storage.');
  }

  const downloadTarget = await createDownloadTarget({
    bucket,
    objectKey,
    fileName,
    contentType,
  });

  const response = await fetch(downloadTarget.downloadUrl, { signal });
  if (!response.ok) {
    const message = `Object storage download failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.text();
};

export default {
  uploadAttachmentToObjectStore,
  fetchAttachmentFromObjectStore,
};