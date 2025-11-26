import request from './client';

export const runFdrAnomalyDetection = async (caseId, parameters = []) =>
  request(`/cases/${caseId}/fdr/analyze`, {
    method: 'POST',
    body: JSON.stringify(
      Array.isArray(parameters) && parameters.length > 0
        ? { parameters }
        : {}
    ),
  });

export default runFdrAnomalyDetection;
