// eslint-disable-next-line no-unused-vars
const errorHandler = (error, _req, res, _next) => {
  const status = error.status || 500;
  const message =
    status >= 500
      ? 'Unexpected server error. Please try again later.'
      : error.message || 'Invalid request.';

  res.status(status).json({
    error: message,
  });
};

module.exports = errorHandler;
