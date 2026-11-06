// Role-based access guard. Use after `authenticate`, which sets req.user.
export const ADMIN_ROLES = ['admin', 'master_admin'];

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
