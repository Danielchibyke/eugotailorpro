import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ScrollView,
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import { getApi } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

import MeasurementForm from '../components/MeasurementForm';

const AddEditMeasurementScreen = ({ route, navigation }) => {
    const { clientId, measurements: initialMeasurements, template, isTemplate } = route.params;

    const [templateName, setTemplateName] = useState(template?.name || '');
    const [measurements, setMeasurements] = useState(initialMeasurements || template?.measurements || {});

    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    const handleSave = async () => {
        setLoading(true);
        try {
            if (isTemplate) {
                if (!templateName) {
                    Alert.alert('Error', 'Template name is required.');
                    setLoading(false);
                    return;
                }
                const templateData = {
                    name: templateName,
                    measurements: measurements,
                };
                if (template) {
                    await getApi().put(`/clients/${template._id}/measurements`, templateData);
                    showNotification('Measurement template updated successfully!', 'success');
                } else {
                    await getApi().post('/measurements', templateData);
                    showNotification('Measurement template created successfully!', 'success');
                }
            } else {
                console.log('Sending measurements to backend:', measurements);
                await getApi().put(`/clients/${clientId}/measurements`, measurements);
                showNotification('Measurements saved successfully!', 'success');
            }

            navigation.goBack();
        } catch (error) {
            console.error('Failed to save measurement:', error.response?.data || error);
            showNotification(error.response?.data?.msg || 'Failed to save measurements.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const headerTitle = isTemplate ? (template ? 'Edit Template' : 'Add Template') : 'Edit Measurements';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView>
                <MeasurementForm
                    initialMeasurements={initialMeasurements || template?.measurements}
                    onMeasurementsChange={setMeasurements}
                    isTemplate={isTemplate}
                    initialTemplateName={templateName}
                />
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.md,
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    form: {
        padding: theme.SPACING.lg,
    },
    inputGroup: {
        marginBottom: theme.SPACING.md,
    },
    label: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
    },
    saveButton: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
        marginTop: theme.SPACING.md,
    },
    saveButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.md,
    },
    disabledButton: {
        backgroundColor: theme.COLORS.textMedium,
    },
});

export default AddEditMeasurementScreen;
