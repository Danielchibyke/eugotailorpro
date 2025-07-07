import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import ClientCard from '../components/ClientCard';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';

const ClientsScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { showNotification } = useNotification();

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
            setFilteredClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchClients();
        });
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

    const handleDeleteClient = async (clientId) => {
        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await api.delete(`/clients/${clientId}`);
                            showNotification('Client deleted successfully!', 'success');
                            fetchClients();
                        } catch (err) {
                            showNotification(err.response?.data?.msg || 'Failed to delete client.', 'error');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <TopNavbar />
            <View style={styles.header}>
                <Text style={styles.heading}>Clients</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddClient')}>
                    <Ionicons name="ios-add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add Client</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
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
                    ListEmptyComponent={<Text style={styles.noClientsText}>No clients found.</Text>}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.SPACING.md,
        backgroundColor: theme.COLORS.backgroundCard,
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.primary,
        paddingVertical: theme.SPACING.sm,
        paddingHorizontal: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: theme.SPACING.sm,
    },
    content: {
        flex: 1,
        padding: theme.SPACING.md,
    },
    searchInput: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    noClientsText: {
        textAlign: 'center',
        marginTop: theme.SPACING.lg,
        color: theme.COLORS.textMedium,
    },
});

export default ClientsScreen;