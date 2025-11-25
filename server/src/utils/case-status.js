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

const deriveCaseStatus = ({ attachments = [], analyses = {} } = {}) => {
  const fdrStatus = normalize(analyses?.fdr?.status);
  const cvrStatus = normalize(analyses?.cvr?.status);
  const correlateStatus = normalize(analyses?.correlate?.status);

  if (statusEquals(correlateStatus, ['correlate analyzed', 'correlation analyzed'])) {
    return 'Correlate Analyzed';
  }

  if (statusEquals(fdrStatus, ['fdr analyzed'])) {
    return 'FDR Analyzed';
  }

  if (statusEquals(cvrStatus, ['cvr analyzed'])) {
    return 'CVR Analyzed';
  }

  if (hasAnyStatus([fdrStatus, cvrStatus, correlateStatus], ['analysis paused', 'paused'])) {
    return 'Analysis Paused';
  }

  if (hasAnyStatus([fdrStatus, cvrStatus, correlateStatus], ['analysis in progress', 'analysis started', 'in progress'])) {
    return 'Analysis In Progress';
  }

  const hasFdrData = attachmentHasData(attachments, 'FDR') || !statusEquals(fdrStatus, ['data not uploaded', 'not started']);
  const hasCvrData = attachmentHasData(attachments, 'CVR') || !statusEquals(cvrStatus, ['data not uploaded', 'not started']);

  if (hasFdrData && hasCvrData) {
    return 'Ready for Analysis';
  }

  return 'Data Required';
};

module.exports = { deriveCaseStatus };

