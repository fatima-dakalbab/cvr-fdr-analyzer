const formatCaseDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const normalizeString = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

const isRecorderAttachmentReady = (attachments, type) => {
    if (!Array.isArray(attachments)) {
        return false;
    }

    return attachments.some((item) => {
        if (!item || item.type !== type) {
            return false;
        }

        const status = normalizeString(item.status);
        const name = normalizeString(item.name);

        if (status === 'pending') {
            return false;
        }

        if (name.includes('pending upload')) {
            return false;
        }

        return Boolean(item.name);
    });
};

const isRecorderAnalysisReady = (analyses, key) => {
    if (!analyses || typeof analyses !== 'object') {
        return false;
    }

    const analysis = analyses[key];
    if (!analysis || typeof analysis !== 'object') {
        return false;
    }

    const status = normalizeString(analysis.status);
    return (
        status.includes('ready') ||
        status.includes('in progress') ||
        status.includes('complete') ||
        status.includes('completed')
    );
};

export const getRecorderAvailability = (caseData) => {
    const attachments = Array.isArray(caseData?.attachments)
        ? caseData.attachments
        : [];
    const analyses =
        caseData?.analyses && typeof caseData.analyses === 'object'
            ? caseData.analyses
            : {};

    const hasFdrData =
        isRecorderAttachmentReady(attachments, 'FDR') ||
        isRecorderAnalysisReady(analyses, 'fdr');
    const hasCvrData =
        isRecorderAttachmentReady(attachments, 'CVR') ||
        isRecorderAnalysisReady(analyses, 'cvr');

    return {
        hasFdrData,
        hasCvrData,
    };
};

export const buildCasePreview = (caseData) => {
    if (!caseData) {
        return null;
    }

    const {
        caseNumber,
        caseName,
        summary,
        aircraft = {},
        aircraftType,
        lastUpdated,
        createdAt,
        updatedAt,
        date,
        location,
    } = caseData;

    const aircraftLabel =
        aircraft?.model ||
        aircraft?.type ||
        aircraftType ||
        aircraft?.registration ||
        'Aircraft TBD';

    const displayDate = formatCaseDate(updatedAt || lastUpdated || createdAt || date);
    const { hasFdrData, hasCvrData } = getRecorderAvailability(caseData);

    return {
        id: caseNumber || caseData.id || '',
        title: caseName || caseData.title || 'Untitled Case',
        date: displayDate || 'Date TBD',
        summary: summary || 'No summary provided yet.',
        aircraft: aircraftLabel,
        location: location || caseData.location || '',
        source: caseData,
        hasFdrData,
        hasCvrData,
        canCorrelate: hasFdrData && hasCvrData,
    };
};
