import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealm, useQuery } from '../config/realmConfig';
import Realm from 'realm';
import BackgroundContainer from '../components/BackgroundContainer';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const BookingsScreen = ({ navigation }) => {
  const realm = useRealm();
  const bookingsFromRealm = useQuery('Booking');
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings from API...');
      const { data } = await api.get('/bookings');
      console.log(`API returned ${data.length} bookings.`);
      
      realm.write(() => {
        // Create a map of existing bookings for efficient updates
        const existingBookings = new Map();
        realm.objects('Booking').forEach(booking => {
          existingBookings.set(booking._id.toString(), booking);
        });

        data.forEach(bookingData => {
          try {
            // --- Robust Validation Step ---
            const bookingIdIsValid = Realm.BSON.ObjectId.isValid(bookingData._id);
            const clientIdIsValid = Realm.BSON.ObjectId.isValid(bookingData.client?._id);
            const clientCreatedByIsValid = Realm.BSON.ObjectId.isValid(bookingData.client?.createdBy);
            const bookedByIsValid = Realm.BSON.ObjectId.isValid(bookingData.bookedBy);

            if (!bookingIdIsValid || !clientIdIsValid || !clientCreatedByIsValid || !bookedByIsValid) {
              console.warn('Skipping booking due to invalid BSON ObjectId. Details:', {
                bookingId: bookingData._id,
                clientId: bookingData.client?._id,
                clientCreatedBy: bookingData.client?.createdBy,
                bookedBy: bookingData.bookedBy,
              });
              return; // Skip this iteration
            }
            // --- End Validation Step ---

            // Process client data
            let clientRealmObject = realm.objectForPrimaryKey('Client', new Realm.BSON.ObjectId(bookingData.client._id));
            if (!clientRealmObject) {
              clientRealmObject = realm.create('Client', {
                _id: new Realm.BSON.ObjectId(bookingData.client._id),
                name: bookingData.client.name,
                email: bookingData.client.email || null,
                phone: bookingData.client.phone,
                address: bookingData.client.address || null,
                notes: bookingData.client.notes || null,
                createdBy: new Realm.BSON.ObjectId(bookingData.client.createdBy),
                measurement: bookingData.client.measurement ? {
                  chest: (bookingData.client.measurement.chest || []).map(v => parseInt(v, 10) || 0),
                  waist: parseInt(bookingData.client.measurement.waist, 10) || 0,
                  roundsleeve: (bookingData.client.measurement.roundsleeve || []).map(v => parseInt(v, 10) || 0),
                  shoulder: parseInt(bookingData.client.measurement.shoulder, 10) || 0,
                  toplength: parseInt(bookingData.client.measurement.toplength, 10) || 0,
                  trouserlength: parseInt(bookingData.client.measurement.trouserlength, 10) || 0,
                  thigh: parseInt(bookingData.client.measurement.thigh, 10) || 0,
                  knee: parseInt(bookingData.client.measurement.knee, 10) || 0,
                  ankle: parseInt(bookingData.client.measurement.ankle, 10) || 0,
                  neck: parseInt(bookingData.client.measurement.neck, 10) || 0,
                  sleeveLength: (bookingData.client.measurement.sleeveLength || []).map(v => parseInt(v, 10) || 0),
                } : null,
                createdAt: new Date(bookingData.client.createdAt),
                updatedAt: new Date(bookingData.client.updatedAt),
              }, Realm.UpdateMode.Modified);
            }

            const bookingPayload = {
              _id: new Realm.BSON.ObjectId(bookingData._id),
              client: clientRealmObject,
              bookingDate: new Date(bookingData.bookingDate),
              deliveryDate: bookingData.deliveryDate ? new Date(bookingData.deliveryDate) : null,
              reminderDate: bookingData.reminderDate ? new Date(bookingData.reminderDate) : null,
              status: bookingData.status,
              notes: bookingData.notes || null,
              bookedBy: new Realm.BSON.ObjectId(bookingData.bookedBy),
              design: bookingData.design || null,
              price: bookingData.price || 0,
              payment: bookingData.payment || 0,
              createdAt: new Date(bookingData.createdAt),
              updatedAt: new Date(bookingData.updatedAt),
              syncStatus: 'synced',
            };
            
            realm.create('Booking', bookingPayload, Realm.UpdateMode.Modified);

          } catch (err) {
            console.error('Error processing booking:', err, 'Booking data:', bookingData);
          }
        });

        // Delete bookings that no longer exist in the API response
        const apiBookingIds = new Set(data.map(b => b._id));
        realm.objects('Booking').forEach(booking => {
          if (!apiBookingIds.has(booking._id.toString())) {
            realm.delete(booking);
          }
        });
      });
      
      showNotification('Bookings synced successfully!', 'success');
    } catch (err) {
      console.error('Failed to fetch bookings from API:', err);
      showNotification(err.response?.data?.msg || 'Failed to fetch bookings. Displaying cached data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [realm, showNotification]);

  useEffect(() => {
    setLoading(false);
    const unsubscribe = navigation.addListener('focus', fetchBookings);
    return unsubscribe;
  }, [navigation, fetchBookings]);

  const handleEditBooking = (booking) => {
    navigation.navigate('AddBooking', { booking: booking.toJSON() });
  };

  const handleDeleteBooking = (bookingId) => {
    Alert.alert(
      "Delete Booking",
      "Are you sure you want to delete this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await api.delete(`/bookings/${bookingId}`);
              realm.write(() => {
                const bookingToDelete = realm.objectForPrimaryKey('Booking', 
                  typeof bookingId === 'string' ? new Realm.BSON.ObjectId(bookingId) : bookingId
                );
                if (bookingToDelete) {
                  realm.delete(bookingToDelete);
                }
              });
              showNotification('Booking deleted successfully!', 'success');
            } catch (err) {
              showNotification(err.response?.data?.msg || "Failed to delete booking.", 'error');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleCompleteBooking = async (booking) => {
    try {
      const updatedBooking = { ...booking.toJSON(), status: 'Completed' };
      const { data } = await api.put(`/bookings/${booking._id.toHexString()}`, updatedBooking);
      realm.write(() => {
        booking.status = data.status;
        booking.updatedAt = new Date(data.updatedAt);
      });
      showNotification('Booking marked as completed!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.msg || "Failed to update booking status.", 'error');
    }
  };

  const totalBookings = bookingsFromRealm.length;
  const pendingBookings = bookingsFromRealm.filter(b => b.status === 'Pending').length;
  const completedBookings = bookingsFromRealm.filter(b => b.status === 'Completed').length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Bookings Overview</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Total Bookings</Text>
        <Text style={styles.balanceValue}>{totalBookings}</Text>
      </View>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: theme.COLORS.warning }]}>{pendingBookings}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: theme.COLORS.success }]}>{completedBookings}</Text>
        </View>
      </View>
    </View>
  );

  if (loading && bookingsFromRealm.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  return (
    <BackgroundContainer>
      <FlatList
        data={bookingsFromRealm.sorted('createdAt', true)}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onView={() => navigation.navigate('BookingDetail', { bookingId: item._id.toHexString() })}
            onEdit={() => handleEditBooking(item)}
            onDelete={() => handleDeleteBooking(item._id.toHexString())}
            onComplete={() => handleCompleteBooking(item)}
          />
        )}
        keyExtractor={(item) => item._id.toHexString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No bookings yet.</Text>
            <Text style={styles.emptyStateSubText}>Tap the '+' button to add one!</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddBooking')}
      >
        <Ionicons name="add" size={30} color={theme.COLORS.textLight} />
      </TouchableOpacity>
    </BackgroundContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.backgroundApp,
  },
  list: {
    paddingBottom: 80,
  },
  headerContainer: {
    backgroundColor: theme.COLORS.primary,
    padding: theme.SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: theme.SPACING.md,
  },
  headerTitle: {
    fontSize: theme.FONT_SIZES.h2,
    fontWeight: 'bold',
    color: theme.COLORS.textLight,
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  balanceLabel: {
    fontSize: theme.FONT_SIZES.body,
    color: theme.COLORS.textLight,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.COLORS.textLight,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.BORDERRADIUS.md,
    padding: theme.SPACING.md,
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.FONT_SIZES.sm,
    color: theme.COLORS.textLight,
  },
  summaryValue: {
    fontSize: theme.FONT_SIZES.h3,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: theme.SPACING.lg,
  },
  emptyStateText: {
    fontSize: theme.FONT_SIZES.lg,
    fontWeight: 'bold',
    color: theme.COLORS.textMedium,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: theme.FONT_SIZES.body,
    color: theme.COLORS.textMedium,
    marginTop: theme.SPACING.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default BookingsScreen;