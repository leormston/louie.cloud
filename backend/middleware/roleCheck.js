export const roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userGroups = req.user.GroupConfiguration?.GroupsToOverride || [];
    const hasRole = allowedRoles.some(role => userGroups.includes(role));

    if (!hasRole && allowedRoles.length > 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};
