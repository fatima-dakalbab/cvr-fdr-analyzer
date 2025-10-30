const REQUIRED_FIELDS = ['caseNumber', 'caseName', 'module', 'status', 'owner'];

const validateCasePayload = (payload = {}) => {
  const missing = REQUIRED_FIELDS.filter((field) => !payload[field] || payload[field].length === 0);
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }

  return payload;
};

module.exports = {
  validateCasePayload,
};
