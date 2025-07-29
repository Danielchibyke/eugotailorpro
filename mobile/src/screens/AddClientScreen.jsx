import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRealm } from '../config/realmConfig';
import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

// Helper component for measurement inputs to handle both single and array values
const MeasurementInput = ({ label, value, onChange, keyboardType = 'numeric' }) => {
    const isArray = Array.isArray(value);

    return (
        <View style={styles.measurementRow}>
            <Text style={styles.measurementLabel}>{label}</Text>
            <View style={styles.measurementInputContainer}>
                {isArray ? (
                    value.map((item, index) => (
                        <TextInput
                            key={index}
                            style={[styles.measurementInput, styles.inputArrayItem]}
                            value={String(item || '')}
                            onChangeText={(text) => onChange(text, index)}
                            keyboardType={keyboardType}
                            placeholder="0"
                            placeholderTextColor={theme.COLORS.textMedium}
                        />
                    ))
                ) : (
                    <TextInput
                        style={styles.measurementInput}
                        value={String(value || '')}
                        onChangeText={(text) => onChange(text)}
                        keyboardType={keyboardType}
                        placeholder="0"
                        placeholderTextColor={theme.COLORS.textMedium}
                    />
                )}
            </View>
        </View>
    );
};


const AddClientScreen = ({ navigation, route }) => {
    const { client } = route.params || {};
    const realm = useRealm();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        measurement: {
            neck: '', shoulder: '', chest: ['', ''], sleeveLength: ['', '', ''], roundsleeve: ['', '', ''], toplength: '',
            waist: '', thigh: '', knee: '', ankle: '', trouserlength: '',
        },
    });
    const { showNotification } = useNotification();

    useEffect(() => {
        if (client) {
            const initialMeasurement = {
                neck: '', shoulder: '', chest: ['', ''], sleeveLength: ['', '', ''], roundsleeve: ['', '', ''], toplength: '',
                waist: '', thigh: '', knee: '', ankle: '', trouserlength: '',
            };
            
            const newMeasurement = { ...initialMeasurement };
            if (client.measurement) {
                for (const key in newMeasurement) {
                    if (client.measurement[key] !== undefined) {
                        if (Array.isArray(newMeasurement[key])) {
                            const newArray = [...newMeasurement[key]];
                            for (let i = 0; i < newArray.length; i++) {
                                newArray[i] = client.measurement[key][i] ?? '';
                            }
                            newMeasurement[key] = newArray;
                        } else {
                            newMeasurement[key] = client.measurement[key];
                        }
                    }
                }
            }

            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
                measurement: newMeasurement,
            });
        }
    }, [client]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleMeasurementChange = (field, value, index = null) => {
        const newMeasurement = { ...formData.measurement };
        if (index !== null) {
            const newArray = [...newMeasurement[field]];
            newArray[index] = value;
            newMeasurement[field] = newArray;
        } else {
            newMeasurement[field] = value;
        }
        setFormData({ ...formData, measurement: newMeasurement });
    };

    const handleSaveClient = async () => {
        if (!formData.name || !formData.phone) {
            showNotification('Please enter name and phone number.', 'error');
            return;
        }

        const payload = {
            ...formData,
            measurement: Object.entries(formData.measurement).reduce((acc, [key, value]) => {
                if (Array.isArray(value)) {
                    acc[key] = value.map(v => parseFloat(v) || 0);
                } else {
                    acc[key] = parseFloat(value) || 0;
                }
                return acc;
            }, {}),
        };

        if (client) {
            // Update existing client
            realm.write(() => {
                client.name = payload.name;
                client.email = payload.email;
                client.phone = payload.phone;
                client.address = payload.address;
                client.notes = payload.notes;
                client.measurement = payload.measurement;
                client.syncStatus = 'pending';
            });
            showNotification('Client updated locally.', 'info');
            navigation.goBack();

            try {
                const { data } = await api.put(`/clients/${client._id}`, payload);
                realm.write(() => {
                    client.syncStatus = 'synced';
                    client.updatedAt = new Date(data.updatedAt);
                });
                showNotification('Client changes synced successfully!', 'success');
            } catch (err) {
                realm.write(() => {
                    client.syncStatus = 'error';
                });
                showNotification(err.response?.data?.msg || 'Failed to sync client changes.', 'error');
            }
        } else {
            // Create new client
            let newClient;
            realm.write(() => {
                newClient = realm.create('Client', {
                    ...payload,
                    _id: new Realm.BSON.ObjectId(),
                    createdBy: new Realm.BSON.ObjectId(), // This should be the current user's ID
                    syncStatus: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            });
            showNotification('Client added locally.', 'info');
            navigation.goBack();

            try {
                const { data } = await api.post('/clients', payload);
                realm.write(() => {
                    // This is tricky because the server creates a new ID.
                    // For now, we'll just mark the local one as synced.
                    // A more robust solution would be to update the local ID with the server's ID.
                    newClient.syncStatus = 'synced';
                    newClient.updatedAt = new Date(data.updatedAt);
                });
                showNotification('New client synced successfully!', 'success');
            } catch (err) {
                realm.write(() => {
                    newClient.syncStatus = 'error';
                });
                showNotification(err.response?.data?.msg || 'Failed to sync new client.', 'error');
            }
        }
    };

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
                    />
                </View>

                <CollapsibleSection title="Measurements">
                    <MeasurementInput label="Neck (N)" value={formData.measurement.neck} onChange={(v) => handleMeasurementChange('neck', v)} />
                    <MeasurementInput label="Shoulder (SH)" value={formData.measurement.shoulder} onChange={(v) => handleMeasurementChange('shoulder', v)} />
                    <MeasurementInput label="Chest (CH)" value={formData.measurement.chest} onChange={(v, i) => handleMeasurementChange('chest', v, i)} />
                    <MeasurementInput label="Sleeve Length (SL)" value={formData.measurement.sleeveLength} onChange={(v, i) => handleMeasurementChange('sleeveLength', v, i)} />
                    <MeasurementInput label="Round Sleeve (RS)" value={formData.measurement.roundsleeve} onChange={(v, i) => handleMeasurementChange('roundsleeve', v, i)} />
                    <MeasurementInput label="Top Length (L)" value={formData.measurement.toplength} onChange={(v) => handleMeasurementChange('toplength', v)} />
                    <MeasurementInput label="Waist (W)" value={formData.measurement.waist} onChange={(v) => handleMeasurementChange('waist', v)} />
                    <MeasurementInput label="Thigh (T)" value={formData.measurement.thigh} onChange={(v) => handleMeasurementChange('thigh', v)} />
                    <MeasurementInput label="Knee (K)" value={formData.measurement.knee} onChange={(v) => handleMeasurementChange('knee', v)} />
                    <MeasurementInput label="Ankle (A)" value={formData.measurement.ankle} onChange={(v) => handleMeasurementChange('ankle', v)} />
                    <MeasurementInput label="Trouser Length (L)" value={formData.measurement.trouserlength} onChange={(v) => handleMeasurementChange('trouserlength', v)} />
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

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveClient}>
                    <Ionicons name="save-outline" size={24} color={theme.COLORS.textLight} />
                    <Text style={styles.saveButtonText}>{client ? 'Save Changes' : 'Add Client'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: theme.SPACING.md,
        paddingBottom: 40,
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
    saveButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.button,
        marginLeft: theme.SPACING.sm,
    },
});

export default AddClientScreen;
