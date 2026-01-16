export function isVerified(req, res, next) {
  if (!req.user.isVerified) {
    return res.status(403).json({
      error: "Please verify your email to perform this action."
    });
  }
  next();
}
