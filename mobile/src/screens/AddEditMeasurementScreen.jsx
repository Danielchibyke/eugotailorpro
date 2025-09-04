import React, { useState } from 'react';
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

const AddEditMeasurementScreen = ({ route, navigation }) => {
    const { clientId, measurements: initialMeasurements, template, isTemplate } = route.params;

    const [templateName, setTemplateName] = useState(template?.name || '');
    const [chest, setChest] = useState(template?.measurements?.chest?.join('|') || initialMeasurements?.chest?.join(' - ') || '');
    const [waist, setWaist] = useState(template?.measurements?.waist?.toString() || initialMeasurements?.waist?.toString() || '');
    const [roundsleeve, setRoundsleeve] = useState(template?.measurements?.roundsleeve?.join('|') || initialMeasurements?.roundsleeve?.join(' - ') || '');
    const [shoulder, setShoulder] = useState(template?.measurements?.shoulder?.toString() || initialMeasurements?.shoulder?.toString() || '');
    const [toplength, setToplength] = useState(template?.measurements?.toplength?.toString() || initialMeasurements?.toplength?.toString() || '');
    const [trouserlength, setTrouserlength] = useState(template?.measurements?.trouserlength?.toString() || initialMeasurements?.trouserlength?.toString() || '');
    const [thigh, setThigh] = useState(template?.measurements?.thigh?.toString() || initialMeasurements?.thigh?.toString() || '');
    const [knee, setKnee] = useState(template?.measurements?.knee?.toString() || initialMeasurements?.knee?.toString() || '');
    const [ankle, setAnkle] = useState(template?.measurements?.ankle?.toString() || initialMeasurements?.ankle?.toString() || '');
    const [neck, setNeck] = useState(template?.measurements?.neck?.toString() || initialMeasurements?.neck?.toString() || '');
    const [sleeveLength, setSleeveLength] = useState(template?.measurements?.sleeveLength?.join('|') || initialMeasurements?.sleeveLength?.join(' - ') || '');

    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    const handleSave = async () => {
        setLoading(true);
        try {
            const parsedMeasurements = {
                chest: chest.split(',').map(Number).filter(n => !isNaN(n)),
                waist: Number(waist) || 0,
                roundsleeve: roundsleeve.split(',').map(Number).filter(n => !isNaN(n)),
                shoulder: Number(shoulder) || 0,
                toplength: Number(toplength) || 0,
                trouserlength: Number(trouserlength) || 0,
                thigh: Number(thigh) || 0,
                knee: Number(knee) || 0,
                ankle: Number(ankle) || 0,
                neck: Number(neck) || 0,
                sleeveLength: sleeveLength.split(',').map(Number).filter(n => !isNaN(n)),
            };

            if (isTemplate) {
                if (!templateName) {
                    Alert.alert('Error', 'Template name is required.');
                    setLoading(false);
                    return;
                }
                const templateData = {
                    name: templateName,
                    measurements: parsedMeasurements,
                };
                if (template) {
                    await getApi().put(`/clients/${template._id}/measurements`, templateData);
                    showNotification('Measurement template updated successfully!', 'success');
                } else {
                    await getApi().post('/measurements', templateData);
                    showNotification('Measurement template created successfully!', 'success');
                }
            } else {
                console.log('Sending parsedMeasurements to backend:', parsedMeasurements); // Add this line
                await getApi().put(`/clients/${clientId}/measurements`, parsedMeasurements);
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
                <View style={styles.form}>
                    {isTemplate && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Template Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Template Name"
                                value={templateName}
                                onChangeText={setTemplateName}
                            />
                        </View>
                    )}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Chest</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 38,15"
                            value={chest}
                            onChangeText={setChest}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Waist</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 32"
                            value={waist}
                            onChangeText={setWaist}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Round Sleeve</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 10,5,2"
                            value={roundsleeve}
                            onChangeText={setRoundsleeve}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Shoulder</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 18"
                            value={shoulder}
                            onChangeText={setShoulder}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Top Length</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 28"
                            value={toplength}
                            onChangeText={setToplength}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Trouser Length</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 40"
                            value={trouserlength}
                            onChangeText={setTrouserlength}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Thigh</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 24"
                            value={thigh}
                            onChangeText={setThigh}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Knee</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 16"
                            value={knee}
                            onChangeText={setKnee}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ankle</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 10"
                            value={ankle}
                            onChangeText={setAnkle}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Neck</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 15"
                            value={neck}
                            onChangeText={setNeck}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Sleeve Length</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 24,10,5"
                            value={sleeveLength}
                            onChangeText={setSleeveLength}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
});

export default AddEditMeasurementScreen;
