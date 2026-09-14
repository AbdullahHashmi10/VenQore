import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth, my_role, userRole } = usePage().props;
    const userPerms = auth?.user?.permissions || [];
    const role = my_role || userRole || auth?.user?.role || (auth?.user?.is_platform_admin ? 'platform_admin' : 'owner');
    const isAdmin = role === 'platform_admin' || role === 'admin' || role === 'owner' || Boolean(auth?.user?.is_platform_admin);

    const hasPerm = (...keys) => {
        if (isAdmin) return true;
        if (!keys || keys.length === 0) return true;
        return keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
    };

    return {
        hasPerm,
        isAdmin,
        role,
        permissions: userPerms,
    };
}
