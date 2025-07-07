import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const ClientDetailScreen = ({ route, navigation }) => {
    const { clientId } = route.params;
    const [client, setClient] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const { showNotification } = useNotification();

    const fetchClient = useCallback(async () => {
        try {
            const { data } = await api.get(`/clients/${clientId}`);
            setClient(data);
            setName(data.name);
            setEmail(data.email);
            setPhone(data.phone);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch client details.', 'error');
        }
    }, [clientId, showNotification]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    const handleUpdateClient = async () => {
        try {
            await api.put(`/clients/${clientId}`, { name, email, phone });
            showNotification('Client updated successfully!', 'success');
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to update client.', 'error');
        }
    };

    if (!client) {
        return (
            <View style={styles.container}>
                <TopNavbar />
                <View style={styles.content}>
                    <Text>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TopNavbar />
            <View style={styles.header}>
                <Text style={styles.heading}>Client Details</Text>
            </View>
            <View style={styles.content}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.button} onPress={handleUpdateClient}>
                    <Text style={styles.buttonText}>Update Client</Text>
                </TouchableOpacity>
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
        padding: theme.SPACING.md,
        backgroundColor: theme.COLORS.backgroundCard,
        alignItems: 'center',
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    content: {
        flex: 1,
        padding: theme.SPACING.md,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ClientDetailScreen;