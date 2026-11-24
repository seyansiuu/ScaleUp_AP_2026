export function validate(schema, property = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) return next(result.error);
    req[property] = result.data;
    next();
  };
}
