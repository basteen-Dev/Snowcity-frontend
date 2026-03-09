import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

const EMPTY_PERMS = Object.freeze([]);
const EMPTY_ROLES = Object.freeze([]);

const selectAuthContext = (state) => {
  const auth = state.adminAuth || {};
  const user = auth.user || null;
  return {
    perms: Array.isArray(auth.perms) ? auth.perms : EMPTY_PERMS,
    roles: Array.isArray(user?.roles) ? user.roles : EMPTY_ROLES,
    userId: user?.user_id ?? user?.id ?? null,
  };
};

export default function PermissionGate({ anyOf = [], allOf = [], children, fallback = null }) {
  const { perms, roles, userId } = useSelector(selectAuthContext, shallowEqual);
  const roleSet = React.useMemo(() => {
    return new Set(roles.map((r) => {
      const str = typeof r === 'string' ? r : String(r.role_name || r.name || r || '');
      return str.toLowerCase().replace(/\s+/g, '');
    }));
  }, [roles]);

  const isSuperUser = userId != null && Number(userId) === 1;

  // Root / superadmin / superuser bypass all UI checks
  const isBypass = isSuperUser || roleSet.has('root') || roleSet.has('superadmin');

  if (isBypass) return children;

  const hasAll = allOf.length ? allOf.every((p) => perms.includes(p)) : true;
  const hasAny = anyOf.length ? anyOf.some((p) => perms.includes(p)) : true;
  if (hasAll && hasAny) return children;
  return fallback || null;
}
