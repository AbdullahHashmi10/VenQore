import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props;
    const userPerms = auth?.user?.permissions || [];
    const role = auth?.user?.role;
    const isAdmin = role === 'platform_admin' || role === 'admin' || role === 'owner' || Boolean(auth?.user?.is_platform_admin);

    const hasPerm = (...keys) => {
        if (isAdmin) return true;
        return keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
    };

    return {
        hasPerm,
        isAdmin,
        role,
        permissions: userPerms,
    };
}
