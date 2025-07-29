// schemas/DashboardStatsSchema.js
export const DashboardStatsSchema = {
    name: 'DashboardStats',
    primaryKey: '_id',
    properties: {
        _id: 'string', // Use a fixed ID to always update the same object
        totalClients: 'int',
        totalBookings: 'int',
        pendingBookings: 'int',
        completedBookings: 'int',
        totalRevenue: 'double',
        totalOutstanding: 'double',
        updatedAt: 'date',
    },
};
