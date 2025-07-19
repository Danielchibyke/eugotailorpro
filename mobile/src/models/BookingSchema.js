export const BookingSchema = {
    name: 'Booking',
    primaryKey: '_id',
    properties: {
        _id: 'objectId',
        client: 'Client',
        bookingDate: 'date',
        deliveryDate: 'date',
        status: 'string',
        items: 'string[]',
        totalAmount: 'double',
        amountPaid: 'double',
        balanceDue: 'double',
        notes: 'string?',
        createdBy: 'objectId',
        createdAt: 'date',
        updatedAt: 'date',
    },
};