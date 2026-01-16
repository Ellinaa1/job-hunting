const validateRequiredStrings = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      const value = req.body[field];
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    next();
  };
};
export default validateRequiredStrings;
