const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const attachmentHasData = (attachments = [], targetType) =>
  attachments.some((attachment) => {
    if (!attachment || typeof attachment !== 'object') {
      return false;
    }

    const type = normalize(attachment.type);
    if (type !== normalize(targetType)) {
      return false;
    }

    const status = normalize(attachment.status);
    if (status === 'pending') {
      return false;
    }

    if (attachment.storage && (attachment.storage.objectKey || attachment.storage.key)) {
      return true;
    }

    if (typeof attachment.sizeBytes === 'number' && attachment.sizeBytes > 0) {
      return true;
    }

    return Boolean(attachment.name);
  });

const statusEquals = (status, values) => values.includes(normalize(status));

const hasAnyStatus = (statuses = [], values = []) =>
  statuses.some((status) => statusEquals(status, values));

const deriveDataStatus = (attachments = []) => {
  const hasFdrData = attachmentHasData(attachments, 'FDR');
  const hasCvrData = attachmentHasData(attachments, 'CVR');

  if (hasFdrData && hasCvrData) {
    return 'All Data Uploaded';
  }

  if (hasFdrData) {
    return 'FDR Uploaded';
  }

  if (hasCvrData) {
    return 'CVR Uploaded';
  }

  return 'No Data Uploaded';
};

const deriveCaseStatus = ({ analyses = {} } = {}) => {
  const fdrStatus = normalize(analyses?.fdr?.status);
  const cvrStatus = normalize(analyses?.cvr?.status);
  const correlateStatus = normalize(analyses?.correlate?.status);

  if (
    hasAnyStatus(
      [fdrStatus, cvrStatus, correlateStatus],
      ['completed', 'complete', 'analyzed', 'finished', 'correlate analyzed', 'correlation analyzed'],
    )
  ) {
    return 'Analysis Completed';
  }

  if (
    hasAnyStatus(
      [fdrStatus, cvrStatus, correlateStatus],
      ['analysis in progress', 'analysis started', 'in progress', 'running', 'started', 'analysis paused', 'paused'],
    )
  ) {
    return 'Analysis Started';
  }

  return 'Analysis Not Started';
};

module.exports = { deriveCaseStatus, deriveDataStatus };

