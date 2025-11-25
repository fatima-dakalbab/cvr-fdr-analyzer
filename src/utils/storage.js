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

const normalizeObjectKeyCandidates = (objectKey, bucket) => {
  const candidates = new Set();
  const trimmed = (objectKey || '').replace(/^\/+/, '');

  if (trimmed) {
    candidates.add(trimmed);

    if (bucket && trimmed.startsWith(`${bucket}/`)) {
      candidates.add(trimmed.slice(bucket.length + 1));
    }

    try {
      const decoded = decodeURIComponent(trimmed);
      candidates.add(decoded);

      if (bucket && decoded.startsWith(`${bucket}/`)) {
        candidates.add(decoded.slice(bucket.length + 1));
      }
    } catch (_error) {
      // ignore decode failures and fall back to original values
    }
  }

  return Array.from(candidates).filter(Boolean);
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

  const candidates = normalizeObjectKeyCandidates(objectKey, bucket);
  const errors = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const candidateKey = candidates[i];
    try {
      const downloadTarget = await createDownloadTarget({
        bucket,
        objectKey: candidateKey,
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
    } catch (error) {
      errors.push(error);
      if (signal?.aborted) {
        break;
      }
    }
  }

  const lastError = errors[errors.length - 1];
  if (lastError) {
    throw lastError;
  }

  throw new Error('Unable to download attachment from object storage.');
};

export default {
  uploadAttachmentToObjectStore,
  fetchAttachmentFromObjectStore,
};