import { MeasurementSchema } from './MeasurementSchema';

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
        measurement: 'Measurement?', // Link to the embedded Measurement object
        createdAt: 'date',
        updatedAt: 'date',
        syncStatus: 'string?', // synced, pending, 
    }
};