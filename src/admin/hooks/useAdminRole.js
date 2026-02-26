// src/admin/hooks/useAdminRole.js
import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

function normalizeRole(r) {
    if (!r) return '';
    const s = typeof r === 'string' ? r : String(r.role_name || r.name || r || '');
    return s.toLowerCase().replace(/\s+/g, '');
}

/**
 * Returns role-based flags and helpers for the current admin user.
 *
 * Roles hierarchy:
 *   superadmin / root  — full access including admin creation
 *   gm / admin         — all modules except creating admins
 *   staff / subadmin   — scoped to assigned attractions/combos
 *   editor             — catalog only (no offers/coupons/dynamic pricing)
 */
export function useAdminRole() {
    const { roles: rawRoles, scopes, isSuperAdmin } = useSelector(
        (s) => ({
            roles: Array.isArray(s.adminAuth?.roles) ? s.adminAuth.roles : [],
            scopes: s.adminAuth?.scopes || null,
            isSuperAdmin: Boolean(s.adminAuth?.isSuperAdmin),
        }),
        shallowEqual
    );

    return useMemo(() => {
        const roles = rawRoles.map(normalizeRole);

        const isSuperLevel = isSuperAdmin || roles.includes('superadmin') || roles.includes('root');
        const isGM = !isSuperLevel && (roles.includes('gm') || roles.includes('admin'));
        const isStaff = !isSuperLevel && !isGM && (roles.includes('staff') || roles.includes('subadmin'));
        const isEditor = !isSuperLevel && !isGM && !isStaff && roles.includes('editor');

        // What modules can staff access (from module_permissions)
        const staffModules = Array.isArray(scopes?.module_permissions) ? scopes.module_permissions : [];

        return {
            roles,
            isSuperAdmin: isSuperLevel,
            isGM,
            isStaff,
            isEditor,
            scopes,
            staffModules,
            // Utility: does this user have a specific role?
            hasRole: (role) => isSuperLevel || roles.includes(normalizeRole(role)),
            // Can access admin management section (list + create)?
            canManageAdmins: isSuperLevel,
            // Can list admins (view only)?
            canListAdmins: isSuperLevel || isGM,
            // Can see analytics?
            canSeeAnalytics: isSuperLevel || isGM || isStaff,
            // Can see bookings?
            canSeeBookings: isSuperLevel || isGM || isStaff,
            // Can see full catalog (including offers/coupons/dynamic pricing)?
            canSeeFullCatalog: isSuperLevel || isGM,
            // Can see scoped catalog (attractions, combos, offers, dynamic pricing)?
            canSeeScopedCatalog: isStaff,
            // Can see editor catalog (attractions, combos, addons, banners, pages, blogs, gallery)?
            canSeeEditorCatalog: isEditor,
            // Can see revenue/settings?
            canSeeRevenue: isSuperLevel || isGM,
            canSeeSettings: isSuperLevel || isGM,
            // Can see people/users section?
            canSeeUsers: isSuperLevel || isGM,
        };
    }, [rawRoles, scopes, isSuperAdmin]);
}
