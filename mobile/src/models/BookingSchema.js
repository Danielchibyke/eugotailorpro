// schemas/BookingSchema.js
export const BookingSchema = {
    name: 'Booking',
    primaryKey: '_id',
    properties: {
        _id: 'objectId',
        client: 'Client',
        bookingDate: 'date',
        deliveryDate: 'date?',
        reminderDate: 'date?',
        status: 'string',
        notes: 'string?',
        bookedBy: 'objectId',
        design: 'string?',
        price: 'double',
        payment: 'double',
        createdAt: 'date',
        updatedAt: 'date',
        syncStatus: 'string?', // synced, pending, error
    },
};
