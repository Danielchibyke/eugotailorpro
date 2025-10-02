import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
} from 'react-native';
import { theme } from '../styles/theme';

const MeasurementForm = ({ initialMeasurements = {}, onMeasurementsChange, isTemplate = false, initialTemplateName = '' }) => {
    const [templateName, setTemplateName] = useState(initialTemplateName);
    const [chest, setChest] = useState(initialMeasurements?.chest?.join(',') || '');
    const [waist, setWaist] = useState(initialMeasurements?.waist?.toString() || '');
    const [roundsleeve, setRoundsleeve] = useState(initialMeasurements?.roundsleeve?.join(',') || '');
    const [shoulder, setShoulder] = useState(initialMeasurements?.shoulder?.toString() || '');
    const [toplength, setToplength] = useState(initialMeasurements?.toplength?.toString() || '');
    const [trouserlength, setTrouserlength] = useState(initialMeasurements?.trouserlength?.toString() || '');
    const [thigh, setThigh] = useState(initialMeasurements?.thigh?.toString() || '');
    const [knee, setKnee] = useState(initialMeasurements?.knee?.toString() || '');
    const [ankle, setAnkle] = useState(initialMeasurements?.ankle?.toString() || '');
    const [neck, setNeck] = useState(initialMeasurements?.neck?.toString() || '');
    const [sleeveLength, setSleeveLength] = useState(initialMeasurements?.sleeveLength?.join(',') || '');

    useEffect(() => {
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
        onMeasurementsChange(parsedMeasurements, templateName);
    }, [chest, waist, roundsleeve, shoulder, toplength, trouserlength, thigh, knee, ankle, neck, sleeveLength, templateName, onMeasurementsChange]);

    return (
        <View style={styles.form}>
            {isTemplate && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Template Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Template Name"
                        placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
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
                    placeholderTextColor={theme.COLORS.textMedium}
                    value={sleeveLength}
                    onChangeText={setSleeveLength}
                    keyboardType="numeric"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    form: {
        // No padding here, as it will be applied by the parent screen
    },
    inputGroup: {
        marginBottom: theme.SPACING.md,
    },
    label: {
        fontSize: theme.FONT_SIZES.body, // Changed from md to body for consistency with other forms
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
        fontWeight: '600', // Use string for fontWeight
    },
    input: {
        backgroundColor: theme.COLORS.backgroundApp, // Use backgroundApp for inputs
        borderWidth: 1,
        borderColor: theme.COLORS.border, // Add a border
        borderRadius: theme.BORDERRADIUS.sm,
        paddingVertical: theme.SPACING.md, // Adjusted padding for better height
        paddingHorizontal: theme.SPACING.md,
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    // New style for array items to give them some spacing
    inputArrayItem: {
        width: 70, // Fixed width for array items
        textAlign: 'center',
        marginLeft: theme.SPACING.sm, // Add margin between items
    },
    // New style for containing multiple inputs in a row (e.g., for chest, roundsleeve)
    multiInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Distribute space
        alignItems: 'center',
        flexWrap: 'wrap', // Allow wrapping if many inputs
    },
});

export default MeasurementForm;
