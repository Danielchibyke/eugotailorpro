import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import { theme } from '../styles/theme';
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';

import MeasurementForm from '../components/MeasurementForm';

const AddClientScreen = ({ navigation, route }) => {
    const { client } = route.params || {};
    const { user, refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [measurements, setMeasurements] = useState({
        chest: [],
        waist: 0,
        roundsleeve: [],
        shoulder: 0,
        toplength: 0,
        trouserlength: 0,
        thigh: 0,
        knee: 0,
        ankle: 0,
        neck: 0,
        sleeveLength: [],
    });
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
    const canCreateClients = permissions.includes(PERMISSIONS.CLIENTS_CREATE);
    const canEditClients = permissions.includes(PERMISSIONS.CLIENTS_EDIT);
    const canDeleteClients = permissions.includes(PERMISSIONS.CLIENTS_DELETE);

    const isEditing = !!client;
    const hasPermission = isEditing ? canEditClients : canCreateClients;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshUser();
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
            });
            setMeasurements(client.measurements || {
                chest: [],
                waist: 0,
                roundsleeve: [],
                shoulder: 0,
                toplength: 0,
                trouserlength: 0,
                thigh: 0,
                knee: 0,
                ankle: 0,
                neck: 0,
                sleeveLength: [],
            });
        }
        setLoading(false);
    }, [client]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSaveClient = async () => {
        if (!formData.name || !formData.phone) {
            showNotification('Please enter name and phone number.', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData, measurements: measurements, createdBy: user._id };

            if (client) {
                await getApi().put(`/clients/${client._id}`, payload);
                showNotification('Client updated successfully!', 'success');
            } else {
                await getApi().post('/clients', payload);
                showNotification('Client added successfully!', 'success');
            }
            navigation.goBack();
        } catch (err) {
            console.error('Failed to save client:', err);
            showNotification(err.response?.data?.msg || 'Failed to save client.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = () => {
        if (!client) return;

        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await getApi().delete(`/clients/${client._id}`);
                            showNotification('Client deleted successfully!', 'success');
                            navigation.goBack();
                        } catch (err) {
                            showNotification(err.response?.data?.msg || 'Failed to delete client.', 'error');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
        );
    }

    if (!hasPermission) {
        return (
            <BackgroundContainer>
                <View style={styles.centeredMessageContainer}>
                    <Text style={styles.emptyStateText}>Access Denied</Text>
                    <Text style={styles.emptyStateSubText}>
                        You do not have permission to {isEditing ? 'edit' : 'create'} clients.
                    </Text>
                </View>
            </BackgroundContainer>
        );
    }

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>{client ? 'Edit Client' : 'Add New Client'}</Text>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        placeholder="Enter client's full name"
                        placeholderTextColor={theme.COLORS.textMedium}
                    />

                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        keyboardType="phone-pad"
                        placeholder="Enter client's phone number"
                        placeholderTextColor={theme.COLORS.textMedium}
                    />

                    <Text style={styles.label}>Email (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        placeholder="Enter client's email"
                        placeholderTextColor={theme.COLORS.textMedium}
                    />

                    <Text style={styles.label}>Address (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.address}
                        onChangeText={(value) => handleInputChange('address', value)}
                        placeholder="Enter client's address"
                        placeholderTextColor={theme.COLORS.textMedium}
                        multiline
                    />
                </View>

                <CollapsibleSection title="Measurements">
                    <MeasurementForm
                        initialMeasurements={measurements}
                        onMeasurementsChange={setMeasurements}
                    />
                </CollapsibleSection>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Notes (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.notes}
                        onChangeText={(value) => handleInputChange('notes', value)}
                        placeholder="Any additional notes about the client..."
                        placeholderTextColor={theme.COLORS.textMedium}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, (!hasPermission || loading) && styles.saveButtonDisabled]}
                    onPress={handleSaveClient}
                    disabled={!hasPermission || loading}
                >
                    <Ionicons name="save-outline" size={24} color={theme.COLORS.textLight} />
                    <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : (client ? 'Save Changes' : 'Add Client')}
                    </Text>
                </TouchableOpacity>

                {client && canDeleteClients && (
                    <TouchableOpacity
                        style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
                        onPress={handleDeleteClient}
                        disabled={loading}
                    >
                        <Ionicons name="trash-outline" size={24} color={theme.COLORS.textLight} />
                        <Text style={styles.deleteButtonText}>Delete Client</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: theme.SPACING.md,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundApp,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.SPACING.lg,
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
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        textAlign: 'center',
        marginBottom: theme.SPACING.lg,
    },
    formContainer: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
    },
    label: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
        fontWeight: '600',
    },
    input: {
        backgroundColor: theme.COLORS.backgroundApp,
        borderWidth: 1,
        borderColor: theme.COLORS.border,
        borderRadius: theme.BORDERRADIUS.sm,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    measurementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    measurementLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        fontWeight: '600',
        flex: 1,
    },
    measurementInputContainer: {
        flexDirection: 'row',
        flex: 1.5,
        justifyContent: 'flex-end',
    },
    measurementInput: {
        borderWidth: 1,
        borderColor: theme.COLORS.border,
        borderRadius: theme.BORDERRADIUS.sm,
        paddingVertical: theme.SPACING.sm,
        paddingHorizontal: theme.SPACING.md,
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        width: 70,
        textAlign: 'center',
    },
    inputArrayItem: {
        marginLeft: theme.SPACING.sm,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginTop: theme.SPACING.lg,
    },
    saveButtonDisabled: {
        backgroundColor: theme.COLORS.textMedium,
        opacity: 0.7,
    },
    saveButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.button,
        marginLeft: theme.SPACING.sm,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.danger,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginTop: theme.SPACING.md,
    },
    deleteButtonDisabled: {
        backgroundColor: theme.COLORS.textMedium,
        opacity: 0.7,
    },
    deleteButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.button,
        marginLeft: theme.SPACING.sm,
    },
});

export default AddClientScreen;
