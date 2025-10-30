import request from './client';

const serializeCasePayload = (payload) => ({
  ...payload,
  tags: Array.isArray(payload.tags)
    ? payload.tags
    : (payload.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
});

export const fetchCases = async () => request('/cases');

export const fetchCaseByNumber = async (caseNumber) => request(`/cases/${caseNumber}`);

export const createCase = async (payload) => request('/cases', {
  method: 'POST',
  body: JSON.stringify(serializeCasePayload(payload)),
});

export const updateCase = async (caseNumber, payload) => request(`/cases/${caseNumber}`, {
  method: 'PUT',
  body: JSON.stringify(serializeCasePayload(payload)),
});

export const deleteCase = async (caseNumber) =>
  request(`/cases/${caseNumber}`, {
    method: 'DELETE',
  });
