import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundContainer from '../components/BackgroundContainer';
import ClientCard from '../components/ClientCard';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const ClientsScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/clients');
            setClients(data);
            setFilteredClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchClients);
        return unsubscribe;
    }, [navigation, fetchClients]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            const filtered = clients.filter((client) =>
                client.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients(clients);
        }
    };

    const handleDeleteClient = (clientId) => {
        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await api.delete(`/clients/${clientId}`);
                            showNotification('Client deleted successfully!', 'success');
                            fetchClients(); // Refresh the list
                        } catch (err) {
                            showNotification(err.response?.data?.msg || 'Failed to delete client.', 'error');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const renderHeader = () => (
        <>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Client Management</Text>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Total Clients</Text>
                    <Text style={styles.balanceValue}>{clients.length}</Text>
                </View>
            </View>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.COLORS.textMedium} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor={theme.COLORS.textMedium}
                />
            </View>
        </>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
        );
    }

    return (
        <BackgroundContainer>
            <FlatList
                data={filteredClients}
                renderItem={({ item }) => (
                    <ClientCard
                        client={item}
                        onView={() => navigation.navigate('ClientDetail', { clientId: item._id })}
                        onEdit={() => navigation.navigate('AddClient', { client: item })}
                        onDelete={() => handleDeleteClient(item._id)}
                    />
                )}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No clients found.</Text>
                        <Text style={styles.emptyStateSubText}>
                            {searchQuery ? `No results for "${searchQuery}"` : "Tap the '+' button to add a new client!"}
                        </Text>
                    </View>
                }
            />
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddClient')}>
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
        paddingBottom: 80, // Space for FAB
    },
    headerContainer: {
        backgroundColor: theme.COLORS.primary,
        paddingHorizontal: theme.SPACING.lg,
        paddingTop: theme.SPACING.lg,
        paddingBottom: theme.SPACING.xl, // More space for search bar overlap
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        marginHorizontal: theme.SPACING.lg,
        marginTop: -theme.SPACING.xl + 10, // Overlap header
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

export default ClientsScreen;
