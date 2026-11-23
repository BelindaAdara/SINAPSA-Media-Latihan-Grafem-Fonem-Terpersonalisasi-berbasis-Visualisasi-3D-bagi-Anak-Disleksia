const { AppError } = require('../errors');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) return next(result.error);
    req[target] = result.data;
    return next();
  };
}

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Data yang dicari belum ada.'));
}

module.exports = { validate, notFound };
