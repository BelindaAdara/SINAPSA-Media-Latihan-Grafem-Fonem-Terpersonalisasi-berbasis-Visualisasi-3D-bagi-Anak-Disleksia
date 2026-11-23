const { ZodError } = require('zod');

function redactSensitive(value) {
  return String(value)
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]');
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim belum sesuai. Coba periksa lagi ya.',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Data yang dikirim belum sesuai. Coba periksa lagi ya.', details: [] },
    });
  }
  if (error.status && error.code) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details || [] },
    });
  }
  console.error(
    `[api] ${req.method} ${req.path} failed: ${redactSensitive(error.name || 'Error')} `
    + `[${redactSensitive(error.code || 'NO_CODE')}] ${redactSensitive(error.message || 'Unknown error')}`,
  );
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ada kendala di server. Coba lagi ya.', details: [] },
  });
}

module.exports = { errorHandler };
