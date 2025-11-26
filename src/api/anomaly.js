import request from './client';

export const runFdrAnomalyDetection = async (caseId) =>
  request(`/cases/${caseId}/fdr/analyze`, {
    method: 'POST',
  });

export default runFdrAnomalyDetection;
