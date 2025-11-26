const { findCaseByNumber } = require('./cases');
const { downloadObjectAsString } = require('./storage');
const fdrParameterMap = require('../config/fdr-parameter-map');

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

function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value)
    .trim()
    .replace(/,/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

const percentile = (values, percentileRank) => {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileRank;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
};

const calculateColumnStatsZScore = (headers, rows) => {
  const stats = {};

  headers.forEach((header) => {
    const numericValues = rows
      .map((row) => toNumber(row[header]))
      .filter((value) => !Number.isNaN(value));

    if (numericValues.length === 0) {
      return;
    }

    console.log('[anomaly] numeric column:', header, 'count:', numericValues.length);

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

const detectAnomaliesZScore = (headers, rows, stats) => {
  const anomalies = [];

  rows.forEach((row, index) => {
    let isAnomalous = false;
    const numericValues = {};
    const triggeredParameters = [];

    headers.forEach((header) => {
      const value = toNumber(row[header]);
      const columnStats = stats[header];

      if (!columnStats || Number.isNaN(value)) {
        return;
      }

      numericValues[header] = value;
      const { stdDev, mean, lowerBound, upperBound } = columnStats;

      if (stdDev === 0 ? value !== mean : value < lowerBound || value > upperBound) {
        isAnomalous = true;
        triggeredParameters.push(header);
      }
    });

    if (isAnomalous) {
      anomalies.push({ rowIndex: index, values: numericValues, parameters: triggeredParameters, row });
    }
  });

  return anomalies;
};

const calculateColumnStatsIqr = (headers, rows) => {
  const stats = {};

  headers.forEach((header) => {
    const numericValues = rows
      .map((row) => toNumber(row[header]))
      .filter((value) => !Number.isNaN(value));

    if (numericValues.length === 0) {
      return;
    }

    console.log('[anomaly] numeric column:', header, 'count:', numericValues.length);

    const q1 = percentile(numericValues, 0.25);
    const q3 = percentile(numericValues, 0.75);
    if (q1 === null || q3 === null) {
      return;
    }

    const iqr = q3 - q1;
    const fence = 1.5 * iqr;

    stats[header] = {
      q1,
      q3,
      iqr,
      lowerBound: q1 - fence,
      upperBound: q3 + fence,
    };
  });

  return stats;
};

const detectAnomaliesIqr = (headers, rows, stats) => {
  const anomalies = [];

  rows.forEach((row, index) => {
    let isAnomalous = false;
    const numericValues = {};
    const triggeredParameters = [];

    headers.forEach((header) => {
      const value = toNumber(row[header]);
      const columnStats = stats[header];

      if (!columnStats || Number.isNaN(value)) {
        return;
      }

      numericValues[header] = value;
      const { lowerBound, upperBound } = columnStats;

      if (value < lowerBound || value > upperBound) {
        isAnomalous = true;
        triggeredParameters.push(header);
      }
    });

    if (isAnomalous) {
      anomalies.push({ rowIndex: index, values: numericValues, parameters: triggeredParameters, row });
    }
  });

  return anomalies;
};

const findFdrAttachment = (caseData) => {
  const attachments = Array.isArray(caseData.attachments) ? caseData.attachments : [];
  return attachments.find((item) => (item?.type || '').toUpperCase() === 'FDR');
};

const normalizeAlgorithm = (algorithmName) => {
  const normalized = typeof algorithmName === 'string' ? algorithmName.toLowerCase() : '';
  switch (normalized) {
    case 'iqr':
    case 'isolation_forest':
    case 'zscore':
      return normalized;
    default:
      return 'zscore';
  }
};

const getAlgorithmHandlers = (algorithmName) => {
  switch (algorithmName) {
    case 'iqr':
      return {
        calculateColumnStats: calculateColumnStatsIqr,
        detectAnomalies: detectAnomaliesIqr,
      };
    case 'isolation_forest':
      return {
        calculateColumnStats: calculateColumnStatsZScore,
        detectAnomalies: detectAnomaliesZScore,
      };
    case 'zscore':
    default:
      return {
        calculateColumnStats: calculateColumnStatsZScore,
        detectAnomalies: detectAnomaliesZScore,
      };
  }
};

const toCsvHeader = (parameterKey) => {
  const normalizedKey = typeof parameterKey === 'string' ? parameterKey.trim() : '';
  if (!normalizedKey) {
    return '';
  }

  const metadata = fdrParameterMap[normalizedKey.toUpperCase()];
  return metadata?.csvKey || normalizedKey;
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
  const algorithm = normalizeAlgorithm(options.algorithm);
  const { calculateColumnStats, detectAnomalies } = getAlgorithmHandlers(algorithm);
  const requestedParameters = Array.isArray(options.parameters)
    ? options.parameters.map((param) => toCsvHeader(param)).filter(Boolean)
    : [];
  const parameterSet = requestedParameters.length > 0 ? new Set(requestedParameters) : null;
  const analyzedHeaders = parameterSet
    ? headers.filter((header) => parameterSet.has(header))
    : headers;

  const stats = calculateColumnStats(analyzedHeaders, rows);
  const anomalies = detectAnomalies(analyzedHeaders, rows, stats);
  const totalRows = rows.length;
  const anomalyCount = anomalies.length;
  const anomalyPercentage = totalRows > 0 ? (anomalyCount / totalRows) * 100 : 0;

  const parameterCounts = anomalies.reduce((acc, item) => {
    const parameters = Array.isArray(item.parameters) && item.parameters.length > 0
      ? item.parameters
      : Object.keys(item.values || {});

    parameters.forEach((parameter) => {
      if (!parameter) return;
      acc[parameter] = (acc[parameter] || 0) + 1;
    });
    return acc;
  }, {});

  const topParameters = Object.entries(parameterCounts)
    .map(([parameter, count]) => ({ parameter, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const sampleRows = anomalies.slice(0, 10).map((item) => ({
    rowIndex: item.rowIndex,
    parameters: item.parameters,
    values: item.values,
    row: item.row,
  }));

  return {
    totalRows,
    anomalyCount,
    anomalyPercentage,
    perColumnStats: stats,
    anomalies,
    sampleRows,
    topParameters,
    algorithm,
  };
};

module.exports = {
  analyzeFdrForCase,
};
