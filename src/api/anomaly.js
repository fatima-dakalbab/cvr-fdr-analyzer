import request from './client';

const toNumeric = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateMean = (values = []) =>
  values.reduce((sum, value) => sum + value, 0) / (values.length || 1);

const calculateStd = (values = []) => {
  if (!values.length) return 0;

  const mean = calculateMean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length || 1);

  return Math.sqrt(variance);
};

const percentile = (values = [], p = 0.5) => {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[index];
  }

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const buildIsolationForestLike = (rows, parameters) => {
  const scored = rows.map((row, index) => {
    const numericValues = parameters
      .map((param) => toNumeric(row[param]))
      .filter((value) => value !== null);

    if (!numericValues.length) {
      return { index, score: 0 };
    }

    const mean = calculateMean(numericValues);
    const std = calculateStd(numericValues) || 1;
    const score =
      numericValues.reduce(
        (sum, value) => sum + Math.abs((value - mean) / std),
        0,
      ) / numericValues.length;

    return { index, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  const targetCount = Math.min(
    rows.length,
    Math.max(1, Math.round(rows.length * 0.12)),
  );

  return sorted.slice(0, targetCount).map((entry) => entry.index);
};

const detectAnomaliesLocally = (rows = [], parameters = [], algorithm) => {
  if (!rows.length) {
    return null;
  }

  const usedParameters =
    Array.isArray(parameters) && parameters.length > 0
      ? parameters
      : Object.keys(rows[0] || {}).filter((key) => key !== 'time');

  const anomalyRows = new Set();
  const parameterCounts = {};
  const rowParameterHits = {};

  usedParameters.forEach((parameter) => {
    const valueEntries = rows
      .map((row, index) => ({ value: toNumeric(row[parameter]), index }))
      .filter(({ value }) => value !== null);
    const values = valueEntries.map(({ value }) => value);

    if (!values.length) {
      parameterCounts[parameter] = 0;
      return;
    }

    if (algorithm === 'iqr') {
      const q1 = percentile(values, 0.25);
      const q3 = percentile(values, 0.75);
      const iqr = q3 - q1 || 1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      let count = 0;

      valueEntries.forEach(({ value, index }) => {
        if (value < lower || value > upper) {
          anomalyRows.add(index);
          count += 1;
          rowParameterHits[index] = rowParameterHits[index] || new Set();
          rowParameterHits[index].add(parameter);
        }
      });
      parameterCounts[parameter] = count;
      return;
    }

    if (algorithm === 'isolation_forest') {
      const indices = buildIsolationForestLike(rows, [parameter]);
      indices.forEach((index) => {
        anomalyRows.add(index);
        rowParameterHits[index] = rowParameterHits[index] || new Set();
        rowParameterHits[index].add(parameter);
      });
      parameterCounts[parameter] = indices.length;
      return;
    }

    const mean = calculateMean(values);
    const std = calculateStd(values) || 1;
    const lower = mean - 2 * std;
    const upper = mean + 2 * std;
    let count = 0;

    valueEntries.forEach(({ value, index }) => {
      if (value < lower || value > upper) {
        anomalyRows.add(index);
        count += 1;
        rowParameterHits[index] = rowParameterHits[index] || new Set();
        rowParameterHits[index].add(parameter);
      }
    });
    parameterCounts[parameter] = count;
  });

  const anomalies = Array.from(anomalyRows).map((rowIndex) => {
    const row = rows[rowIndex] || {};
    const triggeredParameters = rowParameterHits[rowIndex]
      ? Array.from(rowParameterHits[rowIndex])
      : [];
    return {
      id: `row-${rowIndex}`,
      rowIndex,
      time: row.time,
      parameter:
        triggeredParameters[0] ||
        usedParameters.find(
          (param) => row[param] !== undefined && toNumeric(row[param]) !== null,
        ),
      parameters: triggeredParameters,
      severity: algorithm === 'isolation_forest' ? 'High' : 'Moderate',
      values: row,
    };
  });

  return {
    algorithm,
    anomalies,
    anomalyCount: anomalies.length,
    anomalyPercentage:
      rows.length > 0 ? (anomalies.length / rows.length) * 100 : null,
    evaluatedRows: rows.length,
    parameterCounts,
    sampleRows: anomalies,
    topParameters: Object.entries(parameterCounts).map(([parameter, count]) => ({
      parameter,
      count,
    })),
    totalRows: rows.length,
  };
};

export const runFdrAnomalyDetection = async (
  caseId,
  { parameters = [], algorithm, rows = [] } = {},
) => {
  const payload = {};

  if (Array.isArray(parameters) && parameters.length > 0) {
    payload.parameters = parameters;
  }

  if (algorithm) {
    payload.algorithm = algorithm;
  }

  try {
    const response = await request(`/cases/${caseId}/fdr/analyze`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response) {
      return {
        ...response,
        algorithm: response.algorithm || algorithm,
      };
    }
  } catch (error) {
    if (!rows.length) {
      const message =
        error?.message || 'Unable to run anomaly detection for this case.';
      const wrappedError = new Error(message);
      wrappedError.status = error?.status;
      throw wrappedError;
    }
  }

  const localResult = detectAnomaliesLocally(rows, parameters, algorithm);

  if (localResult) {
    return localResult;
  }

  const fallbackError = new Error(
    'Unable to run anomaly detection for this case.',
  );
  throw fallbackError;
};

export default runFdrAnomalyDetection;
