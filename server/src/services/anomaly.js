const { findCaseByNumber } = require('./cases');
const { downloadObjectAsString } = require('./storage');

const parseCsv = (text) => {
  const lines = (text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');

  if (lines.length === 0) {
    const error = new Error('FDR file is empty or missing.');
    error.status = 400;
    throw error;
  }

  const headers = lines.shift().split(',').map((header) => header.trim());
  const rows = lines.map((line) => {
    const values = line.split(',');
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    return record;
  });

  return { headers, rows };
};

const calculateColumnStats = (headers, rows) => {
  const stats = {};

  headers.forEach((header) => {
    const numericValues = rows
      .map((row) => Number(row[header]))
      .filter((value) => !Number.isNaN(value));

    if (numericValues.length === 0) {
      return;
    }

    const mean = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    const variance =
      numericValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    const threshold = 3 * stdDev;

    stats[header] = {
      mean,
      stdDev,
      lowerBound: mean - threshold,
      upperBound: mean + threshold,
    };
  });

  return stats;
};

const detectAnomalies = (headers, rows, stats) => {
  const anomalies = [];

  rows.forEach((row, index) => {
    let isAnomalous = false;
    const numericValues = {};

    headers.forEach((header) => {
      const value = Number(row[header]);
      const columnStats = stats[header];

      if (!columnStats || Number.isNaN(value)) {
        return;
      }

      numericValues[header] = value;
      const { stdDev, mean, lowerBound, upperBound } = columnStats;

      if (stdDev === 0 ? value !== mean : value < lowerBound || value > upperBound) {
        isAnomalous = true;
      }
    });

    if (isAnomalous) {
      anomalies.push({ rowIndex: index, values: numericValues });
    }
  });

  return anomalies;
};

const findFdrAttachment = (caseData) => {
  const attachments = Array.isArray(caseData.attachments) ? caseData.attachments : [];
  return attachments.find((item) => (item?.type || '').toUpperCase() === 'FDR');
};

const analyzeFdrForCase = async (caseNumber, options = {}) => {
  const caseData = await findCaseByNumber(caseNumber);
  if (!caseData) {
    const error = new Error('Case not found');
    error.status = 404;
    throw error;
  }

  const fdrAttachment = findFdrAttachment(caseData);
  if (!fdrAttachment || !fdrAttachment.storage || !fdrAttachment.storage.objectKey) {
    const error = new Error('No FDR attachment found for this case.');
    error.status = 404;
    throw error;
  }

  const csvText = await downloadObjectAsString({
    bucket: fdrAttachment.storage.bucket,
    objectKey: fdrAttachment.storage.objectKey,
  });

  const { headers, rows } = parseCsv(csvText);
  const requestedParameters = Array.isArray(options.parameters)
    ? options.parameters
        .map((param) => (typeof param === 'string' ? param.trim() : ''))
        .filter(Boolean)
    : [];
  const parameterSet = requestedParameters.length > 0 ? new Set(requestedParameters) : null;
  const analyzedHeaders = parameterSet
    ? headers.filter((header) => parameterSet.has(header))
    : headers;

  const stats = calculateColumnStats(analyzedHeaders, rows);
  const anomalies = detectAnomalies(analyzedHeaders, rows, stats);

  return {
    totalRows: rows.length,
    anomalyCount: anomalies.length,
    perColumnStats: stats,
    examples: anomalies.slice(0, 20),
  };
};

module.exports = {
  analyzeFdrForCase,
};
