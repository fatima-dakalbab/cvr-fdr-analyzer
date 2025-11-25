export const CASE_STATUS_NOT_STARTED = 'Analysis Not Started';
export const CASE_STATUS_STARTED = 'Analysis Started';
export const CASE_STATUS_COMPLETED = 'Analysis Completed';

export const CASE_STATUS_OPTIONS = [
  CASE_STATUS_COMPLETED,
  CASE_STATUS_STARTED,
  CASE_STATUS_NOT_STARTED,
];

export const DEFAULT_CASE_STATUS = CASE_STATUS_NOT_STARTED;

const LEGACY_STATUS_MAP = new Map([
  ['analysis not started', CASE_STATUS_NOT_STARTED],
  ['not started', CASE_STATUS_NOT_STARTED],
  ['ready for analysis', CASE_STATUS_STARTED],
  ['analysis started', CASE_STATUS_STARTED],
  ['in progress', CASE_STATUS_STARTED],
  ['analysis in progress', CASE_STATUS_STARTED],
  ['pending review', CASE_STATUS_STARTED],
  ['paused', CASE_STATUS_STARTED],
  ['analysis paused', CASE_STATUS_STARTED],
  ['complete', CASE_STATUS_COMPLETED],
  ['completed', CASE_STATUS_COMPLETED],
  ['correlation analyzed', CASE_STATUS_COMPLETED],
  ['correlate analyzed', CASE_STATUS_COMPLETED],
  ['fdr analyzed', CASE_STATUS_COMPLETED],
  ['cvr analyzed', CASE_STATUS_COMPLETED],
]);

export const normalizeCaseStatus = (status) => {
  const raw = typeof status === 'string' ? status.trim() : '';
  if (!raw) {
    return DEFAULT_CASE_STATUS;
  }

  const lower = raw.toLowerCase();
  if (LEGACY_STATUS_MAP.has(lower)) {
    return LEGACY_STATUS_MAP.get(lower);
  }

  const directMatch = CASE_STATUS_OPTIONS.find((option) => option.toLowerCase() === lower);
  if (directMatch) {
    return directMatch;
  }

  return raw;
};

export const normalizeCaseRecord = (caseRecord) => {
  if (!caseRecord || typeof caseRecord !== 'object') {
    return caseRecord;
  }

  return {
    ...caseRecord,
    status: normalizeCaseStatus(caseRecord.status),
  };
};

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const statusEquals = (status, values) => values.includes(normalize(status));

const hasAnyStatus = (statuses = [], values = []) => statuses.some((status) => statusEquals(status, values));

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

export const deriveDataStatus = (attachments = []) => {
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

export const deriveCaseStatus = ({ analyses = {} } = {}) => {
  const fdrStatus = normalize(analyses?.fdr?.status);
  const cvrStatus = normalize(analyses?.cvr?.status);
  const correlateStatus = normalize(analyses?.correlate?.status);

  if (
    hasAnyStatus(
      [fdrStatus, cvrStatus, correlateStatus],
      ['completed', 'complete', 'analyzed', 'finished', 'correlate analyzed', 'correlation analyzed'],
    )
  ) {
    return CASE_STATUS_COMPLETED;
  }

  if (
    hasAnyStatus(
      [fdrStatus, cvrStatus, correlateStatus],
      ['analysis in progress', 'analysis started', 'in progress', 'running', 'started', 'analysis paused', 'paused'],
    )
  ) {
    return CASE_STATUS_STARTED;
  }

  return CASE_STATUS_NOT_STARTED;
};