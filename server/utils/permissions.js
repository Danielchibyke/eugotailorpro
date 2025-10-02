
export const PERMISSIONS = {
    // User Permissions
    USERS_VIEW: 'users:view',
    USERS_MANAGE: 'users:manage',

    // Client Permissions
    CLIENTS_VIEW: 'clients:view',
    CLIENTS_CREATE: 'clients:create',
    CLIENTS_EDIT: 'clients:edit',
    CLIENTS_DELETE: 'clients:delete',

    // Booking Permissions
    BOOKINGS_VIEW: 'bookings:view',
    BOOKINGS_CREATE: 'bookings:create',
    BOOKINGS_EDIT: 'bookings:edit',
    BOOKINGS_DELETE: 'bookings:delete',

    // Financial Permissions
    FINANCIALS_VIEW: 'financials:view',
    FINANCIALS_MANAGE: 'financials:manage',

    // Measurement Permissions
    MEASUREMENTS_VIEW: 'measurements:view',
    MEASUREMENTS_EDIT: 'measurements:edit',
};

export const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    USER: 'user', // Added 'user' role
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_MANAGE,
        PERMISSIONS.CLIENTS_VIEW,
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CLIENTS_EDIT,
        PERMISSIONS.CLIENTS_DELETE,
        PERMISSIONS.BOOKINGS_VIEW,
        PERMISSIONS.BOOKINGS_CREATE,
        PERMISSIONS.BOOKINGS_EDIT,
        PERMISSIONS.BOOKINGS_DELETE,
        PERMISSIONS.FINANCIALS_VIEW,
        PERMISSIONS.FINANCIALS_MANAGE,
        PERMISSIONS.MEASUREMENTS_VIEW,
        PERMISSIONS.MEASUREMENTS_EDIT,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.CLIENTS_VIEW,
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CLIENTS_EDIT,
        PERMISSIONS.BOOKINGS_VIEW,
        PERMISSIONS.BOOKINGS_CREATE,
        PERMISSIONS.BOOKINGS_EDIT,
        PERMISSIONS.FINANCIALS_VIEW,
        PERMISSIONS.MEASUREMENTS_VIEW,
    ],
    [ROLES.USER]: [
        // Default permissions for a regular user, if any
        // For now, assuming a regular user has no special permissions beyond basic app access
    ],
};

// Function to get effective permissions for a user, combining role-based and custom permissions
export const getUserEffectivePermissions = (user) => {
    if (!user) return [];

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const customPermissions = user.customPermissions || [];

    let effectivePermissions = new Set(rolePermissions);

    for (const permission of customPermissions) {
        effectivePermissions.add(permission);
    }

    return Array.from(effectivePermissions);
};
