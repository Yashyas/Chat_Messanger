module.exports = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // Ensures body matches schema
    next();
  } catch (err) {
    return res.status(400).json({ errors: err.errors });
  }
};
