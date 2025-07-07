import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const AddClientScreen = ({ navigation, route }) => {
    const { client } = route.params || {};
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        measurement: {
            chest: [0, 0],
            waist: 0,
            roundsleeve: [0, 0, 0],
            shoulder: 0,
            toplength: 0,
            trouserlength: 0,
            thigh: 0,
            knee: 0,
            ankle: 0,
            neck: 0,
            sleeveLength: [0, 0, 0],
        },
    });
    const { showNotification } = useNotification();

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address || '',
                measurement: client.measurement || formData.measurement,
            });
        }
    }, [client]);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleMeasurementChange = (field, value, index = null) => {
        const newMeasurement = { ...formData.measurement };
        if (index !== null) {
            newMeasurement[field][index] = value;
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
        try {
            if (client) {
                await api.put(`/clients/${client._id}`, formData);
                showNotification('Client updated successfully!', 'success');
            } else {
                await api.post('/clients', formData);
                showNotification('Client added successfully!', 'success');
            }
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to save client.', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <TopNavbar />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>{client ? 'Edit Client' : 'Add Client'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={formData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                />

                <Text style={styles.subHeading}>Measurements</Text>
                
                <Text style={styles.measurementLabel}>Top Measurements</Text>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Neck (N)</Text><TextInput style={styles.input} placeholder="Neck" value={formData.measurement.neck.toString()} onChangeText={(value) => handleMeasurementChange('neck', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Shoulder (SH)</Text><TextInput style={styles.input} placeholder="Shoulder" value={formData.measurement.shoulder.toString()} onChangeText={(value) => handleMeasurementChange('shoulder', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}>
                    <Text style={styles.inputLabel}>Chest (CH)</Text>
                    <TextInput style={styles.inputHalf} placeholder="Chest 1" value={formData.measurement.chest[0].toString()} onChangeText={(value) => handleMeasurementChange('chest', value, 0)} keyboardType="numeric" />
                    <TextInput style={styles.inputHalf} placeholder="Chest 2" value={formData.measurement.chest[1].toString()} onChangeText={(value) => handleMeasurementChange('chest', value, 1)} keyboardType="numeric" />
                </View>
                <View style={styles.measurementRow}>
                    <Text style={styles.inputLabel}>Sleeve Length (SL)</Text>
                    <TextInput style={styles.inputThird} placeholder="Sleeve 1" value={formData.measurement.sleeveLength[0].toString()} onChangeText={(value) => handleMeasurementChange('sleeveLength', value, 0)} keyboardType="numeric" />
                    <TextInput style={styles.inputThird} placeholder="Sleeve 2" value={formData.measurement.sleeveLength[1].toString()} onChangeText={(value) => handleMeasurementChange('sleeveLength', value, 1)} keyboardType="numeric" />
                    <TextInput style={styles.inputThird} placeholder="Sleeve 3" value={formData.measurement.sleeveLength[2].toString()} onChangeText={(value) => handleMeasurementChange('sleeveLength', value, 2)} keyboardType="numeric" />
                </View>
                <View style={styles.measurementRow}>
                    <Text style={styles.inputLabel}>Round Sleeve (RS)</Text>
                    <TextInput style={styles.inputThird} placeholder="Round Sleeve 1" value={formData.measurement.roundsleeve[0].toString()} onChangeText={(value) => handleMeasurementChange('roundsleeve', value, 0)} keyboardType="numeric" />
                    <TextInput style={styles.inputThird} placeholder="Round Sleeve 2" value={formData.measurement.roundsleeve[1].toString()} onChangeText={(value) => handleMeasurementChange('roundsleeve', value, 1)} keyboardType="numeric" />
                    <TextInput style={styles.inputThird} placeholder="Round Sleeve 3" value={formData.measurement.roundsleeve[2].toString()} onChangeText={(value) => handleMeasurementChange('roundsleeve', value, 2)} keyboardType="numeric" />
                </View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Top Length (L)</Text><TextInput style={styles.input} placeholder="Top Length" value={formData.measurement.toplength.toString()} onChangeText={(value) => handleMeasurementChange('toplength', value)} keyboardType="numeric" /></View>

                <Text style={styles.measurementLabel}>Bottom Measurements</Text>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Waist (W)</Text><TextInput style={styles.input} placeholder="Waist" value={formData.measurement.waist.toString()} onChangeText={(value) => handleMeasurementChange('waist', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Thigh (T)</Text><TextInput style={styles.input} placeholder="Thigh" value={formData.measurement.thigh.toString()} onChangeText={(value) => handleMeasurementChange('thigh', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Knee (K)</Text><TextInput style={styles.input} placeholder="Knee" value={formData.measurement.knee.toString()} onChangeText={(value) => handleMeasurementChange('knee', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Ankle (A)</Text><TextInput style={styles.input} placeholder="Ankle" value={formData.measurement.ankle.toString()} onChangeText={(value) => handleMeasurementChange('ankle', value)} keyboardType="numeric" /></View>
                <View style={styles.measurementRow}><Text style={styles.inputLabel}>Trouser Length (L)</Text><TextInput style={styles.input} placeholder="Trouser Length" value={formData.measurement.trouserlength.toString()} onChangeText={(value) => handleMeasurementChange('trouserlength', value)} keyboardType="numeric" /></View>

                <TouchableOpacity style={styles.button} onPress={handleSaveClient}>
                    <Text style={styles.buttonText}>{client ? 'Save Changes' : 'Add Client'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    content: {
        padding: theme.SPACING.md,
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
        textAlign: 'center',
    },
    subHeading: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginTop: theme.SPACING.lg,
        marginBottom: theme.SPACING.md,
    },
    measurementLabel: {
        fontSize: theme.FONT_SIZES.h4,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginTop: theme.SPACING.md,
        marginBottom: theme.SPACING.sm,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    measurementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputHalf: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
        width: '48%',
    },
    inputThird: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
        width: '32%',
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
        marginTop: theme.SPACING.lg,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputLabel: {
        width: '30%',
        textAlignVertical: 'center',
    },
});

export default AddClientScreen;