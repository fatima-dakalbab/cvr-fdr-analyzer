import request from './client';

export const fetchReportExports = async (caseNumber, { limit } = {}) => {
  const query = Number.isInteger(limit) ? `?limit=${limit}` : '';
  return request(`/cases/${caseNumber}/report-exports${query}`);
};

export const createReportExport = async (caseNumber, payload) =>
  request(`/cases/${caseNumber}/report-exports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const reportExportsApi = {
  fetchReportExports,
  createReportExport,
};

export default reportExportsApi;
