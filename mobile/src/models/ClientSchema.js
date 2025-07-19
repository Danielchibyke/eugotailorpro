export const ClientSchema = {
    name: 'Client',
    primaryKey: '_id',
    properties: {
        _id: 'objectId',
        name: 'string',
        email: 'string?', // ? denotes optional
        phone: 'string',
        address: 'string?',
        notes: 'string?',
        createdBy: 'objectId',
        measurement: {
            type: 'object',
            properties: {
                chest: 'int[]',
                waist: 'int',
                roundsleeve: 'int[]',
                shoulder: 'int',
                toplength: 'int',
                trouserlength: 'int',
                thigh: 'int',
                knee: 'int',
                ankle: 'int',
                neck: 'int',
                sleeveLength: 'int[]',
            },
        },
        createdAt: 'date',
        updatedAt: 'date',
    },
};