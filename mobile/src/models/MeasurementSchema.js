
export const MeasurementSchema = {
    name: 'Measurement',
    embedded: true, // Important: defines this as an embedded object
    properties: {
        chest: 'int[]',
        waist: 'int?',
        roundsleeve: 'int[]',
        shoulder: 'int?',
        toplength: 'int?',
        trouserlength: 'int?',
        thigh: 'int?',
        knee: 'int?',
        ankle: 'int?',
        neck: 'int?',
        sleeveLength: 'int[]',
    },
};
