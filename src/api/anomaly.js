import request from './client';

export const runFdrAnomalyDetection = async (caseId, parameters = []) => {
  try {
    return await request(`/cases/${caseId}/fdr/analyze`, {
      method: 'POST',
      body: JSON.stringify(
        Array.isArray(parameters) && parameters.length > 0
          ? { parameters }
          : {}
      ),
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
