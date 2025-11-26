import request from './client';

export const runFdrAnomalyDetection = async (
  caseId,
  { parameters = [], algorithm } = {}
) => {
  try {
    const payload = {};

    if (Array.isArray(parameters) && parameters.length > 0) {
      payload.parameters = parameters;
    }

    if (algorithm) {
      payload.algorithm = algorithm;
    }

    return await request(`/cases/${caseId}/fdr/analyze`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message =
      error?.message || 'Unable to run anomaly detection for this case.';
    const wrappedError = new Error(message);
    wrappedError.status = error?.status;
    throw wrappedError;
  }
};

export default runFdrAnomalyDetection;
