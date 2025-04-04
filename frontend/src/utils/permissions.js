// utils/permissions.js
export const hasAccess = (role, allowedRoles = []) => {
    return allowedRoles.includes(role);
  };