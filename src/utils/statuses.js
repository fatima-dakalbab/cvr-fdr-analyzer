export const CASE_STATUS_CVR_ANALYZED = 'CVR Analyzed';
export const CASE_STATUS_FDR_ANALYZED = 'FDR Analyzed';
export const CASE_STATUS_CORRELATE_ANALYZED = 'Correlate Analyzed';
export const CASE_STATUS_READY_FOR_ANALYSIS = 'Ready for Analysis';
export const CASE_STATUS_DATA_REQUIRED = 'Data Required';
export const CASE_STATUS_ANALYSIS_IN_PROGRESS = 'Analysis In Progress';
export const CASE_STATUS_ANALYSIS_PAUSED = 'Analysis Paused';

export const CASE_STATUS_OPTIONS = [
  CASE_STATUS_CVR_ANALYZED,
  CASE_STATUS_FDR_ANALYZED,
  CASE_STATUS_CORRELATE_ANALYZED,
  CASE_STATUS_READY_FOR_ANALYSIS,
  CASE_STATUS_DATA_REQUIRED,
  CASE_STATUS_ANALYSIS_IN_PROGRESS,
  CASE_STATUS_ANALYSIS_PAUSED,
];

export const DEFAULT_CASE_STATUS = CASE_STATUS_DATA_REQUIRED;

const LEGACY_STATUS_MAP = new Map([
  ['analysis not started', CASE_STATUS_READY_FOR_ANALYSIS],
  ['not started', CASE_STATUS_READY_FOR_ANALYSIS],
  ['ready for analysis', CASE_STATUS_READY_FOR_ANALYSIS],
  ['analysis started', CASE_STATUS_ANALYSIS_IN_PROGRESS],
  ['in progress', CASE_STATUS_ANALYSIS_IN_PROGRESS],
  ['analysis in progress', CASE_STATUS_ANALYSIS_IN_PROGRESS],
  ['pending review', CASE_STATUS_ANALYSIS_IN_PROGRESS],
  ['paused', CASE_STATUS_ANALYSIS_PAUSED],
  ['analysis paused', CASE_STATUS_ANALYSIS_PAUSED],
  ['data incomplete', CASE_STATUS_DATA_REQUIRED],
  ['data required', CASE_STATUS_DATA_REQUIRED],
  ['data not uploaded', CASE_STATUS_DATA_REQUIRED],
  ['not applicable', CASE_STATUS_DATA_REQUIRED],
  ['blocked', CASE_STATUS_DATA_REQUIRED],
  ['complete', CASE_STATUS_CORRELATE_ANALYZED],
  ['completed', CASE_STATUS_CORRELATE_ANALYZED],
  ['correlation analyzed', CASE_STATUS_CORRELATE_ANALYZED],
  ['correlate analyzed', CASE_STATUS_CORRELATE_ANALYZED],
  ['fdr analyzed', CASE_STATUS_FDR_ANALYZED],
  ['cvr analyzed', CASE_STATUS_CVR_ANALYZED],
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