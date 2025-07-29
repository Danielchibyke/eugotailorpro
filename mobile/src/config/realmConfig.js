import { createRealmContext } from '@realm/react';
import { BookingSchema } from '../models/BookingSchema';
import { ClientSchema } from '../models/ClientSchema';
import { MeasurementSchema } from '../models/MeasurementSchema';
import { DashboardStatsSchema } from '../models/DashboardStatsSchema';

// Create a realm context for the entire app
export const { RealmProvider, useRealm, useObject, useQuery } = createRealmContext({
  schema: [BookingSchema, ClientSchema, MeasurementSchema, DashboardStatsSchema],
  schemaVersion: 4, // Increment the version number
  onMigration: (oldRealm, newRealm) => {
    // This migration function will be called automatically if the schema version changes.
    if (oldRealm.schemaVersion < 3) {
      // Add the 'syncStatus' property to existing objects
      const oldBookings = oldRealm.objects('Booking');
      const newBookings = newRealm.objects('Booking');
      for (let i = 0; i < oldBookings.length; i++) {
        newBookings[i].syncStatus = 'synced';
      }

      const oldClients = oldRealm.objects('Client');
      const newClients = newRealm.objects('Client');
      for (let i = 0; i < oldClients.length; i++) {
        newClients[i].syncStatus = 'synced';
      }
    }
    if (oldRealm.schemaVersion < 4) {
        // Nothing to do for this migration, new schema will be created automatically
    }
  },
});
