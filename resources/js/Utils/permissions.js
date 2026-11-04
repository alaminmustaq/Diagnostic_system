import { usePage } from '@inertiajs/react';

/**
 * Custom hook to check granular permissions and roles in React components.
 */
export function usePermissions() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const can = (permission) => {
        if (!user) return false;
        // Super Admin has full unrestricted access
        if (user.is_super_admin) return true;

        const perms = user.permissions || [];
        if (perms.includes(permission)) return true;

        // Support interchangeable aliases for edit-* and update-*
        if (permission.startsWith('edit-')) {
            const updatePerm = 'update-' + permission.slice(5);
            if (perms.includes(updatePerm)) return true;
        } else if (permission.startsWith('update-')) {
            const editPerm = 'edit-' + permission.slice(7);
            if (perms.includes(editPerm)) return true;
        }

        return false;
    };

    const hasRole = (roleName) => {
        if (!user) return false;
        if (user.is_super_admin && roleName === 'Super Admin') return true;
        return (user.roles || []).includes(roleName);
    };

    return { can, hasRole, user };
}

