import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundContainer from '../components/BackgroundContainer';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import { useBookings } from '../hooks/useBookings';
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';
import { useAuth } from '../context/AuthContext';




const BookingsScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const { bookings, loading, refresh, deleteBooking, updateBooking } = useBookings();
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();
  const permissions = useMemo(() => getUserEffectivePermissions(user), [user.customPermissions, user.role, user]);

  const canViewBookings = permissions.includes(PERMISSIONS.BOOKINGS_VIEW);
  const canCreateBookings = permissions.includes(PERMISSIONS.BOOKINGS_CREATE);
  const canEditBookings = permissions.includes(PERMISSIONS.BOOKINGS_EDIT);
  const canDeleteBookings = permissions.includes(PERMISSIONS.BOOKINGS_DELETE);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
        refreshUser();
    });
    return unsubscribe;
  }, [navigation, refreshUser]);

  useEffect(() => {
    if (canViewBookings) {
        refresh();
    }
  }, [canViewBookings, refresh]);

  const filteredBookings = useMemo(() => {
    let sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (searchQuery) {
      return sortedBookings.filter(booking =>
        booking.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return sortedBookings;
  }, [searchQuery, bookings]);

  const handleEditBooking = useCallback((booking) => {
    navigation.navigate('AddBooking', { booking: booking });
  }, [navigation]);

  const handleDeleteBooking = useCallback((bookingId) => {
    Alert.alert(
      "Delete Booking",
      "Are you sure you want to delete this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            const result = await deleteBooking(bookingId);
            if (result.success) {
              showNotification('Booking deleted successfully!', 'success');
            } else {
              showNotification(result.error, 'error');
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [showNotification, deleteBooking]);

  const handleCompleteBooking = useCallback(async (booking) => {
    const updatedBooking = { ...booking, status: 'Completed' };
    const result = await updateBooking(booking._id, updatedBooking);
    if (result.success) {
      showNotification('Booking marked as completed!', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  }, [showNotification, updateBooking]);

  const renderBookingCard = useCallback(({ item }) => (
    <BookingCard
      booking={item}
      onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })} // Use _id directly
      onEdit={() => handleEditBooking(item)}
      onDelete={() => handleDeleteBooking(item._id)} // Use _id directly
      onComplete={() => handleCompleteBooking(item)}
    />
  ), [navigation, handleEditBooking, handleDeleteBooking, handleCompleteBooking]);

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;

  const renderHeader = () => (
    <>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.COLORS.textMedium} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.COLORS.textMedium}
        />
      </View>
    </>
  );

  if (!canViewBookings) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyStateText}>Access Denied</Text>
        <Text style={ styles.emptyStateSubText }>
          You do not have permission to view bookings.
        </Text>
      </View>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  return (
    <BackgroundContainer>
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id} // Use _id directly
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No bookings found.</Text>
            <Text style={styles.emptyStateSubText}>
              {searchQuery ? `No results for "${searchQuery}"` : "Tap the '+' button to add a new booking!"}
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={refresh}
      />
      {canCreateBookings && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddBooking')}
        >
          <Ionicons name="add" size={30} color={theme.COLORS.textLight} />
        </TouchableOpacity>
      )}
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
    paddingHorizontal: theme.SPACING.lg,
    paddingTop: theme.SPACING.lg,
    paddingBottom: theme.SPACING.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.backgroundCard,
    borderRadius: theme.BORDERRADIUS.md,
    marginHorizontal: theme.SPACING.lg,
    marginTop: -theme.SPACING.xl + 10,
    marginBottom: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: theme.FONT_SIZES.body,
    color: theme.COLORS.textDark,
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